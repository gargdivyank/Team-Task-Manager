const styles = {
  project: {
    'Not Started': 'bg-slate-700 text-slate-200',
    'In Progress': 'bg-blue-500/20 text-blue-200 ring-1 ring-blue-400/40',
    Completed: 'bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/35',
    'On Hold': 'bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/40',
  },
  task: {
    'To Do': 'bg-slate-700 text-slate-200',
    'In Progress': 'bg-sky-500/15 text-sky-200 ring-1 ring-sky-400/40',
    Review: 'bg-purple-500/15 text-purple-200 ring-1 ring-purple-400/40',
    Completed: 'bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/35',
  },
  priority: {
    Low: 'bg-slate-600/80 text-slate-200',
    Medium: 'bg-yellow-500/15 text-yellow-100 ring-1 ring-yellow-400/35',
    High: 'bg-rose-500/15 text-rose-100 ring-1 ring-rose-400/40',
  },
  role: {
    admin: 'bg-brand-600/80 text-white',
    member: 'bg-slate-700 text-slate-200',
  },
};

export default function Badge({ variant = 'project', children, className = '' }) {
  const map = styles[variant] || {};
  const cls =
    map[children] ||
    'bg-slate-700 text-slate-200 ring-1 ring-white/10';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls} ${className}`}
    >
      {children}
    </span>
  );
}
