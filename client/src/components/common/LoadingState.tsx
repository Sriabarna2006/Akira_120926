import React from 'react';
import { CardSkeleton } from '../ui/Skeleton';

export interface LoadingStateProps {
  count?: number;
  message?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  count = 3,
  message,
  className = '',
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {message && (
        <p className="text-xs text-slate-400 font-medium animate-pulse">{message}</p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
};
