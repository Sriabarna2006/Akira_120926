import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  RotateCcw, 
  Target, 
  Compass, 
  Flame, 
  Clock, 
  BookOpen, 
  Bookmark, 
  ArrowRight, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp,
  BrainCircuit,
  Info
} from 'lucide-react';
import { PersonalizedFeedItem, RecommendationReasonCode } from '../../types';
import { Badge } from '../ui/Badge';

export interface PersonalizedEventCardProps {
  item: PersonalizedFeedItem;
  isSaved?: boolean;
  onToggleSave?: (eventId: string) => void;
  className?: string;
}

export const PersonalizedEventCard: React.FC<PersonalizedEventCardProps> = ({
  item,
  isSaved = false,
  onToggleSave,
  className = '',
}) => {
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false);
  const { event, recommendationReason, reasonCode, badgeLabel, recommendedExplanationLevel, personalizedScore, context } = item;

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

  const sourceCount = event.sources?.length || event.sourceCount || 1;

  // Visual styling mapped to deterministic reason codes
  const getReasonBadgeStyle = (code: RecommendationReasonCode) => {
    switch (code) {
      case 'REVIEW_DUE':
        return {
          icon: <RotateCcw className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />,
          bgColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
          bannerBg: 'bg-amber-50/80 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200',
        };
      case 'WEAK_CONCEPT':
      case 'KNOWLEDGE_GAP':
        return {
          icon: <Target className="w-3.5 h-3.5 text-rose-500" />,
          bgColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
          bannerBg: 'bg-rose-50/80 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-900 dark:text-rose-200',
        };
      case 'EXPLORATION':
        return {
          icon: <Compass className="w-3.5 h-3.5 text-emerald-500" />,
          bgColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
          bannerBg: 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-200',
        };
      case 'BREAKING_GLOBAL':
        return {
          icon: <Flame className="w-3.5 h-3.5 text-orange-500" />,
          bgColor: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30',
          bannerBg: 'bg-orange-50/80 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/40 text-orange-900 dark:text-orange-200',
        };
      case 'CATEGORY_AFFINITY':
      case 'CONTINUE_LEARNING':
      default:
        return {
          icon: <Sparkles className="w-3.5 h-3.5 text-cyan-500" />,
          bgColor: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
          bannerBg: 'bg-cyan-50/80 dark:bg-cyan-950/20 border-cyan-200 dark:border-cyan-900/40 text-cyan-900 dark:text-cyan-200',
        };
    }
  };

  const badgeStyle = getReasonBadgeStyle(reasonCode);

  const getDifficultyLabel = (level?: string) => {
    switch (level) {
      case 'beginner':
        return { label: 'Beginner Friendly', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' };
      case 'student':
        return { label: 'Student Core', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30' };
      case 'technical':
        return { label: 'Technical Depth', color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30' };
      case 'deepDive':
        return { label: 'Deep Dive', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30' };
      default:
        return { label: 'Adaptive', color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30' };
    }
  };

  const diffBadge = getDifficultyLabel(recommendedExplanationLevel);

  return (
    <div
      className={`group relative rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 hover:border-cyan-500/40 dark:hover:border-cyan-500/40 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${className}`}
    >
      {/* Header Badges & Actions */}
      <div className="p-5 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Recommendation Reason Pill */}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeStyle.bgColor}`}
            >
              {badgeStyle.icon}
              <span>{badgeLabel}</span>
            </span>

            {/* Recommended Difficulty Level */}
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border ${diffBadge.color}`}
              title="Recommended comprehension level based on your mastery"
            >
              <BrainCircuit className="w-3 h-3" />
              <span>{diffBadge.label}</span>
            </span>
          </div>

          {/* Right side: Score & Bookmark */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowScoreBreakdown(!showScoreBreakdown)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="Click to view match score calculation breakdown"
            >
              <span>{personalizedScore}% Match</span>
              {showScoreBreakdown ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {onToggleSave && (
              <button
                onClick={() => onToggleSave(event.id)}
                className={`p-1.5 rounded-lg border transition-colors ${
                  isSaved
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-500'
                    : 'bg-transparent border-slate-200 dark:border-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
                title={isSaved ? 'Remove from saved' : 'Save for later'}
              >
                <Bookmark className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Explainability Banner */}
        <div className={`px-3.5 py-2.5 rounded-xl border text-xs leading-relaxed mb-3.5 flex items-start gap-2.5 ${badgeStyle.bannerBg}`}>
          <Info className="w-4 h-4 shrink-0 mt-0.5 opacity-80" />
          <div className="flex-1">
            <span className="font-semibold">{recommendationReason}</span>
            {context?.relatedWeakConcepts && context.relatedWeakConcepts.length > 0 && (
              <div className="mt-1 text-[11px] opacity-90">
                Focus concepts: {context.relatedWeakConcepts.join(', ')}
              </div>
            )}
          </div>
        </div>

        {/* Score Breakdown Drawer */}
        {showScoreBreakdown && context?.scoreBreakdown && (
          <div className="mb-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/5 text-xs">
            <div className="font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center justify-between">
              <span>Deterministic Score Formula</span>
              <span className="text-[10px] text-slate-400 font-normal">0.25G + 0.25K + 0.20R + 0.15C + 0.10F + 0.05E</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-600 dark:text-slate-300">
              <div className="p-1.5 rounded bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/5">
                <div className="text-slate-400 text-[10px]">Global Rank (G)</div>
                <div className="font-bold">{context.scoreBreakdown.globalNewsScore} / 100</div>
              </div>
              <div className="p-1.5 rounded bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/5">
                <div className="text-slate-400 text-[10px]">Knowledge Gap (K)</div>
                <div className="font-bold">{context.scoreBreakdown.knowledgeGapScore} / 100</div>
              </div>
              <div className="p-1.5 rounded bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/5">
                <div className="text-slate-400 text-[10px]">Review Due (R)</div>
                <div className="font-bold">{context.scoreBreakdown.reviewPriority} / 100</div>
              </div>
              <div className="p-1.5 rounded bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/5">
                <div className="text-slate-400 text-[10px]">Category Affinity (C)</div>
                <div className="font-bold">{context.scoreBreakdown.categoryAffinity} / 100</div>
              </div>
              <div className="p-1.5 rounded bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/5">
                <div className="text-slate-400 text-[10px]">Freshness (F)</div>
                <div className="font-bold">{context.scoreBreakdown.freshnessScore} / 100</div>
              </div>
              <div className="p-1.5 rounded bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/5">
                <div className="text-slate-400 text-[10px]">Exploration (E)</div>
                <div className="font-bold">{context.scoreBreakdown.explorationScore} / 100</div>
              </div>
            </div>
          </div>
        )}

        {/* Title */}
        <Link to={`/event/${event.id}`}>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors leading-snug mb-2">
            {event.title}
          </h3>
        </Link>

        {/* Summary */}
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2 mb-3">
          {event.summary}
        </p>

        {/* Concepts Tag List */}
        {event.concepts && event.concepts.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              Concepts:
            </span>
            {event.concepts.slice(0, 3).map((concept) => (
              <span
                key={concept.id}
                className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
              >
                {concept.title}
              </span>
            ))}
            {event.concepts.length > 3 && (
              <span className="text-[10px] text-slate-400">+{event.concepts.length - 3} more</span>
            )}
          </div>
        )}
      </div>

      {/* Footer Metadata & Actions */}
      <div className="px-5 py-3 bg-slate-50/80 dark:bg-slate-900/50 border-t border-slate-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Badge variant="concept">{event.category}</Badge>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {timeAgo}
          </span>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            {sourceCount} {sourceCount === 1 ? 'src' : 'srcs'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {reasonCode === 'REVIEW_DUE' ? (
            <Link
              to={`/event/${event.id}#quiz`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-sm transition-all"
            >
              <span>Review Spaced Quiz</span>
              <RotateCcw className="w-3 h-3" />
            </Link>
          ) : (
            <Link
              to={`/event/${event.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 transition-colors"
            >
              <span>Explore Event</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
