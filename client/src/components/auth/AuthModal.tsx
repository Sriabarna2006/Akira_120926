import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, Lock, Mail, User, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, signIn, signUp, devLogin } = useAuth();
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (tab === 'signin') {
        const res = await signIn(email, password);
        if (!res.success) {
          setError(res.error || 'Failed to sign in. Please check your credentials.');
        }
      } else {
        const res = await signUp(email, password, displayName);
        if (!res.success) {
          setError(res.error || 'Failed to create account.');
        }
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-md p-6 overflow-hidden rounded-2xl bg-[#0F172A]/90 border border-slate-700/60 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 mb-3 shadow-lg shadow-cyan-500/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {tab === 'signin' ? 'Welcome to AKIRA' : 'Join the Intelligence Network'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {tab === 'signin' 
              ? 'Access real-world event intelligence and knowledge tracking' 
              : 'Create an account to track your concept mastery and quizzes'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-slate-900/80 rounded-xl mb-5 border border-slate-800">
          <button
            type="button"
            onClick={() => { setTab('signin'); setError(null); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              tab === 'signin'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setTab('signup'); setError(null); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              tab === 'signup'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 text-xs text-rose-300 bg-rose-950/40 border border-rose-800/60 rounded-xl">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Display Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="Alex Mercer"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                placeholder="alex@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-medium text-sm rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                {tab === 'signin' ? 'Authenticate Session' : 'Register Account'}
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Access Buttons for Immediate Testing */}
        <div className="mt-5 pt-4 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-400 mb-2 font-medium">Quick Evaluation Logins (Dev Sandbox):</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => devLogin('user')}
              className="flex-1 py-1.5 px-2 bg-slate-800/80 hover:bg-slate-700/90 text-[11px] text-slate-300 rounded-lg border border-slate-700/60 transition-colors"
            >
              Sign in as Explorer
            </button>
            <button
              type="button"
              onClick={() => devLogin('admin')}
              className="flex-1 py-1.5 px-2 bg-slate-800/80 hover:bg-slate-700/90 text-[11px] text-indigo-300 rounded-lg border border-indigo-700/50 transition-colors"
            >
              Sign in as Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
