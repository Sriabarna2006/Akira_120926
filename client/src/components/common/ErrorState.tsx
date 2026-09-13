import React from 'react';
import { AlertCircle, RotateCw } from 'lucide-react';
import { Button } from '../ui/Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'We encountered an error while loading the data. Please try again.',
  onRetry,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 rounded-2xl bg-rose-950/20 border border-rose-500/20 ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-3">
        <AlertCircle className="w-7 h-7 text-rose-400" />
      </div>

      <h4 className="text-base font-bold text-white mb-1">{title}</h4>
      <p className="text-xs sm:text-sm text-rose-200/80 max-w-sm leading-relaxed mb-5">
        {message}
      </p>

      {onRetry && (
        <Button onClick={onRetry} size="sm" variant="secondary" leftIcon={<RotateCw className="w-3.5 h-3.5" />}>
          Try Again
        </Button>
      )}
    </div>
  );
};
