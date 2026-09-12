import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Compass, ArrowRight } from 'lucide-react';

export const CategoryPage: React.FC = () => {
  const { slug } = useParams();
  const title = slug ? slug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ') : 'Category';

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-brand-400 uppercase tracking-wider mb-1">
          <Compass className="h-4 w-4" />
          <span>Category Stream</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          {title}
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Verified intelligence feeds, contextual background, and concept prerequisites for {title}.
        </p>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-3">
        <div className="flex items-center gap-2">
          <span className="badge-must-know text-[10px] font-bold px-2 py-0.5 rounded-full">MUST KNOW</span>
          <span className="text-xs text-slate-400">• 2 hours ago</span>
        </div>
        <h2 className="text-lg font-bold text-white">
          Major updates and shifts occurring in {title}
        </h2>
        <p className="text-sm text-slate-300">
          Continuous AI parsing extracts the highest-impact real-world developments in this domain.
        </p>
        <div className="pt-2">
          <Link to="/daily-brief" className="text-xs text-brand-400 hover:underline flex items-center gap-1 font-semibold">
            <span>Explore all curated daily briefings</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
