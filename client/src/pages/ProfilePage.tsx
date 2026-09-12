import React, { useState } from 'react';
import { User, Settings, Shield, LogOut, LogIn, CheckCircle2, Bookmark, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ProfilePage: React.FC = () => {
  const { user, openAuthModal, signOut, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user && displayName.trim()) {
      await updateProfile({ displayName: displayName.trim() });
      setIsEditing(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  if (!user) {
    return (
      <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto py-8">
        <div className="glass-panel p-8 rounded-2xl border border-white/10 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center mx-auto text-white shadow-lg shadow-cyan-500/20">
            <User className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white">Sign In to Your Knowledge Profile</h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Authenticate to sync your concept mastery, bookmark canonical events, and track active recall quizzes across sessions.
          </p>
          <div className="pt-2">
            <button
              onClick={openAuthModal}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/25 transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span>Authenticate / Create Account</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
          <User className="h-4 w-4" />
          <span>Account & Identity</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          Learner Profile & Security
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Manage your verified session identity, category affinities, and knowledge tracking.
        </p>
      </div>

      {savedSuccess && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4" />
          <span>Profile updated successfully.</span>
        </div>
      )}

      {/* User Card */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-6 bg-slate-900/60 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-cyan-500/20">
              {user.displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">{user.displayName}</h2>
                {user.role === 'admin' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-[10px] font-bold uppercase">
                    <Shield className="w-3 h-3" /> Admin
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold uppercase">
                    <Sparkles className="w-3 h-3" /> Learner
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
              <p className="text-[11px] text-slate-400 mt-1">User ID: <code className="text-slate-300 font-mono">{user.id}</code></p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setDisplayName(user.displayName);
                setIsEditing(!isEditing);
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors"
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/30 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Edit Form */}
        {isEditing && (
          <form onSubmit={handleSaveProfile} className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3 animate-fadeIn">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Update Display Name</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-1">
              <Bookmark className="w-4 h-4 text-cyan-400" />
              <span>Saved Events</span>
            </div>
            <div className="text-2xl font-bold text-white">12</div>
            <p className="text-[11px] text-slate-400 mt-1">Synchronized to private storage</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-1">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Concept Mastery</span>
            </div>
            <div className="text-2xl font-bold text-emerald-400">8 Active</div>
            <p className="text-[11px] text-slate-400 mt-1">Evidence-based learning states</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-1">
              <Shield className="w-4 h-4 text-indigo-400" />
              <span>Security Level</span>
            </div>
            <div className="text-2xl font-bold text-indigo-400">RLS Active</div>
            <p className="text-[11px] text-slate-400 mt-1">Private user data isolated</p>
          </div>
        </div>

        {/* Preferences */}
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Settings className="h-4 w-4 text-cyan-400" />
            <span>AI Explainer Default Difficulty</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {['Very Simple', 'Beginner', 'Student', 'Technical', 'Deep Dive'].map((lvl, idx) => (
              <button
                key={lvl}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  idx === 1 
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 border-cyan-400 text-white shadow-md' 
                    : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
