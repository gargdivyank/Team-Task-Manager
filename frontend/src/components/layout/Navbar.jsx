import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Navbar({ onToggleMobile }) {
  const { user, logout, isAdmin } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <button
          type="button"
          className="inline-flex rounded-lg border border-white/10 px-3 py-1.5 text-sm text-slate-200 hover:bg-white/5 md:hidden"
          onClick={onToggleMobile}
        >
          Menu
        </button>
        <div className="flex flex-1 flex-col gap-0.5">
          <Link to="/" className="text-sm font-semibold text-white hover:text-brand-100">
            Team Task Manager
          </Link>
          <p className="text-xs text-slate-400">
            {isAdmin ? 'Administrator' : 'Team member'} · signed in as{' '}
            <span className="font-medium text-slate-200">{user?.email}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/profile"
            className="hidden rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-white/5 sm:inline-block"
          >
            Profile
          </Link>
          <button
            type="button"
            onClick={logout}
            className="rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-brand-600/35 hover:bg-brand-500"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
