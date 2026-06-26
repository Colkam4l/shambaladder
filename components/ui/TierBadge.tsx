// components/ui/TierBadge.tsx
import React from 'react';
import { CreditTier } from '@/types';

interface TierBadgeProps {
  tier: CreditTier;
  size?: 'sm' | 'md' | 'lg';
}

const tierConfig = {
  seedling: {
    label: 'Seedling',
    icon: '🌱',
    classes: 'bg-tier-seedling-bg text-tier-seedling-text border-tier-seedling/20',
  },
  growing: {
    label: 'Growing',
    icon: '📈',
    classes: 'bg-tier-growing-bg text-tier-growing-text border-tier-growing/20',
  },
  established: {
    label: 'Established',
    icon: '✓',
    classes: 'bg-tier-established-bg text-tier-established-text border-tier-established/20',
  },
  trusted: {
    label: 'Trusted',
    icon: '⭐',
    classes: 'bg-tier-trusted-bg text-tier-trusted-text border-tier-trusted/20',
  },
};

const sizeConfig = {
  sm: 'h-5 px-2 text-xs font-medium rounded-full border',
  md: 'h-6.5 px-3 text-[13px] font-semibold rounded-full border',
  lg: 'h-8 px-4 text-sm font-semibold rounded-full border',
};

export function TierBadge({ tier, size = 'md' }: TierBadgeProps) {
  const config = tierConfig[tier];
  if (!config) return null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap transition-colors select-none ${sizeConfig[size]} ${config.classes}`}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}
export default TierBadge;
