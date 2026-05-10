import { NavLink } from 'react-router-dom';

function clsx(...args) {
  return args
    .flat()
    .filter(Boolean)
    .join(' ')
    .trim();
}


const Link = ({ to, label }) => (
  <NavLink
    to={to}
    end={to === '/'}
    className={({ isActive }) =>
      clsx(
        'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition',
        isActive
          ? 'bg-brand-600/90 text-white shadow-lg shadow-brand-600/25'
          : 'text-slate-300 hover:bg-white/5 hover:text-white'
      )
    }
  >
    <span>{label}</span>
  </NavLink>
);

export default function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-slate-900 p-5 md:flex md:flex-col lg:w-72">
      <div className="mb-10 flex items-center gap-2 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-xs font-bold text-white">
          TM
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Team Tasks</p>
          <p className="text-xs text-slate-400">Project workspace</p>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        <Link to="/" label="Dashboard" />
        <Link to="/projects" label="Projects" />
        <Link to="/tasks" label="All tasks" />
        <Link to="/my-tasks" label="My tasks" />
        <Link to="/profile" label="Profile" />
      </nav>
      <div className="mt-10 rounded-xl border border-dashed border-white/10 px-3 py-3 text-xs text-slate-500">
        Plan work, collaborate, and ship with clarity.
      </div>
    </aside>
  );
}
