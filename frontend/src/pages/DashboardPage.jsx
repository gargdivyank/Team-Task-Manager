import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import Spinner from '../components/ui/Spinner.jsx';
import { apiMessage } from '../utils/apiError.js';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/dashboard');
        if (!cancelled) setData(res.data.data);
      } catch (e) {
        if (!cancelled) setError(apiMessage(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <Spinner label="Fetching dashboard…" />;
  if (error) {
    return (
      <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-6 text-sm text-rose-100">
        {error}
      </div>
    );
  }

  const t = data.totals || {};

  const statCards = [
    { label: 'Total projects', value: t.totalProjects },
    { label: 'Total tasks', value: t.totalTasks },
    { label: 'Completed', value: t.completedTasks },
    { label: 'Pending (To Do)', value: t.pendingTasks },
    { label: 'In progress', value: t.inProgressTasks },
    { label: 'Overdue', value: t.overdueTasks },
    { label: 'Assigned to you', value: t.tasksAssignedToMe },
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-white">Overview</h2>
          <p className="mt-1 text-sm text-slate-400">
            Live snapshot of workload across projects you can access.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500"
            to="/tasks"
          >
            View tasks
          </Link>
          <Link
            className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-white/5"
            to="/projects"
          >
            View projects
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {statCards.map((c) => (
          <article
            key={c.label}
            className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-transparent p-4 shadow-lg shadow-black/30"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{c.label}</p>
            <p className="mt-3 text-3xl font-semibold text-white">{c.value ?? 0}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-white">Project progress</h3>
            <Link to="/projects" className="text-xs font-semibold text-brand-300 hover:text-brand-200">
              Manage projects
            </Link>
          </div>
          <div className="space-y-3">
            {data.projectWiseProgress?.length === 0 && (
              <p className="text-sm text-slate-500">No projects yet.</p>
            )}
            {data.projectWiseProgress?.map((row) => (
              <Link
                key={row.projectId}
                to={`/projects/${row.projectId}`}
                className="block rounded-xl border border-white/5 bg-slate-950/60 p-4 hover:border-brand-500/35"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{row.title}</p>
                    <p className="text-xs text-slate-500">{row.status}</p>
                  </div>
                  <p className="text-sm font-semibold text-brand-200">
                    {row.progress?.percent ?? 0}%
                  </p>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-brand-500"
                    style={{
                      width: `${Math.min(100, Number(row.progress?.percent) || 0)}%`,
                    }}
                  />
                </div>
                <p className="mt-2 text-[11px] text-slate-500">
                  {row.progress?.completedTasks ?? 0}/{row.progress?.totalTasks ?? 0} tasks done
                </p>
              </Link>
            ))}
          </div>
        </section>
        <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-5">
  <h3 className="mb-4 text-lg font-semibold text-white">Recent activity</h3>

  <div className="max-h-[520px] space-y-3 overflow-y-auto pr-2">
    {!data.recentActivity?.length && (
      <p className="text-sm text-slate-500">
        Actions like logins and task updates will appear here soon.
      </p>
    )}

    {data.recentActivity?.map((a) => (
      <div
        key={a._id}
        className="rounded-xl border border-white/5 bg-slate-950/60 px-3 py-2 text-xs text-slate-300"
      >
        <p className="font-medium text-white">
          {a.actorId?.name || 'Someone'}{' '}
          <span className="font-normal text-slate-400">{a.summary || a.action}</span>
        </p>

        <p className="mt-1 text-[11px] text-slate-500">
          {a.createdAt && new Date(a.createdAt).toLocaleString()}
        </p>
      </div>
    ))}
  </div>
</section>
      </div>
    </div>
  );
}
