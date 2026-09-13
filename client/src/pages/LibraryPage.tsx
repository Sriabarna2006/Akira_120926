import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Bookmark, 
  Trash2, 
  ArrowRight, 
  Clock, 
  GraduationCap, 
  Sparkles, 
  Compass, 
  FileText 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { eventService } from '../services/eventService';
import { CanonicalEvent } from '../types';
import { EmptyState } from '../components/common/EmptyState';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { StatusIndicator } from '../components/common/StatusIndicator';

export const LibraryPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'articles' | 'events' | 'recent' | 'completed'>('articles');
  const [savedEvents, setSavedEvents] = useState<CanonicalEvent[]>([]);

  useEffect(() => {
    async function loadLibrary() {
      try {
        const savedIds = await eventService.getSavedEvents();
        if (savedIds.length > 0) {
          // If the user has saved items, retrieve them
          const items: CanonicalEvent[] = [];
          for (const id of savedIds) {
            const evt = await eventService.getEventById(id);
            if (evt) items.push(evt);
          }
          setSavedEvents(items);
        } else {
          setSavedEvents([]);
        }
      } catch (err) {
        console.warn('Library load notice:', err);
      }
    }

    loadLibrary();
  }, [user]);

  const handleRemove = async (id: string) => {
    setSavedEvents((prev) => prev.filter((e) => e.id !== id));
    await eventService.removeSavedEvent(id);
  };

  const tabs = [
    { id: 'articles', label: 'Saved Articles', icon: <FileText className="w-3.5 h-3.5" />, count: savedEvents.length },
    { id: 'events', label: 'Saved Events', icon: <Bookmark className="w-3.5 h-3.5" />, count: 0 },
    { id: 'recent', label: 'Recently Viewed', icon: <Clock className="w-3.5 h-3.5" />, count: 0 },
    { id: 'completed', label: 'Completed Learning', icon: <GraduationCap className="w-3.5 h-3.5" />, count: 0 },
  ] as const;

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider mb-1">
            <Bookmark className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>Personal Repository</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            My Library
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Saved events, concept bookmarks, and study material for revision and deep learning.
          </p>
        </div>

        <Button
          onClick={() => navigate('/explore')}
          size="sm"
          variant="outline"
          leftIcon={<Compass className="w-3.5 h-3.5" />}
        >
          Explore Stories
        </Button>
      </div>

      {/* 2. Library Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/5 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-white/10'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-300 font-bold">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 3. Tab Contents with Proper Empty States */}
      {activeTab === 'articles' && (
        <>
          {savedEvents.length > 0 ? (
            <div className="space-y-3">
              {savedEvents.map((story) => (
                <div 
                  key={story.id}
                  className="p-5 rounded-2xl bg-white dark:bg-[#111827]/70 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-glass flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-cyan-500/30"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <StatusIndicator status={story.importanceLabel || 'IMPORTANT'} size="sm" />
                      <Badge variant="concept" size="xs">{story.category}</Badge>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{story.region}</span>
                    </div>

                    <Link to={`/event/${story.id}`}>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white hover:text-cyan-600 dark:hover:text-cyan-300 transition-colors">
                        {story.title}
                      </h3>
                    </Link>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">{story.summary}</p>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <Link
                      to={`/event/${story.id}`}
                      className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1 transition-all shadow-sm"
                    >
                      <span>Read & Quiz</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>

                    <button 
                      onClick={() => handleRemove(story.id)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-500/20 dark:text-slate-400 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 transition-colors"
                      title="Remove from library"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Bookmark className="w-8 h-8 text-cyan-500" />}
              title="Your library is empty"
              description="Save important stories and learning resources to find them here later. You can bookmark any event while reading live news or daily briefs."
              actionLabel="Discover Live Stories"
              onAction={() => navigate('/live')}
            />
          )}
        </>
      )}

      {activeTab === 'events' && (
        <EmptyState
          icon={<Sparkles className="w-8 h-8 text-indigo-500" />}
          title="No saved canonical events"
          description="Bookmark entire ongoing event clusters to track their real-world evolution and updates over time."
          actionLabel="Explore Live & Trending"
          onAction={() => navigate('/live')}
        />
      )}

      {activeTab === 'recent' && (
        <EmptyState
          icon={<Clock className="w-8 h-8 text-amber-500" />}
          title="No recently viewed history"
          description="Your reading history and recent explorations will automatically be logged here for seamless continuity."
          actionLabel="Read Today's Brief"
          onAction={() => navigate('/daily-brief')}
        />
      )}

      {activeTab === 'completed' && (
        <EmptyState
          icon={<GraduationCap className="w-8 h-8 text-emerald-500" />}
          title="No completed learning pathways yet"
          description="Finish concept pathways and active recall quizzes to archive mastered topics in your completed library."
          actionLabel="Start Learning"
          onAction={() => navigate('/learn')}
        />
      )}

    </div>
  );
};
