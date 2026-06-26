// lib/scoring/completeness.ts — Record Completeness dimension scorer
// Dimension 5, Default weight: 0.10
// Source of truth: scoring-engine.md
//
// NOTE: Completeness produces a MULTIPLIER (0.5–1.0) applied to all other
//       weighted dimension scores. The dimension score shown to the farmer is
//       simply completenessPercentage (0-100), not the multiplier itself.

import type { FarmerProfile, DimensionScore, VerificationFlag } from '@/types';

// ---------------------------------------------------------------------------
// Completeness field weights (total = 100)
// ---------------------------------------------------------------------------

interface CompletenessField {
  label: string;
  weight: number;
  isSatisfied: (profile: FarmerProfile) => boolean;
}

const COMPLETENESS_FIELDS: CompletenessField[] = [
  {
    label: 'Name',
    weight: 5,
    isSatisfied: (p) => p.name.trim().length > 0,
  },
  {
    label: 'GPS farm boundary',
    weight: 15,
    isSatisfied: (p) => p.productivity.gpsConfirmed,
  },
  {
    label: 'Primary crop',
    weight: 5,
    isSatisfied: (p) => p.primaryCrop.trim().length > 0,
  },
  {
    label: 'Farm size',
    weight: 5,
    isSatisfied: (p) => p.farmSizeAcres > 0,
  },
  {
    label: 'Mobile money activity',
    weight: 10,
    isSatisfied: (p) =>
      p.financial.mobileMoneyRegularity !== 'none' || p.financial.savingsGroupMember,
  },
  {
    label: 'Savings group membership',
    weight: 5,
    isSatisfied: (p) => p.financial.savingsGroupMember !== undefined,
  },
  {
    label: 'Cooperative membership',
    weight: 10,
    isSatisfied: (p) => p.social.cooperativeId !== null,
  },
  {
    label: 'Last season yield',
    weight: 10,
    isSatisfied: (p) => p.productivity.yieldLastSeason !== null,
  },
  {
    label: 'Improved seed usage',
    weight: 5,
    isSatisfied: (p) => p.productivity.usesImprovedSeeds !== undefined,
  },
  {
    label: 'Irrigation access',
    weight: 5,
    isSatisfied: (p) => p.climate.hasIrrigationAccess !== undefined,
  },
  {
    label: 'Drought-tolerant varieties',
    weight: 5,
    isSatisfied: (p) => p.climate.usesDroughtTolerantVarieties !== undefined,
  },
  {
    label: 'Soil conservation practices',
    weight: 5,
    isSatisfied: (p) => p.climate.practisesSoilConservation !== undefined,
  },
  {
    label: 'Data consent',
    weight: 10,
    isSatisfied: (p) => !!p.consentGrantedAt,
  },
];

// ---------------------------------------------------------------------------
// Completeness percentage calculator (exported for unit testing)
// ---------------------------------------------------------------------------

export function calculateCompletenessPercentage(profile: FarmerProfile): number {
  const score = COMPLETENESS_FIELDS.reduce((acc, field) => {
    return acc + (field.isSatisfied(profile) ? field.weight : 0);
  }, 0);
  return Math.min(score, 100);
}

export function getMissingCompletenessFields(profile: FarmerProfile): string[] {
  return COMPLETENESS_FIELDS
    .filter((field) => !field.isSatisfied(profile))
    .map((field) => field.label);
}

// ---------------------------------------------------------------------------
// Multiplier curve (exported for unit testing)
// ---------------------------------------------------------------------------

export function completenessMultiplier(percentage: number): number {
  if (percentage >= 91) return 1.00;
  if (percentage >= 76) return 0.92;
  if (percentage >= 61) return 0.80;
  if (percentage >= 41) return 0.65;
  return 0.50;
}

// ---------------------------------------------------------------------------
// Main scorer
// ---------------------------------------------------------------------------

export function calculateCompletenessScore(
  profile: FarmerProfile,
  weight: number
): { dimensionScore: DimensionScore; multiplier: number } {
  const percentage = calculateCompletenessPercentage(profile);
  const multiplier = completenessMultiplier(percentage);
  const missingFields = getMissingCompletenessFields(profile);

  const verificationFlags: VerificationFlag[] = [
    {
      field: 'completenessPercentage',
      status: 'self_reported',
      source: 'Shambapro profile completeness check',
      note: `${percentage}% complete → ${multiplier}x confidence multiplier`,
    },
  ];

  const weightedScore = percentage * weight;

  const dimensionScore: DimensionScore = {
    dimension: 'record_completeness',
    rawScore: percentage,
    weight,
    weightedScore,
    completenessMultiplier: 1, // completeness dimension is NOT multiplied by itself
    adjustedScore: weightedScore,
    missingFields,
    verificationFlags,
  };

  return { dimensionScore, multiplier };
}
