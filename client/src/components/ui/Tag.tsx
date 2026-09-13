import React, { ReactNode } from 'react';

export interface TagProps {
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  icon?: ReactNode;
  count?: number;
  className?: string;
}

export const Tag: React.FC<TagProps> = ({
  label,
  isActive = false,
  onClick,
  icon,
  count,
  className = '',
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 border select-none
        ${isActive
          ? 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/40 shadow-sm shadow-cyan-500/10'
          : 'bg-slate-100 text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900 dark:bg-slate-900/80 dark:text-slate-400 dark:border-white/5 dark:hover:border-white/20 dark:hover:text-slate-200'
        }
        ${onClick ? 'cursor-pointer active:scale-95' : 'cursor-default'}
        ${className}
      `}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{label}</span>
      {count !== undefined && (
        <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-cyan-500/20 text-cyan-800 dark:text-cyan-200' : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
          {count}
        </span>
      )}
    </button>
  );
};
