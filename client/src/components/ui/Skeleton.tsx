import React from 'react';

export interface SkeletonProps {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
}) => {
  const variantStyles = {
    rectangular: 'rounded-xl',
    circular: 'rounded-full',
    text: 'rounded h-4',
  };

  const style = {
    width: width !== undefined ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height !== undefined ? (typeof height === 'number' ? `${height}px` : height) : undefined,
  };

  return (
    <div
      style={style}
      className={`bg-slate-800/60 animate-pulse ${variantStyles[variant]} ${className}`}
      aria-hidden="true"
    />
  );
};

export const CardSkeleton: React.FC = () => (
  <div className="rounded-2xl p-6 bg-[#111827]/70 border border-white/5 space-y-4">
    <div className="flex justify-between items-center">
      <Skeleton variant="rectangular" width={90} height={22} />
      <Skeleton variant="rectangular" width={60} height={18} />
    </div>
    <Skeleton variant="text" className="w-4/5 h-6" />
    <Skeleton variant="text" className="w-full h-4" />
    <Skeleton variant="text" className="w-3/4 h-4" />
    <div className="flex gap-2 pt-2">
      <Skeleton variant="rectangular" width={70} height={20} />
      <Skeleton variant="rectangular" width={80} height={20} />
    </div>
  </div>
);
