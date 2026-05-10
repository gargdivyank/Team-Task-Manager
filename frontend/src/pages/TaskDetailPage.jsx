import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import Badge from '../components/ui/Badge.jsx';
import { TASK_STATUSES } from '../constants/lists.js';
import { apiMessage } from '../utils/apiError.js';
import { nid } from '../utils/ids.js';

export default function TaskDetailPage() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [posting, setPosting] = useState(false);

  const reload = async () => {
    setError('');
    const [tRes, cRes] = await Promise.all([
      api.get(`/tasks/${id}`),
      api.get(`/tasks/${id}/comments`),
    ]);
    setTask(tRes.data.data);
    setComments(cRes.data.data || []);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await reload();
      } catch (e) {
        if (!cancelled) setError(apiMessage(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const isAssignee = task && nid(task.assignedTo) === nid(user);

  const updateStatusSelf = async (next) => {
    setError('');
    try {
      const res = await api.patch(`/tasks/${id}/status`, { status: next });
      setTask(res.data.data);
      const cRes = await api.get(`/tasks/${id}/comments`);
      setComments(cRes.data.data || []);
    } catch (e) {
      setError(apiMessage(e));
    }
  };

  const postComment = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setPosting(true);
    setError('');
    try {
      await api.post(`/tasks/${id}/comments`, { message: message.trim() });
      setMessage('');
      await reload();
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setPosting(false);
    }
  };

  if (loading) return <Spinner />;
  if (!task) {
    return (
      <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-8 text-center text-sm text-rose-100">
        {error || 'Unable to load task.'}{' '}
        <Link className="font-semibold text-brand-200" to="/tasks">
          Back to tasks
        </Link>
      </div>
    );
  }

  const overdue = new Date(task.dueDate) < new Date() && task.status !== 'Completed';

  return (
    <div className="space-y-10">
      {error && (
        <div className="rounded-lg border border-amber-400/40 bg-amber-950/35 px-3 py-2 text-sm text-amber-100">{error}</div>
      )}
      <div className="flex flex-wrap items-start justify-between gap-6 border-b border-white/10 pb-8">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="task">{task.status}</Badge>
            <Badge variant="priority">{task.priority}</Badge>
            {overdue && <Badge className="ring-rose-400/70">Past due</Badge>}
          </div>
          <h2 className="text-3xl font-semibold text-white">{task.title}</h2>
          <p className="whitespace-pre-wrap text-sm text-slate-400">{task.description || 'No description supplied.'}</p>
          <div className="grid gap-4 text-xs text-slate-500 md:grid-cols-3">
            <div>
              <p className="font-semibold uppercase tracking-wide text-slate-600">Due</p>
              <p className="mt-1 text-sm text-white">{new Date(task.dueDate).toLocaleString()}</p>
            </div>
            <div>
              <p className="font-semibold uppercase tracking-wide text-slate-600">Assignee</p>
              <p className="mt-1 text-sm text-white">{task.assignedTo?.name}</p>
            </div>
            <div>
              <p className="font-semibold uppercase tracking-wide text-slate-600">Created by</p>
              <p className="mt-1 text-sm text-white">{task.createdBy?.name}</p>
            </div>
          </div>
          <Link
            className="inline-flex items-center gap-2 text-xs font-semibold text-brand-300 hover:text-brand-200"
            to={`/projects/${nid(task.projectId)}`}
          >
            ← Back to project: {task.projectId?.title}
          </Link>
        </div>
        <div className="flex flex-col gap-2">
          {isAdmin && (
            <Link
              className="rounded-lg bg-brand-600 px-5 py-2 text-center text-sm font-semibold text-white hover:bg-brand-500"
              to={`/tasks/${nid(task)}/edit`}
            >
              Edit task (admin)
            </Link>
          )}
          {(isAssignee || isAdmin) && (
            <div className="rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Status updates</label>
              <p className="mt-1 text-[11px] text-slate-500">
                {isAdmin && !isAssignee
                  ? 'Admins refine every field via Edit — members use this shortcut for assignments they own.'
                  : 'Stay aligned — only your assignments accept quick status changes.'}
              </p>
              {isAssignee && (
                <select
                  className="mt-3 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white"
                  value={task.status}
                  onChange={(e) => updateStatusSelf(e.target.value)}
                >
                  {TASK_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>
      </div>

      <section className="rounded-2xl border border-white/10 bg-slate-900/35 p-5">
        <h3 className="text-lg font-semibold text-white">Discussion thread</h3>
        <p className="text-xs text-slate-500">
          Notes stay attached to tasks so context never lives only in chats.
        </p>
        <div className="mt-6 space-y-4">
          {comments.length === 0 && <p className="text-sm text-slate-500">No chatter yet.</p>}
          {comments.map((c) => (
            <div key={c._id} className="rounded-xl border border-white/5 bg-slate-950/60 px-3 py-2">
              <p className="text-xs font-semibold text-white">{c.userId?.name}</p>
              <p className="mt-2 text-sm text-slate-200">{c.message}</p>
              <p className="mt-2 text-[11px] text-slate-600">
                {c.createdAt && new Date(c.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
        <form onSubmit={postComment} className="mt-6 space-y-2">
          <label className="text-xs font-medium text-slate-300">Add comment</label>
          <textarea
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Provide an update teammates can skim later…"
            className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:ring focus:ring-brand-600/70"
          />
          <button
            type="submit"
            disabled={posting}
            className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 disabled:opacity-60"
          >
            {posting ? 'Posting…' : 'Post comment'}
          </button>
        </form>
      </section>
    </div>
  );
}
