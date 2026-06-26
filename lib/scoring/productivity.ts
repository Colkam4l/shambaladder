// lib/scoring/productivity.ts — Farm Productivity dimension scorer
// Dimension 2, Default weight: 0.25
// Source of truth: scoring-engine.md

import type { ProductivityInputs, DimensionScore, VerificationFlag } from '@/types';

// ---------------------------------------------------------------------------
// Crop yield lookup (fallback when soilQualityIndex is null)
// ---------------------------------------------------------------------------

const CROP_YIELD_THRESHOLDS: Record<string, [number, number, number]> = {
  // [low_threshold, mid_threshold, high_threshold] in kg/acre for [10, 20, 30] points
  maize:   [400, 600, 800],
  beans:   [200, 350, 500],
  coffee:  [300, 500, 700],
  default: [300, 500, 700],
};

export function cropYieldScore(primaryCrop: string, yieldKgPerAcre: number): number {
  const thresholds = CROP_YIELD_THRESHOLDS[primaryCrop] ?? CROP_YIELD_THRESHOLDS['default'];
  if (yieldKgPerAcre >= thresholds[2]) return 30;
  if (yieldKgPerAcre >= thresholds[1]) return 20;
  if (yieldKgPerAcre >= thresholds[0]) return 10;
  return 0;
}

// ---------------------------------------------------------------------------
// Sub-scorers (exported for unit testing)
// ---------------------------------------------------------------------------

export function yieldScore(
  yieldLastSeason: number | null,
  soilQualityIndex: number | null,
  primaryCrop: string
): number {
  if (yieldLastSeason === null) return 0;

  if (soilQualityIndex !== null) {
    const estimatedPotentialYield = soilQualityIndex * 12; // kg/acre heuristic
    const ratio = yieldLastSeason / estimatedPotentialYield;
    return Math.min(ratio * 30, 30);
  }

  // Fallback: absolute yield score by crop
  return cropYieldScore(primaryCrop, yieldLastSeason);
}

export function yieldTrendScore(
  yieldLastSeason: number | null,
  yieldPreviousSeason: number | null
): number {
  if (yieldLastSeason === null) return 0;
  if (yieldPreviousSeason === null) return 5; // neutral

  const trend = (yieldLastSeason - yieldPreviousSeason) / yieldPreviousSeason;
  if (trend >= 0.1) return 10;
  if (trend >= 0)   return 7;
  return 3;
}

export function cropDiversityScore(cropDiversity: number): number {
  if (cropDiversity >= 3) return 15;
  if (cropDiversity === 2) return 10;
  return 5; // 1 crop
}

// ---------------------------------------------------------------------------
// Main scorer
// ---------------------------------------------------------------------------

export function calculateProductivityScore(
  inputs: ProductivityInputs,
  primaryCrop: string,
  weight: number
): DimensionScore {
  const rawScore = Math.min(
    100,
    yieldScore(inputs.yieldLastSeason, inputs.soilQualityIndex, primaryCrop) +
    yieldTrendScore(inputs.yieldLastSeason, inputs.yieldPreviousSeason) +
    cropDiversityScore(inputs.cropDiversity) +
    (inputs.usesImprovedSeeds ? 15 : 0) +
    (inputs.usesFertilizer ? 10 : 0) +
    (inputs.gpsConfirmed ? 20 : 0)
  );

  const missingFields: string[] = [];
  if (!inputs.gpsConfirmed)          missingFields.push('GPS farm boundary confirmation');
  if (inputs.yieldLastSeason === null) missingFields.push('Last season yield records');
  if (!inputs.usesImprovedSeeds)      missingFields.push('Improved seed varieties');
  if (!inputs.usesFertilizer)         missingFields.push('Fertilizer usage');

  const verificationFlags: VerificationFlag[] = [
    {
      field: 'yieldLastSeason',
      status: inputs.verificationStatus.yieldLastSeason,
      source: 'Shambapro yield records',
    },
    {
      field: 'gpsConfirmed',
      status: inputs.verificationStatus.gpsConfirmed,
      source: inputs.gpsConfirmed ? 'GPS boundary confirmed' : 'Not yet confirmed',
    },
    {
      field: 'soilQualityIndex',
      status: inputs.verificationStatus.soilQualityIndex,
      source: inputs.soilDataSource === 'soilgrids' ? 'SoilGrids API' : 'Not available',
    },
  ];

  const weightedScore = rawScore * weight;

  return {
    dimension: 'farm_productivity',
    rawScore,
    weight,
    weightedScore,
    completenessMultiplier: 1,
    adjustedScore: weightedScore,
    missingFields,
    verificationFlags,
  };
}
