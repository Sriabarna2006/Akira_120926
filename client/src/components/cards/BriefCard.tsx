import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Lightbulb } from 'lucide-react';
import { CanonicalEvent } from '../../types';
import { Badge } from '../ui/Badge';
import { StatusIndicator } from '../common/StatusIndicator';

export interface BriefCardProps {
  story: CanonicalEvent;
  className?: string;
}

export const BriefCard: React.FC<BriefCardProps> = ({ story, className = '' }) => {
  return (
    <div className={`p-6 rounded-2xl bg-white dark:bg-gradient-to-b dark:from-[#161f30] dark:to-[#0d131f] border border-slate-200 dark:border-cyan-500/20 shadow-sm dark:shadow-glass transition-all hover:border-cyan-500/40 ${className}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <StatusIndicator status={story.importanceLabel || 'IMPORTANT'} />
          <Badge variant="info" size="xs">{story.region}</Badge>
          <Badge variant="concept" size="xs">{story.category}</Badge>
        </div>

        <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {story.estimatedReadTime || '3 min read'}
        </span>
      </div>

      {/* Title */}
      <Link to={`/event/${story.id}`}>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white hover:text-cyan-600 dark:hover:text-cyan-300 transition-colors leading-snug mb-2.5">
          {story.title}
        </h3>
      </Link>

      {/* Summary */}
      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
        {story.summary}
      </p>

      {/* Why it Matters highlight */}
      {story.whyItMatters && (
        <div className="p-3.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-500/30 mb-4">
          <div className="flex items-center gap-1.5 text-cyan-800 dark:text-cyan-300 text-xs font-bold uppercase tracking-wider mb-1">
            <Lightbulb className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Why It Matters</span>
          </div>
          <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
            {story.whyItMatters}
          </p>
        </div>
      )}

      {/* Related Concepts & Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-white/5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Key Concepts:</span>
          {story.relatedConcepts && story.relatedConcepts.length > 0 ? (
            story.relatedConcepts.slice(0, 3).map((concept, idx) => (
              <Link
                key={idx}
                to={`/learn?concept=${encodeURIComponent(concept.toLowerCase().replace(/\s+/g, '-'))}`}
                className="text-[11px] px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 dark:bg-purple-500/15 dark:text-purple-300 dark:hover:bg-purple-500/25 dark:border-purple-500/30 transition-colors"
              >
                {concept}
              </Link>
            ))
          ) : (
            <span className="text-[11px] text-slate-400">Contextual Learning</span>
          )}
        </div>

        <Link
          to={`/event/${story.id}`}
          className="inline-flex items-center gap-1 text-xs font-bold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 transition-colors"
        >
          <span>Deep Dive</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
