import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Navbar from './Navbar.jsx';

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-950 to-brand-950/40 md:flex">
      <Sidebar />
      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="flex-1 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <div className="w-64 border-l border-white/10 bg-slate-900 p-4 shadow-xl">
            <p className="mb-4 text-sm font-semibold text-white">Navigate</p>
            <nav className="flex flex-col gap-1 text-sm">
              {[
                ['/', 'Dashboard'],
                ['/projects', 'Projects'],
                ['/tasks', 'All tasks'],
                ['/my-tasks', 'My tasks'],
                ['/profile', 'Profile'],
              ].map(([to, label]) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `${
                      isActive
                        ? 'bg-brand-600 text-white'
                        : 'text-slate-200 hover:bg-white/5'
                    } rounded-lg px-3 py-2`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}

      <div className="flex min-h-screen flex-1 flex-col">
        <Navbar onToggleMobile={() => setMobileOpen((x) => !x)} />
        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
