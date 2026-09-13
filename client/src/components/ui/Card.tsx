import React, { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'solid' | 'subtle' | 'glow';
  hoverable?: boolean;
  children: ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = 'glass',
  hoverable = false,
  children,
  className = '',
  ...props
}) => {
  const variantStyles = {
    glass: 'bg-white/90 dark:bg-[#111827]/70 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-sm dark:shadow-glass text-slate-900 dark:text-slate-100',
    solid: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100',
    subtle: 'bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-white/5 text-slate-800 dark:text-slate-200',
    glow: 'bg-gradient-to-br from-indigo-50/90 via-white to-cyan-50/60 dark:from-indigo-950/40 dark:via-slate-900/80 dark:to-slate-900/80 border border-indigo-200/80 dark:border-indigo-500/30 shadow-md dark:shadow-glow-purple text-slate-900 dark:text-slate-100',
  };

  const hoverStyles = hoverable
    ? 'transition-all duration-200 hover:-translate-y-1 hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/10'
    : '';

  return (
    <div
      className={`rounded-2xl p-5 sm:p-6 ${variantStyles[variant]} ${hoverStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => (
  <div className={`flex items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-white/10 mb-4 ${className}`} {...props}>
    {children}
  </div>
);

export const CardBody: React.FC<HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => (
  <div className={`space-y-3 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => (
  <div className={`flex items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-white/10 mt-4 ${className}`} {...props}>
    {children}
  </div>
);
