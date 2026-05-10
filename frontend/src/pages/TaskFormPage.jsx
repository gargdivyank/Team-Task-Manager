import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { TASK_PRIORITIES, TASK_STATUSES } from '../constants/lists.js';
import Spinner from '../components/ui/Spinner.jsx';
import { apiMessage } from '../utils/apiError.js';
import { nid } from '../utils/ids.js';

export default function TaskFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [searchParams] = useSearchParams();
  const defaultProjectId = searchParams.get('project') || '';
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState(defaultProjectId);
  const [assignedTo, setAssignedTo] = useState('');
  const [priority, setPriority] = useState(TASK_PRIORITIES[1]);
  const [status, setStatus] = useState(TASK_STATUSES[0]);
  const [dueDate, setDueDate] = useState('');

  /** Load selectable projects first */
  useEffect(() => {
    let cancelled = false;
    if (!isAdmin) return undefined;
    (async () => {
      try {
        const res = await api.get('/projects');
        const list = res.data.data || [];
        if (!cancelled) {
          setProjects(list);
          if (!isEdit && !projectId && list[0]) {
            setProjectId(nid(list[0]));
          }
        }
      } catch (e) {
        if (!cancelled) setError(apiMessage(e));
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, isEdit]);

  /** Hydrate membership options when selected project shifts */
  useEffect(() => {
    let cancelled = false;
    if (!isAdmin || !projectId) return undefined;
    (async () => {
      try {
        const res = await api.get(`/projects/${projectId}`);
        const p = res.data.data;
        const list = [...(p.members || [])];
        if (p.createdBy && !list.some((u) => nid(u) === nid(p.createdBy))) {
          list.unshift(p.createdBy);
        }
        if (!cancelled) {
          setMembers(list);
          if (
            !isEdit &&
            (!assignedTo || !list.some((u) => nid(u) === assignedTo))
          ) {
            const fallback = nid(list[0]);
            setAssignedTo(fallback || '');
          }
        }
      } catch (e) {
        if (!cancelled) setError(apiMessage(e));
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, isAdmin, isEdit]);

  /** Populate task edit */
  useEffect(() => {
    if (!isEdit) return undefined;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get(`/tasks/${id}`);
        const t = res.data.data;
        if (cancelled) return;
        setTitle(t.title);
        setDescription(t.description || '');
        setProjectId(nid(t.projectId));
        setAssignedTo(nid(t.assignedTo));
        setPriority(t.priority);
        setStatus(t.status);
        const d = new Date(t.dueDate);
        setDueDate(d.toISOString().slice(0, 10));
      } catch (e) {
        if (!cancelled) setError(apiMessage(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  const memberOptions = useMemo(() => {
    const map = new Map();
    members.forEach((m) => map.set(nid(m), m));
    return [...map.entries()];
  }, [members]);

  if (!isAdmin) {
    return <Navigate to="/tasks" replace />;
  }

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const payload = {
      title: title.trim(),
      description,
      projectId,
      assignedTo,
      priority,
      status,
      dueDate,
    };
    try {
      if (isEdit) {
        await api.put(`/tasks/${id}`, payload);
        navigate(`/tasks/${id}`);
      } else {
        const res = await api.post('/tasks', payload);
        navigate(`/tasks/${nid(res.data.data)}`);
      }
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">{isEdit ? 'Edit task' : 'Plan a task'}</h2>
          <p className="mt-1 text-sm text-slate-400">
            Assign responsibilities with explicit dates so progress stays truthful.
          </p>
        </div>
      </div>
      {error && (
        <div className="rounded-lg border border-rose-500/35 bg-rose-950/50 px-3 py-2 text-sm text-rose-100">
          {error}
        </div>
      )}
      <form className="space-y-4 rounded-2xl border border-white/10 bg-slate-900/40 p-5" onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-300">Title</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:ring focus:ring-brand-500/70"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-300">Description</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:ring focus:ring-brand-500/70"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">Project</label>
            <select
              required
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:ring focus:ring-brand-500/70"
              disabled={isEdit}
            >
              <option value="" disabled hidden>
                Select project…
              </option>
              {projects.map((p) => (
                <option key={nid(p)} value={nid(p)}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">Assignee</label>
            <select
              required
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:ring focus:ring-brand-500/70"
              disabled={!projectId || memberOptions.length === 0}
            >
              {memberOptions.map(([uid, m]) => (
                <option key={uid} value={uid}>
                  {m.name || m.email}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:ring focus:ring-brand-500/70"
            >
              {TASK_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:ring focus:ring-brand-500/70"
            >
              {TASK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-300">Due date</label>
            <input
              required
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:ring focus:ring-brand-500/70"
            />
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <Link
            className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/5"
            to={isEdit ? `/tasks/${id}` : projectId ? `/projects/${projectId}` : '/projects'}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-500 disabled:opacity-60"
          >
            {submitting ? 'Saving…' : isEdit ? 'Save' : 'Create task'}
          </button>
        </div>
      </form>
    </div>
  );
}
