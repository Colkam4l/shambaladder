// components/scorecard/DimensionCard.tsx
import React from 'react';
import { DimensionName, VerificationFlag } from '@/types';
import { VerificationBadge } from '../ui/VerificationBadge';
import { Skeleton } from '../ui/Skeleton';

interface DimensionCardProps {
  dimension: DimensionName;
  label: string;
  weight: number;
  rawScore: number;
  explanation?: string;
  verificationFlags: VerificationFlag[];
  onViewDetails?: () => void;
  loading?: boolean;
}

export function DimensionCard({
  dimension,
  label,
  weight,
  rawScore,
  explanation,
  verificationFlags,
  onViewDetails,
  loading = false,
}: DimensionCardProps) {
  if (loading) {
    return (
      <div className="bg-bg-card border border-border-default rounded-xl p-4 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-4 w-1/6" />
        </div>
        <Skeleton className="h-1.5 w-full" />
        <div className="flex justify-end">
          <Skeleton className="h-4 w-12" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-4.5 w-16" />
          <Skeleton className="h-4.5 w-20" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    );
  }

  // Determine fill color for the dimension score bar
  let barColorClass = 'bg-tier-seedling';
  if (rawScore >= 80) {
    barColorClass = 'bg-tier-trusted';
  } else if (rawScore >= 60) {
    barColorClass = 'bg-tier-established';
  } else if (rawScore >= 40) {
    barColorClass = 'bg-tier-growing';
  }

  return (
    <div className="bg-bg-card border border-border-default rounded-xl p-4 shadow-sm flex flex-col gap-3">
      {/* Row 1: Label and Weight */}
      <div className="flex justify-between items-baseline">
        <h3 className="text-base font-semibold text-text-primary leading-tight">
          {label}
        </h3>
        <span className="text-xs text-text-tertiary font-medium">
          {Math.round(weight * 100)}% of score
        </span>
      </div>

      {/* Row 2: Score Bar */}
      <div className="w-full">
        <div className="h-1.5 w-full bg-bg-inset rounded-full overflow-hidden">
          <div
            className={`h-full ${barColorClass} transition-all duration-500 ease-out`}
            style={{ width: `${rawScore}%` }}
          />
        </div>
      </div>

      {/* Row 3: Score Label */}
      <div className="text-right text-sm font-semibold text-text-primary leading-none">
        {Math.round(rawScore)}/100
      </div>

      {/* Row 4: Verification Badges */}
      {verificationFlags && verificationFlags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 py-0.5">
          {verificationFlags.map((flag, idx) => (
            <VerificationBadge
              key={idx}
              status={flag.status}
              fieldName={flag.field}
            />
          ))}
        </div>
      )}

      {/* Row 5: LLM Explanation Text */}
      {explanation ? (
        <p className="text-sm text-text-secondary leading-relaxed mt-1">
          {explanation}
        </p>
      ) : (
        <p className="text-sm text-text-tertiary leading-relaxed mt-1 italic">
          Loading explanation...
        </p>
      )}

      {/* Row 6: View Details Link */}
      {onViewDetails && (
        <button
          onClick={onViewDetails}
          className="text-sm text-accent hover:text-accent-hover font-semibold transition-colors mt-1 self-start inline-flex items-center gap-1 cursor-pointer"
        >
          See details →
        </button>
      )}
    </div>
  );
}

export default DimensionCard;
