import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/chat';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Enter both email and password.');
      return;
    }
    setIsLoading(true);
    try {
      await login(email, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to log in.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="m-auto w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl shadow-blue-900/20 sm:grid sm:grid-cols-2">
        <div className="flex flex-col justify-between bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-10 text-white">
          <div className="space-y-4">
            <div className="inline-flex items-center rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em]">
              Modern RAG Workspace
            </div>
            <h1 className="text-3xl font-semibold leading-tight">Welcome back</h1>
            <p className="text-sm text-slate-200">
              Sign in to continue chatting, upload documents, and compare baseline vs retrieval-augmented responses.
            </p>
          </div>
          <div className="space-y-2 text-xs text-slate-300">
            <p>• Secure JWT authentication</p>
            <p>• Minimal, ChatGPT-inspired UI</p>
            <p>• Responsive design for all screens</p>
          </div>
        </div>
        <div className="p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Login</h2>
              <p className="mt-1 text-sm text-slate-500">Use your account credentials to access the workspace.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:from-blue-500 hover:to-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? 'Signing in…' : 'Sign in'}
            </button>
            <p className="text-center text-sm text-slate-500">
              No account yet?{' '}
              <Link to="/register" className="font-semibold text-blue-600 hover:underline">
                Create one
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
