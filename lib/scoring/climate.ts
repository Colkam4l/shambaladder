// lib/scoring/climate.ts — Climate Resilience dimension scorer
// Dimension 3, Default weight: 0.20
// Source of truth: scoring-engine.md
//
// NOTE: Climate EXPOSURE (rainfall, drought index) is a lender context flag only.
//       It does NOT enter the composite score. Only adaptive practices are scored.

import type { ClimateInputs, DimensionScore, VerificationFlag } from '@/types';

export function calculateClimateScore(
  inputs: ClimateInputs,
  weight: number
): DimensionScore {
  const rawScore = Math.min(
    100,
    (inputs.hasIrrigationAccess          ? 30 : 0) +
    (inputs.usesDroughtTolerantVarieties  ? 25 : 0) +
    (inputs.practisesSoilConservation     ? 20 : 0) +
    (inputs.hasPostHarvestStorage         ? 15 : 0) +
    (inputs.hasCropInsurance              ? 10 : 0)
  );

  const missingFields: string[] = [];
  if (!inputs.hasIrrigationAccess)         missingFields.push('Irrigation access');
  if (!inputs.usesDroughtTolerantVarieties) missingFields.push('Drought-tolerant varieties');
  if (!inputs.practisesSoilConservation)   missingFields.push('Soil conservation practices');
  if (!inputs.hasPostHarvestStorage)       missingFields.push('Post-harvest storage');
  if (!inputs.hasCropInsurance)            missingFields.push('Crop insurance');

  const verificationFlags: VerificationFlag[] = [
    {
      field: 'rainfallIndexLastSeason',
      status: inputs.verificationStatus.rainfallIndexLastSeason,
      source: 'Open-Meteo API',
      note: 'Context flag for lender only — not included in composite score',
    },
    {
      field: 'adaptivePractices',
      status: inputs.verificationStatus.adaptivePractices,
      source: 'Farmer self-reported',
    },
  ];

  const weightedScore = rawScore * weight;

  return {
    dimension: 'climate_resilience',
    rawScore,
    weight,
    weightedScore,
    completenessMultiplier: 1,
    adjustedScore: weightedScore,
    missingFields,
    verificationFlags,
  };
}
