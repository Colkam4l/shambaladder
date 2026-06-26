// components/scorecard/AIExplanationBanner.tsx
import React from 'react';
import { Skeleton } from '../ui/Skeleton';

interface AIExplanationBannerProps {
  explanation?: string;
  loading?: boolean;
  failed?: boolean;
}

export function AIExplanationBanner({
  explanation,
  loading = false,
  failed = false,
}: AIExplanationBannerProps) {
  return (
    <div className="bg-accent-subtle border border-border-default rounded-xl p-4 shadow-sm">
      <div className="text-[11px] font-bold tracking-wider uppercase text-text-tertiary mb-2">
        AI Explanation
      </div>

      {loading ? (
        <div className="space-y-2 py-1">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      ) : failed || !explanation ? (
        <div className="text-sm font-medium text-text-tertiary py-1">
          Explanation unavailable. Your score and breakdown above are accurate.
        </div>
      ) : (
        <>
          <p className="text-sm text-text-secondary leading-relaxed mb-3">
            {explanation}
          </p>
          <div className="text-xs italic text-text-tertiary font-medium">
            Speak to a Shambapro advisor before making finance or planting decisions.
          </div>
        </>
      )}
    </div>
  );
}

export default AIExplanationBanner;
