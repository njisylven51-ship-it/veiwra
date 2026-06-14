import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Tv, Mail, Lock, LogIn, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: { id: string; username: string }, token: string) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail.trim() || !password.trim()) {
      setError('Please fill out all input fields.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/api/auth/login', {
        usernameOrEmail: usernameOrEmail.trim(),
        password
      });

      const { user, token } = response.data;
      onLoginSuccess(user, token);
      navigate('/');
    } catch (err: any) {
      console.error('Login request failure:', err);
      setError(
        err.response?.data?.error || 'Failed to authenticate. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex flex-col justify-center items-center px-4 py-16 bg-[#09090b]">
      <div className="w-full max-w-[420px] bg-[#0d0d10] border border-white/5 rounded-2xl p-8 shadow-2xl relative">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="bg-violet-600 p-3 rounded-xl text-white mb-3 shadow-lg shadow-violet-900/10">
            <Tv className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-display font-medium tracking-tight text-white">Welcome back</h2>
          <p className="text-zinc-400 text-xs mt-1.5">Sign in to start watching or broadcasting live</p>
        </div>

        {/* Error Callout */}
        {error && (
          <div className="mb-5 bg-rose-500/10 border border-rose-500/25 text-rose-450 p-3.5 rounded-lg text-xs flex gap-2.5 items-start">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <span className="font-medium leading-relaxed">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email/Username field */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider pl-1">
              Username or Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500" />
              <input
                type="text"
                required
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                placeholder="e.g. alex_live"
                className="w-full bg-zinc-950/40 border border-white/10 hover:border-white/15 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-lg pl-10 pr-4 py-2.5 text-zinc-200 placeholder-zinc-500 focus:outline-none transition-all text-xs"
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center pl-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-950/40 border border-white/10 hover:border-white/15 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-lg pl-10 pr-4 py-2.5 text-zinc-200 placeholder-zinc-500 focus:outline-none transition-all text-xs"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-750 disabled:bg-zinc-805 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-900/15 mt-3 text-xs"
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Signing in...</span>
              </span>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5" />
                <span>Log In</span>
              </>
            )}
          </button>
        </form>

        {/* Prompt */}
        <div className="mt-8 text-center text-xs text-zinc-500 border-t border-white/5 pt-5">
          <span>New to Viewra? </span>
          <Link to="/register" className="text-violet-400 hover:text-violet-350 font-semibold hover:underline">
            Create an account
          </Link>
        </div>

      </div>
    </div>
  );
}
