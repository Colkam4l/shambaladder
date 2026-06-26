// components/ui/Skeleton.tsx
import React from 'react';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-color-border-default/40 rounded ${className}`}
      style={{ backgroundColor: 'var(--color-border-default)' }}
    />
  );
}

export default Skeleton;
