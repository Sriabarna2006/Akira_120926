import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, ArrowRight } from 'lucide-react';

export const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-brand-400 uppercase tracking-wider mb-1">
          <Search className="h-4 w-4" />
          <span>Full-Text & Concept Search</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          Search Results for "{query}"
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Showing matching real-world events, concepts, and learning materials.
        </p>
      </div>

      <div className="space-y-4">
        <div className="glass-panel p-5 rounded-xl border border-white/10 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <span className="badge-must-know text-[10px] font-bold px-2 py-0.5 rounded-full">
              MUST KNOW
            </span>
            <span className="text-xs text-slate-400">Economy & Money</span>
          </div>

          <Link to="/event/story-1">
            <h3 className="text-base font-semibold text-white hover:text-brand-300 transition-colors">
              Reserve Bank & Central Banks Shift Monetary Policy Stance Amid Global Inflation Shifts
            </h3>
          </Link>

          <p className="text-xs text-slate-300 mt-2">
            Major central banks announce calibrated interest rate adjustments to balance inflation reduction with economic growth targets.
          </p>

          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
            <span className="text-slate-500">Source: Financial Times</span>
            <Link to="/event/story-1" className="text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1">
              <span>View Breakdown & Quiz</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
