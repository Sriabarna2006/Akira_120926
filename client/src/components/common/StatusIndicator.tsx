import React from 'react';
import { Flame, Zap, AlertCircle } from 'lucide-react';
import { ImportanceLabelType } from '../../types';

export interface StatusIndicatorProps {
  status: ImportanceLabelType | string;
  size?: 'sm' | 'md';
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, size = 'md' }) => {
  const normalized = status?.toUpperCase() || 'IMPORTANT';
  const sizeClass = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-0.5';

  if (normalized === 'BREAKING' || normalized === 'MUST_KNOW') {
    return (
      <div className={`inline-flex items-center gap-1.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40 font-extrabold tracking-wider ${sizeClass} shadow-xs`}>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600 dark:bg-rose-400" />
        </span>
        <Flame className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
        <span>BREAKING</span>
      </div>
    );
  }

  if (normalized === 'TRENDING') {
    return (
      <div className={`inline-flex items-center gap-1.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40 font-bold tracking-wide ${sizeClass}`}>
        <Zap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
        <span>TRENDING</span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full bg-cyan-100 text-cyan-900 border border-cyan-300 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/40 font-bold tracking-wide ${sizeClass}`}>
      <AlertCircle className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
      <span>IMPORTANT</span>
    </div>
  );
};

