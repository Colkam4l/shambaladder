// lib/scoring/tiers.ts — Tier determination
// Source of truth: scoring-engine.md and data-model.md

import { type CreditTier, TIER_THRESHOLDS } from '@/types';

export function determineTier(score: number): CreditTier {
  if (score >= TIER_THRESHOLDS.trusted.min)    return 'trusted';
  if (score >= TIER_THRESHOLDS.established.min) return 'established';
  if (score >= TIER_THRESHOLDS.growing.min)    return 'growing';
  return 'seedling';
}

export function gapToNextTier(score: number): { nextTier: CreditTier | null; gap: number | null } {
  if (score >= TIER_THRESHOLDS.trusted.min) {
    return { nextTier: null, gap: null }; // Already at max tier
  }
  if (score >= TIER_THRESHOLDS.established.min) {
    return { nextTier: 'trusted', gap: Math.ceil(TIER_THRESHOLDS.trusted.min - score) };
  }
  if (score >= TIER_THRESHOLDS.growing.min) {
    return { nextTier: 'established', gap: Math.ceil(TIER_THRESHOLDS.established.min - score) };
  }
  return { nextTier: 'growing', gap: Math.ceil(TIER_THRESHOLDS.growing.min - score) };
}
