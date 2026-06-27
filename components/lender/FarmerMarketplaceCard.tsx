'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreditTier } from '@/types';
import { TierBadge } from '@/components/ui/TierBadge';

const DIMENSION_LABELS: Record<string, string> = {
  financial_behaviour:  'Financial Behaviour',
  farm_productivity:    'Farm Productivity',
  climate_resilience:   'Climate Resilience',
  social_coop_capital:  'Social Capital',
  record_completeness:  'Record Completeness',
};

const CROP_EMOJI: Record<string, string> = {
  maize:   '🌽',
  beans:   '🫘',
  tomato:  '🍅',
  coffee:  '☕',
  tea:     '🍃',
  sorghum: '🌾',
};

interface FarmerCardData {
  farmerId: string;
  name: string;
  region: string;
  primaryCrop: string;
  farmSizeAcres: number;
  cooperativeName: string | null;
  totalScore: number;
  tier: CreditTier;
  completeness: number;
  topStrength: string;
  topGap: string;
  peerBenchmark: string | null;
}

interface FarmerMarketplaceCardProps {
  farmer: FarmerCardData;
  onRequestContact: (farmer: FarmerCardData) => void;
}

export function FarmerMarketplaceCard({ farmer, onRequestContact }: FarmerMarketplaceCardProps) {
  const router = useRouter();
  const [loadingProfile, setLoadingProfile] = useState(false);

  const initials = farmer.name.split(' ').map(n => n[0]).slice(0, 2).join('');
  const cropEmoji = CROP_EMOJI[farmer.primaryCrop] ?? '🌱';

  const scoreColor =
    farmer.tier === 'trusted'     ? 'text-tier-trusted-text' :
    farmer.tier === 'established' ? 'text-tier-established-text' :
    farmer.tier === 'growing'     ? 'text-tier-growing-text' :
                                    'text-tier-seedling-text';

  const scoreBarColor =
    farmer.tier === 'trusted'     ? 'bg-tier-trusted' :
    farmer.tier === 'established' ? 'bg-tier-established' :
    farmer.tier === 'growing'     ? 'bg-tier-growing' :
                                    'bg-tier-seedling';

  const handleViewProfile = async () => {
    setLoadingProfile(true);
    try {
      const res = await fetch(`/api/share/marketplace-direct/${farmer.farmerId}`);
      if (!res.ok) throw new Error('Could not create shared token.');
      const data = await res.json();
      router.push(`/lender/scorecard/${data.shareId}`);
    } catch (err) {
      console.error(err);
      alert('Failed to load profile details. Please try again.');
      setLoadingProfile(false);
    }
  };

  return (
    <div className="group bg-bg-card border border-border-default rounded-2xl p-5 flex flex-col gap-4 hover:border-accent-primary/40 hover:shadow-lg transition-all duration-200">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-full bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-primary font-bold text-sm flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-text-primary text-[15px] leading-tight truncate">{farmer.name}</p>
          <p className="text-xs text-text-muted mt-0.5 capitalize">
            {cropEmoji} {farmer.primaryCrop} · {farmer.farmSizeAcres} acres · {farmer.region}
          </p>
        </div>
        <div className="flex-shrink-0">
          <TierBadge tier={farmer.tier} size="sm" />
        </div>
      </div>

      {/* Score bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-muted font-medium">Credit Score</span>
          <span className={`text-xl font-extrabold tabular-nums ${scoreColor}`}>
            {farmer.totalScore.toFixed(1)}
            <span className="text-xs font-normal text-text-muted">/100</span>
          </span>
        </div>
        <div className="h-1.5 bg-border-default rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${scoreBarColor}`}
            style={{ width: `${farmer.totalScore}%` }}
          />
        </div>
      </div>

      {/* Strength / Gap pills */}
      <div className="flex flex-wrap gap-2">
        {farmer.topStrength && (
          <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full px-2.5 py-0.5 font-medium">
            <span>↑</span> {DIMENSION_LABELS[farmer.topStrength] ?? farmer.topStrength}
          </span>
        )}
        {farmer.topGap && (
          <span className="inline-flex items-center gap-1 text-[11px] bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full px-2.5 py-0.5 font-medium">
            <span>↓</span> {DIMENSION_LABELS[farmer.topGap] ?? farmer.topGap}
          </span>
        )}
      </div>

      {/* Cooperative / peer benchmark */}
      {farmer.peerBenchmark && (
        <div className="bg-bg-page border border-border-default/60 rounded-xl px-3 py-2">
          <p className="text-[11px] text-text-muted leading-snug">
            <span className="text-accent-primary font-semibold">Neo4j peer signal: </span>
            {farmer.peerBenchmark}
          </p>
        </div>
      )}

      {/* Completeness */}
      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>Profile completeness</span>
        <span className="font-semibold text-text-secondary">{farmer.completeness}%</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleViewProfile}
          disabled={loadingProfile}
          className="flex-1 py-2.5 rounded-xl border border-border-default text-text-secondary text-sm font-semibold hover:bg-bg-page transition-colors disabled:opacity-50"
        >
          {loadingProfile ? 'Loading…' : 'View Profile'}
        </button>
        <button
          onClick={() => onRequestContact(farmer)}
          className="flex-1 py-2.5 rounded-xl bg-accent-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Request Contact
        </button>
      </div>
    </div>
  );
}
