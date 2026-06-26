// components/scorecard/ScoreHero.tsx
import React from 'react';
import { CreditTier, TIER_THRESHOLDS } from '@/types';

interface ScoreHeroProps {
  score: number;
  tier: CreditTier;
}

export function ScoreHero({ score, tier }: ScoreHeroProps) {
  // Determine next tier and gap
  let nextTier: CreditTier | null = null;
  let nextTierMin = 100;
  let currentTierMin = 0;
  let currentTierMax = 39;

  switch (tier) {
    case 'seedling':
      nextTier = 'growing';
      nextTierMin = 40;
      currentTierMin = 0;
      currentTierMax = 39;
      break;
    case 'growing':
      nextTier = 'established';
      nextTierMin = 60;
      currentTierMin = 40;
      currentTierMax = 59;
      break;
    case 'established':
      nextTier = 'trusted';
      nextTierMin = 80;
      currentTierMin = 60;
      currentTierMax = 79;
      break;
    case 'trusted':
      nextTier = null;
      currentTierMin = 80;
      currentTierMax = 100;
      break;
  }

  const gapToNextTier = nextTier ? nextTierMin - score : null;

  // Calculate percentage within the current tier range
  let percentage = 100;
  if (tier !== 'trusted') {
    const rangeSize = nextTierMin - currentTierMin;
    const progress = score - currentTierMin;
    percentage = Math.max(0, Math.min(100, (progress / rangeSize) * 100));
  }

  // Get color variable based on current tier
  const tierColorClass = {
    seedling: 'bg-color-tier-seedling',
    growing: 'bg-color-tier-growing',
    established: 'bg-color-tier-established',
    trusted: 'bg-color-tier-trusted',
  }[tier];

  const tierTextClass = {
    seedling: 'text-tier-seedling',
    growing: 'text-tier-growing',
    established: 'text-tier-established',
    trusted: 'text-tier-trusted',
  }[tier];

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-bg-card rounded-xl border border-border-default shadow-sm w-full">
      <div className="text-[56px] font-bold text-text-primary leading-none tracking-tight">
        {score.toFixed(1)}
      </div>
      <div className="text-sm font-medium text-text-tertiary mt-2">
        Credit Readiness Score
      </div>

      {/* Progress Bar Container */}
      <div className="w-full mt-6">
        <div className="h-2 w-full bg-bg-inset rounded-full overflow-hidden">
          <div
            className={`h-full ${tierColorClass} transition-all duration-500 ease-out`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Next Tier Label */}
      {nextTier ? (
        <div className="text-xs font-semibold text-text-secondary mt-3">
          {gapToNextTier && gapToNextTier > 0
            ? `${gapToNextTier.toFixed(1)} points to `
            : ''}
          <span className="capitalize">{nextTier}</span>
        </div>
      ) : (
        <div className="text-xs font-semibold text-text-secondary mt-3">
          Highest Tier Achieved 🏆
        </div>
      )}
    </div>
  );
}

export default ScoreHero;
