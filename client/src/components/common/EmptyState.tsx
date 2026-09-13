import React, { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = <Sparkles className="w-8 h-8 text-cyan-400" />,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl bg-[#111827]/40 border border-white/5 ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 border border-cyan-500/20 flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/5">
        {icon}
      </div>

      <h3 className="text-lg font-bold text-white mb-1.5">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-400 max-w-md leading-relaxed mb-6">
        {description}
      </p>

      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm" variant="outline">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
