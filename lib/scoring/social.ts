// lib/scoring/social.ts — Social & Cooperative Capital dimension scorer
// Dimension 4, Default weight: 0.15
// Source of truth: scoring-engine.md

import type { SocialInputs, DimensionScore, VerificationFlag } from '@/types';

// ---------------------------------------------------------------------------
// Sub-scorers (exported for unit testing)
// ---------------------------------------------------------------------------

export function cooperativeTenureScore(seasons: number): number {
  if (seasons >= 4) return 30;
  if (seasons === 3) return 24;
  if (seasons === 2) return 18;
  if (seasons === 1) return 10;
  return 0;
}

export function offtakerTenureScore(seasons: number): number {
  if (seasons >= 3) return 10;
  if (seasons === 2) return 7;
  if (seasons === 1) return 4;
  return 0;
}

export function cooperativeTrustScore(inputs: SocialInputs): number {
  const { cooperativeMemberSinceSeasons, peerBenchmark, cooperativeRepaymentRate } = inputs;

  if (cooperativeMemberSinceSeasons === 0) return 0;

  // Use peer-level rate if sufficient data available (more precise)
  if (peerBenchmark !== null && peerBenchmark.sufficientData) {
    return peerBenchmark.repaymentRate * 20;
  }

  // Fall back to cooperative-level average from Neo4j cooperative node
  if (cooperativeRepaymentRate !== null) {
    return cooperativeRepaymentRate * 20;
  }

  return 0;
}

// ---------------------------------------------------------------------------
// Main scorer
// ---------------------------------------------------------------------------

export function calculateSocialScore(
  inputs: SocialInputs,
  weight: number
): DimensionScore {
  const trustScore = cooperativeTrustScore(inputs);

  const rawScore = Math.min(
    100,
    cooperativeTenureScore(inputs.cooperativeMemberSinceSeasons) +
    (inputs.hasStableOfftaker ? 20 : 0) +
    offtakerTenureScore(inputs.offtakerSeasons) +
    trustScore
  );

  const missingFields: string[] = [];
  if (!inputs.cooperativeId)          missingFields.push('Cooperative membership');
  if (!inputs.hasStableOfftaker)      missingFields.push('Stable off-taker relationship');
  if (inputs.peerBenchmark === null)  missingFields.push('Peer benchmark data (Neo4j)');

  const verificationFlags: VerificationFlag[] = [
    {
      field: 'cooperativeMembership',
      status: inputs.verificationStatus.cooperativeMembership,
      source: 'Cooperative records',
    },
    {
      field: 'offtakerRelationship',
      status: inputs.verificationStatus.offtakerRelationship,
      source: 'Farmer self-reported',
    },
    {
      field: 'peerBenchmark',
      status: inputs.verificationStatus.peerBenchmark,
      source: 'Neo4j peer graph',
    },
  ];

  const weightedScore = rawScore * weight;

  return {
    dimension: 'social_coop_capital',
    rawScore,
    weight,
    weightedScore,
    completenessMultiplier: 1,
    adjustedScore: weightedScore,
    missingFields,
    verificationFlags,
  };
}
