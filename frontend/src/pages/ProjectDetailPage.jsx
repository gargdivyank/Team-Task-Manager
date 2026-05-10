import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import Badge from '../components/ui/Badge.jsx';
import Modal from '../components/ui/Modal.jsx';
import { apiMessage } from '../utils/apiError.js';
import { nid } from '../utils/ids.js';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [newMemberId, setNewMemberId] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [pRes, tRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get('/tasks', { params: { projectId: id } }),
      ]);
      setProject(pRes.data.data);
      setTasks(tRes.data.data || []);
      if (isAdmin) {
        const uRes = await api.get('/users');
        setUsers(uRes.data.data || []);
      }
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isAdmin]);

  const memberIds = useMemo(() => {
    if (!project) return new Set();
    const s = new Set();
    if (project.createdBy) s.add(nid(project.createdBy));
    (project.members || []).forEach((m) => s.add(nid(m)));
    return s;
  }, [project]);

  const availableUsersToAdd = users.filter((u) => !memberIds.has(u.id));

  const addMember = async (e) => {
    e.preventDefault();
    if (!newMemberId) return;
    setBusy(true);
    try {
      await api.post(`/projects/${id}/members`, { userId: newMemberId });
      setMemberModalOpen(false);
      setNewMemberId('');
      await load();
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const removeMember = async (uid) => {
    if (!window.confirm('Remove this member from the project?')) return;
    setBusy(true);
    try {
      await api.delete(`/projects/${id}/members/${uid}`);
      await load();
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const deleteProject = async () => {
    if (!window.confirm('Permanently delete this project and all tasks?')) return;
    setBusy(true);
    try {
      await api.delete(`/projects/${id}`);
      navigate('/projects');
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Spinner />;
  if (error || !project) {
    return (
      <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-8 text-center text-sm text-rose-100">
        {error || 'Project not found'}{' '}
        <Link className="ml-2 font-semibold text-brand-200" to="/projects">
          Back to list
        </Link>
      </div>
    );
  }

  const pct = project.progress?.percent ?? 0;

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-lg border border-amber-400/40 bg-amber-950/30 px-3 py-2 text-sm text-amber-100">{error}</div>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-6">
        <div className="min-w-[220px] flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-semibold text-white">{project.title}</h2>
            <Badge>{project.status}</Badge>
          </div>
          <p className="mt-2 max-w-prose whitespace-pre-wrap text-sm text-slate-400">{project.description}</p>
          <p className="mt-3 text-xs text-slate-500">
            {new Date(project.startDate).toLocaleDateString()} – {new Date(project.endDate).toLocaleDateString()} · Owned by{' '}
            <span className="font-medium text-slate-300">{project.createdBy?.name}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <>
              <Link
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500"
                to={`/tasks/new?project=${id}`}
              >
                New task
              </Link>
              <Link className="btn-outline rounded-lg px-4 py-2 text-sm font-semibold" to={`/projects/${id}/edit`}>
                Edit
              </Link>
              <button
                type="button"
                disabled={busy}
                onClick={deleteProject}
                className="rounded-lg border border-rose-500/70 px-4 py-2 text-sm font-semibold text-rose-100 hover:bg-rose-950/40 disabled:opacity-50"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Progress</h3>
            <p className="text-xs text-slate-400">
              {project.progress?.completedTasks ?? 0}/{project.progress?.totalTasks ?? 0} tasks marked completed.
            </p>
          </div>
          <p className="text-2xl font-semibold text-brand-200">{pct}%</p>
        </div>
        <div className="mt-4 h-2 w-full rounded-full bg-slate-800">
          <div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.min(100, pct)}%` }} />
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-white">Team members</h3>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setMemberModalOpen(true)}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-slate-100 hover:bg-white/5"
            >
              Add member
            </button>
          )}
        </div>
        <ul className="divide-y divide-white/5 rounded-xl border border-white/5 bg-slate-950/40">
          <li className="flex items-center justify-between gap-4 px-3 py-3 text-sm">
            <span className="font-medium text-white">{project.createdBy?.name}</span>
            <span className="text-xs font-semibold uppercase text-emerald-300">Project creator</span>
          </li>
          {(project.members || []).map((m) => (
            <li key={nid(m)} className="flex items-center justify-between gap-4 px-3 py-3 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium text-white">{m.name}</p>
                <p className="truncate text-xs text-slate-500">{m.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="role">{m.role}</Badge>
                {isAdmin && nid(m) !== nid(user) && (
                  <button
                    type="button"
                    disabled={busy}
                    className="text-xs font-semibold text-rose-300 hover:text-rose-200"
                    onClick={() => removeMember(nid(m))}
                  >
                    Remove
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-white">Tasks in this project</h3>
          <Link className="text-xs font-semibold text-brand-300 hover:text-brand-200" to={`/tasks?project=${id}`}>
            Open filtered task board
          </Link>
        </div>
        {tasks.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">No tasks yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10 text-sm">
              <thead className="text-left text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-3 py-2">Title</th>
                  <th className="hidden px-3 py-2 sm:table-cell">Assignee</th>
                  <th className="hidden px-3 py-2 text-right lg:table-cell">Priority</th>
                  <th className="px-3 py-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {tasks.map((t) => (
                  <tr key={nid(t)}>
                    <td className="px-3 py-2">
                      <Link className="font-medium text-white hover:text-brand-200" to={`/tasks/${nid(t)}`}>
                        {t.title}
                      </Link>
                    </td>
                    <td className="hidden px-3 py-2 text-xs text-slate-400 sm:table-cell">
                      {t.assignedTo?.name || '—'}
                    </td>
                    <td className="hidden px-3 py-2 text-right lg:table-cell">
                      <Badge variant="priority">{t.priority}</Badge>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Badge variant="task">{t.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal open={memberModalOpen} title="Invite teammate" onClose={() => !busy && setMemberModalOpen(false)}>
        <form onSubmit={addMember} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">Existing user account</label>
            <select
              required
              className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white"
              value={newMemberId}
              onChange={(e) => setNewMemberId(e.target.value)}
            >
              <option value="">Choose user…</option>
              {availableUsersToAdd.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </div>
          <button
            disabled={busy}
            type="submit"
            className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
          >
            {busy ? 'Updating…' : 'Add member'}
          </button>
        </form>
      </Modal>
      <style>{`
        .btn-outline {
          border: 1px solid rgb(148 163 184 / 0.28);
          color: rgb(226 232 240);
          background: transparent;
          transition: background 120ms ease;
        }
        .btn-outline:hover { background: rgb(248 250 252 / 0.04); }
      `}</style>
    </div>
  );
}
