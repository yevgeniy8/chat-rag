import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!name || !email || !password) {
      setError('Please complete all fields.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setIsLoading(true);
    try {
      await register(name, email, password);
      navigate('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to register.');
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
              Create your workspace
            </div>
            <h1 className="text-3xl font-semibold leading-tight">Join the RAG experience</h1>
            <p className="text-sm text-slate-200">
              Build your account to start uploading documents, chatting with retrieval, and comparing against a baseline.
            </p>
          </div>
          <div className="space-y-2 text-xs text-slate-300">
            <p>• Guided registration with validation</p>
            <p>• Secure JWT token storage</p>
            <p>• Redirect to sign in after success</p>
          </div>
        </div>
        <div className="p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Create account</h2>
              <p className="mt-1 text-sm text-slate-500">Start with your name, email, and a strong password.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700" htmlFor="name">
                  Name
                </label>
                <input
                  id="name"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
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
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700" htmlFor="confirmPassword">
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
            {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:from-blue-500 hover:to-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? 'Creating account…' : 'Create account'}
            </button>
            <p className="text-center text-sm text-slate-500">
              Already registered?{' '}
              <Link to="/login" className="font-semibold text-blue-600 hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
