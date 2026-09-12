import React from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, ArrowRight, Trash2 } from 'lucide-react';

export const LibraryPage: React.FC = () => {
  const savedStories = [
    {
      id: 'story-1',
      title: 'Reserve Bank & Central Banks Shift Monetary Policy Stance Amid Global Inflation Shifts',
      category: 'Economy & Money',
      source: 'Financial Times / Reuters',
      savedAt: 'Yesterday',
      importanceLevel: 'MUST_KNOW',
    },
    {
      id: 'story-2',
      title: 'EU Enforces Comprehensive AI Act: What High-Risk AI Classification Means for Tech',
      category: 'AI & Technology',
      source: 'MIT Technology Review',
      savedAt: '3 days ago',
      importanceLevel: 'MUST_KNOW',
    }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-brand-400 uppercase tracking-wider mb-1">
          <Bookmark className="h-4 w-4 text-brand-400" />
          <span>Your Saved Items</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          My Knowledge Library
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Saved events and concept bookmarks for quick revision and deep study.
        </p>
      </div>

      <div className="space-y-3">
        {savedStories.map((story) => (
          <div 
            key={story.id}
            className="glass-panel p-5 rounded-xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="badge-must-know text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {story.importanceLevel.replace('_', ' ')}
                </span>
                <span className="text-xs text-slate-400 font-medium">{story.category}</span>
                <span className="text-xs text-slate-500">• Saved {story.savedAt}</span>
              </div>

              <Link to={`/event/${story.id}`}>
                <h3 className="text-base font-semibold text-white hover:text-brand-300 transition-colors">
                  {story.title}
                </h3>
              </Link>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <Link
                to={`/event/${story.id}`}
                className="px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center gap-1 transition-all"
              >
                <span>Read & Quiz</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>

              <button 
                className="p-2 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                title="Remove from library"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
