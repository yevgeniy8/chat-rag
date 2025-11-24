import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useNavigate, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import FilesPage from './pages/FilesPage';
import ChatPage from './pages/ChatPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AuthGuard from './components/AuthGuard';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <header className="border-b border-gray-200 bg-white">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <div className="text-lg font-semibold text-gray-900">Chat RAG</div>
        {token ? (
          <div className="flex items-center gap-4 text-sm font-medium text-gray-700">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `hover:text-blue-600 ${isActive ? 'text-blue-600 font-semibold' : ''}`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/files"
              className={({ isActive }) =>
                `hover:text-blue-600 ${isActive ? 'text-blue-600 font-semibold' : ''}`
              }
            >
              Files
            </NavLink>
            <NavLink
              to="/chat"
              className={({ isActive }) =>
                `hover:text-blue-600 ${isActive ? 'text-blue-600 font-semibold' : ''}`
              }
            >
              Chat
            </NavLink>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-slate-50"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-sm">
            <NavLink to="/login" className="font-semibold text-blue-600">
              Login
            </NavLink>
            <NavLink to="/register" className="font-semibold text-blue-600">
              Register
            </NavLink>
          </div>
        )}
      </nav>
    </header>
  );
};

const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route
      path="/"
      element={
        <AuthGuard>
          <Home />
        </AuthGuard>
      }
    />
    <Route
      path="/files"
      element={
        <AuthGuard>
          <FilesPage />
        </AuthGuard>
      }
    />
    <Route
      path="/chat"
      element={
        <AuthGuard>
          <ChatPage />
        </AuthGuard>
      }
    />
    <Route path="*" element={<Navigate to="/" />} />
  </Routes>
);

const App: React.FC = () => {
  return (
    <Router>
      <div className="flex min-h-screen flex-col bg-slate-100">
        <Header />
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
          <AppRoutes />
        </main>
        <footer className="border-t border-gray-200 bg-white py-4 text-center text-xs text-gray-500">
          JWT-backed RAG with per-user isolation.
        </footer>
      </div>
    </Router>
  );
};

export default App;
