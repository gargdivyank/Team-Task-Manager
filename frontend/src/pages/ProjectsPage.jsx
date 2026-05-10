import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import Badge from '../components/ui/Badge.jsx';
import { apiMessage } from '../utils/apiError.js';
import { nid } from '../utils/ids.js';

export default function ProjectsPage() {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/projects');
      setProjects(res.data.data);
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <Spinner label="Loading projects…" />;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">Projects</h2>
          <p className="mt-1 text-sm text-slate-400">
            Track scope, timelines, and team composition.
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Link
              to="/projects/new"
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500"
            >
              New project
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/40 bg-rose-950/60 px-3 py-2 text-sm text-rose-100">
          {error}
        </div>
      )}

      {projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-slate-900/50 p-10 text-center text-sm text-slate-400">
          No projects visible yet.&nbsp;
          {isAdmin && (
            <>
              {' '}
              <Link className="font-semibold text-brand-300" to="/projects/new">
                Create the first project
              </Link>
              .
            </>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 shadow-xl shadow-black/30">
          <table className="min-w-full divide-y divide-white/10 text-sm">
            <thead className="bg-slate-900/70 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="hidden px-4 py-3 md:table-cell">Status</th>
                <th className="hidden px-4 py-3 lg:table-cell">Timeline</th>
                <th className="px-4 py-3 text-right">Progress</th>
                <th className="hidden px-4 py-3 sm:table-cell">Owner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-slate-950/50">
              {projects.map((p) => (
                <tr key={nid(p)} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <Link
                      to={`/projects/${nid(p)}`}
                      className="font-medium text-white hover:text-brand-200"
                    >
                      {p.title}
                    </Link>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500 md:hidden">{p.description}</p>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <Badge>{p.status}</Badge>
                  </td>
                  <td className="hidden px-4 py-3 lg:table-cell">
                    <p className="text-xs text-slate-300">{new Date(p.startDate).toLocaleDateString()}</p>
                    <p className="text-[11px] text-slate-500">→ {new Date(p.endDate).toLocaleDateString()}</p>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-brand-200">
                    {p.progress?.percent ?? 0}%
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <span className="text-xs text-slate-400">{p.createdBy?.name || '—'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
