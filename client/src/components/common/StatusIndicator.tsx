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
      <div className={`inline-flex items-center gap-1.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold tracking-wide ${sizeClass}`}>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
        </span>
        <Flame className="w-3.5 h-3.5 text-rose-400" />
        <span>BREAKING</span>
      </div>
    );
  }

  if (normalized === 'TRENDING') {
    return (
      <div className={`inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold tracking-wide ${sizeClass}`}>
        <Zap className="w-3.5 h-3.5 text-amber-400" />
        <span>TRENDING</span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold tracking-wide ${sizeClass}`}>
      <AlertCircle className="w-3.5 h-3.5 text-indigo-400" />
      <span>IMPORTANT</span>
    </div>
  );
};
