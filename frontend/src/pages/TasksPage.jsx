import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import Badge from '../components/ui/Badge.jsx';
import { TASK_PRIORITIES, TASK_STATUSES } from '../constants/lists.js';
import { apiMessage } from '../utils/apiError.js';
import { nid } from '../utils/ids.js';

export default function TasksPage({ myOnly = false }) {
  const { user, isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const filters = useMemo(
    () => ({
      status: searchParams.get('status') || '',
      priority: searchParams.get('priority') || '',
      assignee: myOnly ? user?.id || '' : searchParams.get('assignee') || '',
      projectId: searchParams.get('project') || '',
      overdue: searchParams.get('overdue') === 'true' || searchParams.get('overdue') === '1',
    }),
    [searchParams, myOnly, user?.id]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const pRes = await api.get('/projects');
        const params = {};
        if (filters.status) params.status = filters.status;
        if (filters.priority) params.priority = filters.priority;
        if (filters.assignee) params.assignedTo = filters.assignee;
        if (filters.projectId) params.projectId = filters.projectId;
        if (filters.overdue) params.overdue = true;
        const tRes = await api.get('/tasks', { params });
        if (!cancelled) {
          setProjects(pRes.data.data || []);
          setTasks(tRes.data.data || []);
        }
      } catch (e) {
        if (!cancelled) setError(apiMessage(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filters.assignee, filters.overdue, filters.priority, filters.projectId, filters.status]);

  const overdueNow = () => {
    const next = new URLSearchParams(searchParams);
    if (filters.overdue) next.delete('overdue');
    else next.set('overdue', 'true');
    setSearchParams(next);
  };

  const patchFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (!value) next.delete(key);
    else next.set(key, value);
    setSearchParams(next);
  };

  const clearFilters = () => setSearchParams(new URLSearchParams());

  const isLate = (t) =>
    new Date(t.dueDate) < new Date() && t.status !== 'Completed';

  if (!user) return null;
  if (loading) return <Spinner label={myOnly ? 'Loading your assignments…' : 'Loading tasks…'} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">{myOnly ? 'My tasks' : 'Tasks'}</h2>
          <p className="mt-1 text-sm text-slate-400">
            {myOnly ? 'Assignments that require your ownership.' : 'Filter by delivery signals that matter.'}
          </p>
        </div>
        {isAdmin && (
          <Link
            to="/tasks/new"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500"
          >
            New task
          </Link>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/40 bg-rose-950/60 px-3 py-2 text-sm text-rose-100">
          {error}
        </div>
      )}

      <div className="grid gap-3 rounded-2xl border border-white/10 bg-slate-900/40 p-4 md:grid-cols-5">
        {!myOnly && (
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
              Assignee
            </label>
            <input
              className="input"
              placeholder="User id…"
              value={searchParams.get('assignee') ?? ''}
              onChange={(e) => patchFilter('assignee', e.target.value.trim())}
            />
          </div>
        )}
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Project</label>
          <select
            className="input"
            value={filters.projectId}
            onChange={(e) => patchFilter('project', e.target.value)}
          >
            <option value="">All projects</option>
            {projects.map((p) => (
              <option key={nid(p)} value={nid(p)}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Status</label>
          <select
            className="input"
            value={filters.status}
            onChange={(e) => patchFilter('status', e.target.value)}
          >
            <option value="">Any</option>
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Priority</label>
          <select
            className="input"
            value={filters.priority}
            onChange={(e) => patchFilter('priority', e.target.value)}
          >
            <option value="">Any</option>
            {TASK_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={overdueNow}
            className={`w-full rounded-lg px-4 py-2 text-sm font-semibold ${
              filters.overdue
                ? 'bg-rose-600 text-white hover:bg-rose-500'
                : 'border border-white/15 text-slate-100 hover:bg-white/5'
            }`}
          >
            {filters.overdue ? 'Overdue ✓' : 'Overdue only'}
          </button>
        </div>
        <div className="md:col-span-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/5"
          >
            Clear filters
          </button>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 p-12 text-center text-sm text-slate-500">
          No tasks matched your criteria.
        </div>
      ) : (
        <div className="overflow-auto rounded-2xl border border-white/10 bg-slate-950/35 shadow-xl shadow-black/30">
          <table className="min-w-full divide-y divide-white/10 text-sm">
            <thead className="bg-slate-900/70 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="hidden px-4 py-3 md:table-cell">Project</th>
                <th className="hidden px-4 py-3 lg:table-cell">Due</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-slate-950/55">
              {tasks.map((t) => (
                <tr key={nid(t)} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3 align-top">
                    <Link className="font-medium text-white hover:text-brand-200" to={`/tasks/${nid(t)}`}>
                      {t.title}
                    </Link>
                    {isLate(t) && (
                      <Badge className="ml-2 mt-1 sm:mt-0" variant="task">
                        Overdue
                      </Badge>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 align-top text-xs text-slate-400 md:table-cell">
                    {t.projectId?.title || '—'}
                  </td>
                  <td className="hidden px-4 py-3 align-top text-xs text-slate-300 lg:table-cell">
                    {new Date(t.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <Badge variant="priority">{t.priority}</Badge>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <Badge variant="task">{t.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        .input {
          width: 100%;
          border-radius: 0.625rem;
          border: 1px solid rgb(148 163 184 / 0.2);
          background: rgb(2 6 23);
          padding: 0.45rem 0.75rem;
          font-size: 0.8rem;
          color: rgb(226 232 240);
          outline: none;
        }
        .input:focus {
          border-color: rgb(147 159 249 / 0.7);
          box-shadow: 0 0 0 2px rgb(79 99 255 / 0.5);
        }
      `}</style>
    </div>
  );
}
