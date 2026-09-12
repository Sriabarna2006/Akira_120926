import React from 'react';
import { User, Settings } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-brand-400 uppercase tracking-wider mb-1">
          <User className="h-4 w-4" />
          <span>Account & Preferences</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          Learner Profile & Personalization
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Manage your learning pace, category affinities, and AI difficulty defaults.
        </p>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-white/10">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-violet-400 flex items-center justify-center text-white font-extrabold text-2xl shadow-glow-purple">
            U
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Curious Learner</h2>
            <p className="text-xs text-slate-400">learner@aura-assistant.ai • Free Tier</p>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
              Level 4 — Systems Thinker
            </span>
          </div>
        </div>

        {/* Preferences */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Settings className="h-4 w-4 text-brand-400" />
            <span>AI Explainer Default Difficulty</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {['Very Simple', 'Beginner', 'Student', 'Technical', 'Deep Dive'].map((lvl, idx) => (
              <button
                key={lvl}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  idx === 1 
                    ? 'bg-brand-600 border-brand-500 text-white shadow-glow-purple' 
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
