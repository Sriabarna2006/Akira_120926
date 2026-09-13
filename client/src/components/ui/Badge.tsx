import React, { ReactNode } from 'react';
import { Flame, AlertCircle, Zap, Shield, CheckCircle2, Sparkles } from 'lucide-react';
import { ImportanceLabelType, MasteryStatus } from '../../types';

export interface BadgeProps {
  variant?: 'breaking' | 'trending' | 'important' | 'neutral' | 'success' | 'warning' | 'info' | 'concept';
  size?: 'xs' | 'sm' | 'md';
  pulse?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'sm',
  pulse = false,
  icon,
  children,
  className = '',
}) => {
  const variantStyles = {
    breaking: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/35',
    trending: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/35',
    important: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/35',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/35',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-500/15 dark:text-yellow-300 dark:border-yellow-500/35',
    info: 'bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-500/15 dark:text-cyan-300 dark:border-cyan-500/35',
    concept: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/35',
  };

  const sizeStyles = {
    xs: 'text-[10px] px-1.5 py-0.5 rounded font-bold gap-1',
    sm: 'text-xs px-2.5 py-0.5 rounded-full font-semibold gap-1.5',
    md: 'text-sm px-3 py-1 rounded-full font-semibold gap-2',
  };

  return (
    <span
      className={`
        inline-flex items-center border select-none tracking-wide font-medium
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
        </span>
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};

export const UrgencyBadge: React.FC<{ label: ImportanceLabelType | string; size?: 'xs' | 'sm' | 'md' }> = ({
  label,
  size = 'sm',
}) => {
  const normalized = label?.toUpperCase() || 'IMPORTANT';
  if (normalized === 'BREAKING' || normalized === 'MUST_KNOW') {
    return (
      <Badge variant="breaking" size={size} pulse icon={<Flame className="w-3 h-3 text-rose-500 dark:text-rose-400" />}>
        BREAKING
      </Badge>
    );
  }
  if (normalized === 'TRENDING') {
    return (
      <Badge variant="trending" size={size} icon={<Zap className="w-3 h-3 text-amber-500 dark:text-amber-400" />}>
        TRENDING
      </Badge>
    );
  }
  return (
    <Badge variant="important" size={size} icon={<AlertCircle className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />}>
      IMPORTANT
    </Badge>
  );
};

export const MasteryBadge: React.FC<{ status?: MasteryStatus; size?: 'xs' | 'sm' }> = ({
  status = 'NEEDS_LEARNING',
  size = 'xs',
}) => {
  if (status === 'STRONG') {
    return (
      <Badge variant="success" size={size} icon={<CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />}>
        Strong
      </Badge>
    );
  }
  if (status === 'DEVELOPING') {
    return (
      <Badge variant="warning" size={size} icon={<Sparkles className="w-3 h-3 text-yellow-600 dark:text-yellow-400" />}>
        Developing
      </Badge>
    );
  }
  return (
    <Badge variant="neutral" size={size} icon={<Shield className="w-3 h-3 text-slate-500 dark:text-slate-400" />}>
      Needs Learning
    </Badge>
  );
};
