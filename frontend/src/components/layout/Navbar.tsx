import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-full px-3 py-1 text-sm font-medium transition ${
      isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
    }`;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
        <Link to="/chat" className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <span className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-slate-900" />
          RAG Studio
        </Link>
        <nav className="flex items-center gap-2">
          <NavLink to="/chat" className={linkClass}>
            Chat
          </NavLink>
          <NavLink to="/compare" className={linkClass}>
            Comparison
          </NavLink>
          <NavLink to="/upload" className={linkClass}>
            Uploads
          </NavLink>
        </nav>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
            <span className="h-6 w-6 rounded-full bg-slate-800 text-center text-xs font-semibold uppercase text-white">
              {user?.name?.charAt(0) ?? '?'}
            </span>
            <span>{user?.name ?? 'Anonymous'}</span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
