import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { PROJECT_STATUSES } from '../constants/lists.js';
import Spinner from '../components/ui/Spinner.jsx';
import { apiMessage } from '../utils/apiError.js';
import { nid } from '../utils/ids.js';

function toInputDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export default function ProjectFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState(PROJECT_STATUSES[0]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(`/projects/${id}`);
        const p = res.data.data;
        if (cancelled) return;
        setTitle(p.title);
        setDescription(p.description || '');
        setStatus(p.status);
        setStartDate(toInputDate(p.startDate));
        setEndDate(toInputDate(p.endDate));
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

  if (!isAdmin) {
    return <Navigate to="/projects" replace />;
  }

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const payload = {
      title: title.trim(),
      description,
      status,
      startDate,
      endDate,
    };
    try {
      if (isEdit) {
        await api.put(`/projects/${id}`, payload);
        navigate(`/projects/${id}`, { replace: true });
      } else {
        const res = await api.post('/projects', payload);
        navigate(`/projects/${nid(res.data.data)}`);
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
      <div>
        <h2 className="text-2xl font-semibold text-white">{isEdit ? 'Edit project' : 'Create project'}</h2>
        <p className="mt-1 text-sm text-slate-400">Keep dates realistic — timelines power progress metrics.</p>
      </div>
      {error && (
        <div className="rounded-lg border border-rose-500/35 bg-rose-950/50 px-3 py-2 text-sm text-rose-100">{error}</div>
      )}
      <form className="space-y-4 rounded-2xl border border-white/10 bg-slate-900/40 p-5" onSubmit={submit}>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-300">Name</label>
          <input required className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-300">Description</label>
          <textarea
            rows={4}
            className="input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">Status</label>
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
              {PROJECT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">Start date</label>
            <input
              required
              type="date"
              className="input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">End date</label>
            <input
              required
              type="date"
              className="input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <Link to={isEdit ? `/projects/${id}` : '/projects'} className="btn-ghost px-4 py-2">
            Cancel
          </Link>
          <button disabled={submitting} type="submit" className="btn-primary px-5 py-2">
            {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create'}
          </button>
        </div>
      </form>
      <style>{`
        .input {
          width: 100%;
          border-radius: 0.625rem;
          border: 1px solid rgb(148 163 184 / 0.18);
          background: rgb(2 6 23);
          padding: 0.55rem 0.85rem;
          font-size: 0.875rem;
          color: white;
          outline: none;
        }
        .input:focus {
          box-shadow: 0 0 0 2px rgb(79 99 255 / 0.5);
          border-color: rgb(147 159 249 / 0.7);
        }
        .btn-primary {
          border-radius: 0.625rem;
          font-size: 0.875rem;
          font-weight: 600;
          background: #4f63ff;
          color: white;
        }
        .btn-primary:hover { background: #3b4ae6 }
        .btn-primary:disabled { opacity: .6; cursor: not-allowed }
        .btn-ghost {
          border-radius: 0.625rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: rgb(226 232 240);
          border: 1px solid rgb(148 163 184 / 0.25);
        }
        .btn-ghost:hover { background: rgb(248 250 252 / 0.04) }
      `}</style>
    </div>
  );
}
