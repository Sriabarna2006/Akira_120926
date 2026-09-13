import React, { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export interface AlertProps {
  variant?: 'info' | 'warning' | 'error' | 'success';
  title?: string;
  children: ReactNode;
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  onClose,
  className = '',
}) => {
  const styles = {
    info: {
      container: 'bg-cyan-50 border-cyan-200 text-cyan-900 dark:bg-cyan-950/40 dark:border-cyan-500/30 dark:text-cyan-200',
      icon: <Info className="w-5 h-5 text-cyan-600 dark:text-cyan-400 shrink-0" />,
    },
    warning: {
      container: 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-500/30 dark:text-amber-200',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />,
    },
    error: {
      container: 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-500/30 dark:text-rose-200',
      icon: <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />,
    },
    success: {
      container: 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-500/30 dark:text-emerald-200',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />,
    },
  };

  const current = styles[variant];

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-4 rounded-xl border ${current.container} ${className}`}
    >
      {current.icon}
      <div className="flex-1 text-xs sm:text-sm">
        {title && <h5 className="font-bold text-slate-900 dark:text-white mb-0.5">{title}</h5>}
        <div className="leading-relaxed">{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors shrink-0"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
