import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'gradient';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md shadow-cyan-500/20 active:scale-[0.98]',
  secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 dark:bg-slate-800/90 dark:hover:bg-slate-700/90 dark:text-slate-100 dark:border-slate-700 active:scale-[0.98]',
  ghost: 'bg-transparent hover:bg-slate-100 text-slate-700 hover:text-slate-900 dark:hover:bg-slate-800/60 dark:text-slate-300 dark:hover:text-white',
  danger: 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-600/20 dark:hover:bg-rose-600/30 dark:text-rose-300 dark:border-rose-500/40 active:scale-[0.98]',
  outline: 'bg-transparent hover:bg-cyan-50 text-cyan-700 border border-cyan-300 hover:border-cyan-500 dark:hover:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/30 dark:hover:border-cyan-500/60',
  gradient: 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:via-purple-400 hover:to-pink-400 text-white shadow-md shadow-purple-500/25 active:scale-[0.98]',
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'text-[11px] px-2.5 py-1 rounded-md gap-1.5 font-medium',
  sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5 font-semibold',
  md: 'text-sm px-4 py-2 rounded-xl gap-2 font-semibold',
  lg: 'text-base px-6 py-2.5 rounded-xl gap-2.5 font-bold',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  children,
  className = '',
  ...props
}) => {
  return (
    <button
      disabled={disabled || isLoading}
      className={`
        inline-flex items-center justify-center transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-1 focus:ring-offset-white dark:focus:ring-offset-[#0B0F17] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none select-none
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};
