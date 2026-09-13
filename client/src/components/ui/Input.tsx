import { InputHTMLAttributes, ReactNode, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  helperText,
  error,
  leftIcon,
  rightIcon,
  className = '',
  id,
  disabled,
  ...props
}, ref) => {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center">
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          className={`
            w-full py-2 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900/90 border rounded-xl placeholder-slate-400 transition-all focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed
            ${leftIcon ? 'pl-10' : 'pl-3.5'}
            ${rightIcon ? 'pr-10' : 'pr-3.5'}
            ${error
              ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/30'
              : 'border-slate-300 dark:border-slate-700/80 focus:border-cyan-500 focus:ring-cyan-500/30 hover:border-slate-400 dark:hover:border-slate-600'
            }
            ${className}
          `}
          {...props}
        />

        {rightIcon && (
          <div className="absolute right-3.5 text-slate-400 flex items-center">
            {rightIcon}
          </div>
        )}
      </div>

      {error && <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>}
      {!error && helperText && <p className="text-[11px] text-slate-500 dark:text-slate-400">{helperText}</p>}
    </div>
  );
});

Input.displayName = 'Input';
