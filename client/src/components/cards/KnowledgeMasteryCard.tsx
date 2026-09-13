import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { UserConceptMastery } from '../../types';
import { MasteryBadge } from '../ui/Badge';

export interface KnowledgeMasteryCardProps {
  mastery: UserConceptMastery;
  className?: string;
}

export const KnowledgeMasteryCard: React.FC<KnowledgeMasteryCardProps> = ({
  mastery,
  className = '',
}) => {
  const getStatusInfo = () => {
    switch (mastery.status) {
      case 'STRONG':
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
          color: 'text-emerald-700 dark:text-emerald-400',
          label: 'Strong Concept',
        };
      case 'DEVELOPING':
        return {
          icon: <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
          color: 'text-amber-700 dark:text-amber-400',
          label: 'Developing Understanding',
        };
      default:
        return {
          icon: <AlertCircle className="w-4 h-4 text-slate-500 dark:text-slate-400" />,
          color: 'text-slate-600 dark:text-slate-400',
          label: 'Needs Learning',
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className={`p-4 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/5 shadow-sm space-y-3 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{mastery.category}</span>
        <MasteryBadge status={mastery.status} size="xs" />
      </div>

      <div>
        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">{mastery.conceptTitle}</h4>
        <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
          <span>{mastery.attemptsCount} quiz {mastery.attemptsCount === 1 ? 'attempt' : 'attempts'}</span>
          <span>•</span>
          <span>{mastery.correctCount} correct</span>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
        <span className={`text-[11px] font-semibold flex items-center gap-1 ${statusInfo.color}`}>
          {statusInfo.icon}
          <span>{statusInfo.label}</span>
        </span>

        <Link
          to={`/learn?concept=${encodeURIComponent(mastery.conceptId)}`}
          className="text-xs text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 font-semibold inline-flex items-center gap-1"
        >
          <span>Practice</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
};
