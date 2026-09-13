import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, GitBranch } from 'lucide-react';
import { Concept } from '../../types';
import { Badge, MasteryBadge } from '../ui/Badge';

export interface ConceptCardProps {
  concept: Concept;
  className?: string;
}

export const ConceptCard: React.FC<ConceptCardProps> = ({ concept, className = '' }) => {
  const prereqCount = concept.prerequisites?.length || 0;

  return (
    <div className={`flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-[#111827]/70 backdrop-blur-xl border border-slate-200 dark:border-white/10 hover:border-purple-500/40 transition-all duration-200 shadow-sm dark:shadow-glass ${className}`}>
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <Badge variant="concept" size="xs">{concept.category}</Badge>
          {concept.masteryStatus && (
            <MasteryBadge status={concept.masteryStatus} size="xs" />
          )}
        </div>

        <Link to={`/learn?concept=${concept.slug || concept.id}`}>
          <h3 className="text-base font-bold text-slate-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-300 transition-colors mb-2">
            {concept.title}
          </h3>
        </Link>

        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed mb-4">
          {concept.shortDefinition}
        </p>
      </div>

      <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
        <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <GitBranch className="w-3 h-3 text-purple-500 dark:text-purple-400" />
          <span>{prereqCount} {prereqCount === 1 ? 'prerequisite' : 'prerequisites'}</span>
        </span>

        <Link
          to={`/learn?concept=${concept.slug || concept.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
        >
          <span>Explore</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
