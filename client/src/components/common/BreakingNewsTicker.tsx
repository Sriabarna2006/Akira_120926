import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Flame, 
  RotateCw, 
  ChevronLeft, 
  ChevronRight, 
  Radio
} from 'lucide-react';
import { CanonicalEvent } from '../../types';
import { eventService } from '../../services/eventService';

export const BreakingNewsTicker: React.FC = () => {
  const [breakingEvents, setBreakingEvents] = useState<CanonicalEvent[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now');

  const loadBreaking = async () => {
    try {
      // First try to get top breaking events
      const events = await eventService.getTopEvents({ status: 'BREAKING', limit: 8 });
      if (events && events.length > 0) {
        setBreakingEvents(events);
      } else {
        // Fallback to top live events
        const top = await eventService.getTopEvents({ limit: 6 });
        if (top && top.length > 0) {
          setBreakingEvents(top);
        }
      }
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.warn('Breaking ticker fetch notice:', err);
    }
  };

  useEffect(() => {
    loadBreaking();
    // Periodic refresh every 2 minutes
    const interval = setInterval(loadBreaking, 120000);
    return () => clearInterval(interval);
  }, []);

  // Auto-cycle through breaking news headlines every 6 seconds
  useEffect(() => {
    if (isPaused || breakingEvents.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % breakingEvents.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isPaused, breakingEvents.length]);

  const handleManualSync = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsRefreshing(true);
      await eventService.refreshLiveFeeds();
      await loadBreaking();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (breakingEvents.length === 0) {
    return null;
  }

  const currentEvent = breakingEvents[currentIndex] || breakingEvents[0];

  const timeAgo = (() => {
    const pub = currentEvent.lastUpdatedAt || currentEvent.firstPublishedAt || new Date().toISOString();
    try {
      const diffMs = Date.now() - new Date(pub).getTime();
      const diffMins = Math.max(1, Math.floor(diffMs / 60000));
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${Math.floor(diffHours / 24)}d ago`;
    } catch {
      return 'Today';
    }
  })();

  const regionBadgeClass = (() => {
    switch (currentEvent.region) {
      case 'Tamil Nadu':
        return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30';
      case 'India':
        return 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30';
      default:
        return 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30';
    }
  })();

  return (
    <div 
      className="w-full bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 dark:from-rose-950/90 dark:via-slate-900/95 dark:to-amber-950/80 text-white dark:text-slate-100 border-b border-rose-500/30 dark:border-rose-500/20 shadow-sm transition-all"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-3 text-xs sm:text-sm">
        
        {/* Left: LIVE BREAKING BADGE */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 dark:bg-rose-500/20 text-white dark:text-rose-300 font-extrabold tracking-wider text-[11px] uppercase backdrop-blur-sm border border-white/30 dark:border-rose-500/40 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white dark:bg-rose-400 opacity-90" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white dark:bg-rose-500" />
            </span>
            <Flame className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">BREAKING TODAY</span>
            <span className="xs:hidden">LIVE</span>
          </div>

          <span className="text-[10px] sm:text-xs font-mono px-2 py-0.5 rounded bg-black/20 text-white/90 dark:text-slate-300 hidden md:inline-flex items-center gap-1">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            {breakingEvents.length} Active Wire Updates
          </span>
        </div>

        {/* Center: Dynamic Rotating Breaking Story */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className={`hidden sm:inline-flex text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${regionBadgeClass}`}>
            {currentEvent.region || 'World'}
          </span>

          <Link
            to={`/event/${currentEvent.id}`}
            className="flex-1 min-w-0 font-medium text-white hover:underline truncate dark:text-slate-100 dark:hover:text-cyan-300 flex items-center gap-1.5 group transition-colors"
            title={currentEvent.title}
          >
            <span className="truncate text-xs sm:text-sm font-semibold tracking-tight">
              {currentEvent.title}
            </span>
            <span className="hidden lg:inline-flex text-[11px] text-white/80 dark:text-slate-400 font-normal flex-shrink-0">
              — {timeAgo}
            </span>
          </Link>
        </div>

        {/* Right: Controls & One-Click Live RSS Sync */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {breakingEvents.length > 1 && (
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => (prev - 1 + breakingEvents.length) % breakingEvents.length)}
                className="p-1 rounded-md text-white/80 hover:text-white hover:bg-white/10 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                aria-label="Previous breaking story"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono opacity-80 px-1">
                {currentIndex + 1}/{breakingEvents.length}
              </span>
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => (prev + 1) % breakingEvents.length)}
                className="p-1 rounded-md text-white/80 hover:text-white hover:bg-white/10 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                aria-label="Next breaking story"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleManualSync}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 dark:bg-white/10 dark:hover:bg-white/20 text-white dark:text-cyan-300 text-[11px] font-bold uppercase tracking-wider backdrop-blur-sm transition-all disabled:opacity-50"
            title={`Fetch and synchronize today's latest breaking updates (Last sync: ${lastSyncTime})`}
          >
            <RotateCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isRefreshing ? 'Syncing...' : 'Sync Live'}</span>
          </button>

        </div>

      </div>
    </div>
  );
};
