import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, ArrowRight, Bookmark, ShieldCheck, Layers, BookOpen } from 'lucide-react';
import { CanonicalEvent } from '../../types';
import { StatusIndicator } from '../common/StatusIndicator';
import { Badge } from '../ui/Badge';

export interface EventCardProps {
  event: CanonicalEvent;
  isSaved?: boolean;
  onToggleSave?: (eventId: string) => void;
  variant?: 'compact' | 'standard' | 'featured';
  className?: string;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  isSaved = false,
  onToggleSave,
  variant = 'standard',
  className = '',
}) => {
  const publishedDate = event.lastUpdatedAt || event.firstPublishedAt || event.publishedAt || new Date().toISOString();
  const timeAgo = (() => {
    try {
      const diffMs = Date.now() - new Date(publishedDate).getTime();
      const diffMins = Math.max(1, Math.floor(diffMs / 60000));
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${Math.floor(diffHours / 24)}d ago`;
    } catch {
      return 'Recently';
    }
  })();

  const sourceName = event.sources?.[0]?.name || event.source || 'Corroborated Wire';
  const sourceCount = event.sources?.length || event.sourceCount || 1;

  if (variant === 'compact') {
    return (
      <div className={`group p-4 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/5 hover:border-cyan-500/40 shadow-sm transition-all ${className}`}>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <StatusIndicator status={event.importanceLabel || 'IMPORTANT'} size="sm" />
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{event.region}</span>
          </div>
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {timeAgo}
          </span>
        </div>

        <Link to={`/event/${event.id}`}>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors line-clamp-2 leading-snug">
            {event.title}
          </h4>
        </Link>
      </div>
    );
  }

  if (variant === 'featured') {
    return (
      <div className={`p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-50/90 via-white to-cyan-50/70 dark:from-indigo-950/40 dark:via-slate-900/90 dark:to-slate-900 border border-indigo-200/80 dark:border-indigo-500/30 shadow-md dark:shadow-glass transition-all hover:border-indigo-400 dark:hover:border-indigo-500/50 ${className}`}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusIndicator status={event.importanceLabel || 'BREAKING'} />
            <Badge variant="info">{event.region}</Badge>
            <Badge variant="concept">{event.category}</Badge>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {timeAgo}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              {sourceCount} {sourceCount === 1 ? 'source' : 'corroborated sources'}
            </span>
          </div>
        </div>

        <Link to={`/event/${event.id}`}>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white hover:text-cyan-600 dark:hover:text-cyan-300 transition-colors leading-tight mb-3">
            {event.title}
          </h2>
        </Link>

        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-3 mb-4">
          {event.summary}
        </p>

        {event.whyItMatters && (
          <div className="p-4 rounded-2xl bg-cyan-50/90 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-500/20 mb-5">
            <div className="flex items-center gap-1.5 text-cyan-800 dark:text-cyan-300 text-xs font-bold uppercase tracking-wider mb-1">
              <BookOpen className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Why It Matters</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
              {event.whyItMatters}
            </p>
          </div>
        )}

        {/* Footer info & action */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Primary: <strong className="text-slate-800 dark:text-slate-200">{sourceName}</strong></span>
            {event.relatedConcepts && event.relatedConcepts.length > 0 && (
              <span className="hidden sm:inline text-slate-500 dark:text-slate-400">
                • {event.relatedConcepts.slice(0, 2).join(', ')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onToggleSave && (
              <button
                type="button"
                onClick={() => onToggleSave(event.id)}
                className={`p-2 rounded-xl border transition-all ${
                  isSaved
                    ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-300 border-cyan-300 dark:border-cyan-500/40'
                    : 'bg-white dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-slate-700'
                }`}
                title={isSaved ? 'Remove from library' : 'Save to library'}
                aria-label="Bookmark event"
              >
                <Bookmark className="w-4 h-4 fill-current" />
              </button>
            )}

            <Link
              to={`/event/${event.id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-md shadow-cyan-500/20 transition-all"
            >
              <span>Understand & Learn</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Standard Card
  return (
    <div className={`group flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-[#111827]/70 backdrop-blur-xl border border-slate-200/90 dark:border-white/10 hover:border-cyan-500/40 transition-all duration-200 shadow-sm dark:shadow-glass ${className}`}>
      <div>
        {/* Header row */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusIndicator status={event.importanceLabel || 'IMPORTANT'} size="sm" />
            <Badge variant="neutral" size="xs">{event.region}</Badge>
            <Badge variant="concept" size="xs">{event.category}</Badge>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-slate-400 shrink-0">
            <Clock className="w-3 h-3" />
            <span>{timeAgo}</span>
          </div>
        </div>

        {/* Title */}
        <Link to={`/event/${event.id}`}>
          <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors line-clamp-2 leading-snug mb-2">
            {event.title}
          </h3>
        </Link>

        {/* Summary */}
        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed mb-4">
          {event.summary}
        </p>
      </div>

      {/* Footer info & actions */}
      <div className="pt-3 border-t border-slate-100 dark:border-white/5">
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-3">
          <span className="truncate max-w-[140px] font-medium text-slate-700 dark:text-slate-300">{sourceName}</span>
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400/90 font-semibold">
            <Layers className="w-3 h-3" />
            {sourceCount} {sourceCount === 1 ? 'source' : 'sources'}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          {onToggleSave && (
            <button
              type="button"
              onClick={() => onToggleSave(event.id)}
              className={`p-1.5 rounded-lg border text-xs transition-colors ${
                isSaved
                  ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-300 border-cyan-300 dark:border-cyan-500/40'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-slate-700'
              }`}
              title={isSaved ? 'Remove from library' : 'Save to library'}
            >
              <Bookmark className="w-3.5 h-3.5" />
            </button>
          )}

          <Link
            to={`/event/${event.id}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 hover:text-slate-950 dark:hover:text-white text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <span>Read & Quiz</span>
            <ArrowRight className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          </Link>
        </div>
      </div>
    </div>
  );
};
