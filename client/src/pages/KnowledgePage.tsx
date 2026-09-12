import React from 'react';
import { BarChart3, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const KnowledgePage: React.FC = () => {
  const categories = [
    { name: 'AI & Technology', score: 74, articles: 18, quizzes: 8, avgQuiz: 88, color: 'bg-purple-500' },
    { name: 'Cybersecurity', score: 62, articles: 12, quizzes: 5, avgQuiz: 80, color: 'bg-rose-500' },
    { name: 'Economy & Money', score: 55, articles: 14, quizzes: 6, avgQuiz: 75, color: 'bg-emerald-500' },
    { name: 'Science & Environment', score: 48, articles: 9, quizzes: 3, avgQuiz: 70, color: 'bg-teal-500' },
    { name: 'World', score: 45, articles: 10, quizzes: 4, avgQuiz: 65, color: 'bg-blue-500' },
    { name: 'Government & Society', score: 40, articles: 7, quizzes: 2, avgQuiz: 60, color: 'bg-amber-500' },
    { name: 'Career & Industry', score: 35, articles: 5, quizzes: 2, avgQuiz: 55, color: 'bg-indigo-500' },
    { name: 'India', score: 30, articles: 4, quizzes: 1, avgQuiz: 50, color: 'bg-orange-500' },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-brand-950 via-slate-900 to-slate-900 border border-brand-500/30 shadow-glass">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-brand-400 uppercase tracking-wider mb-1">
              <BarChart3 className="h-4 w-4" />
              <span>Personal Knowledge Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Real-World Mastery Profile
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              Tracked dynamically from your real activities: <strong>79 articles read</strong>, <strong>31 concepts mastered</strong>, and <strong>29 quiz attempts</strong>.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-950/80 p-4 rounded-xl border border-white/10 self-start md:self-auto">
            <div className="text-center">
              <span className="text-2xl font-black text-white">56%</span>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Overall Index</span>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="text-center">
              <span className="text-2xl font-black text-emerald-400">82%</span>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Quiz Accuracy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Strong & Weak Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Strong Areas */}
        <div className="glass-panel p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 className="h-4 w-4" />
            <span>Strongest Domains</span>
          </div>
          <p className="text-xs text-slate-300">You consistently score high on quizzes and finish prerequisite pathways here.</p>
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
              AI & Technology (74%)
            </span>
            <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
              Cybersecurity (62%)
            </span>
          </div>
        </div>

        {/* Growth Opportunities */}
        <div className="glass-panel p-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <AlertTriangle className="h-4 w-4" />
            <span>Recommended Knowledge Focus</span>
          </div>
          <p className="text-xs text-slate-300">Boost these areas to create a well-rounded understanding of global affairs.</p>
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30">
              India & Policy (30%)
            </span>
            <span className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30">
              Career & Industry (35%)
            </span>
          </div>
        </div>

      </div>

      {/* Category Breakdown Table/Grid */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
        <h3 className="text-lg font-bold text-white">Category Mastery Matrix</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <div key={cat.name} className="p-4 rounded-xl bg-slate-900/90 border border-white/5 space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-white">{cat.name}</span>
                <span className="font-bold text-brand-300">{cat.score}%</span>
              </div>

              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${cat.color} rounded-full`}
                  style={{ width: `${cat.score}%` }}
                />
              </div>

              <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                <span>{cat.articles} articles</span>
                <span>Avg Quiz: {cat.avgQuiz}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
