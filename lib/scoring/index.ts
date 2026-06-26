// lib/scoring/index.ts — Composite score calculator (entry point)
// Source of truth: scoring-engine.md

import type {
  FarmerProfile,
  CompositeScore,
  DimensionWeights,
  DimensionScore,
} from '@/types';
import { DEFAULT_WEIGHTS } from '@/types';
import { calculateFinancialScore }    from './financial';
import { calculateProductivityScore } from './productivity';
import { calculateClimateScore }      from './climate';
import { calculateSocialScore }       from './social';
import { calculateCompletenessScore } from './completeness';
import { determineTier }              from './tiers';

// ---------------------------------------------------------------------------
// Weight validation
// ---------------------------------------------------------------------------

export function validateWeights(weights: DimensionWeights): void {
  const sum = Object.values(weights).reduce((a, b) => a + b, 0);
  if (Math.abs(sum - 1.0) > 0.001) {
    throw new Error(
      `Weights must sum to 1.0 (got ${sum.toFixed(4)}). ` +
      `Check financial_behaviour + farm_productivity + climate_resilience + ` +
      `social_coop_capital + record_completeness.`
    );
  }
}

// ---------------------------------------------------------------------------
// Composite calculator
// ---------------------------------------------------------------------------

export function calculateComposite(
  profile: FarmerProfile,
  weights: DimensionWeights = DEFAULT_WEIGHTS
): CompositeScore {
  // Validate inputs
  validateWeights(weights);
  if (profile.farmSizeAcres < 0 || profile.farmSizeAcres > 100) {
    throw new Error(`farmSizeAcres must be between 0 and 100 (got ${profile.farmSizeAcres})`);
  }
  if (
    profile.financial.priorInputCreditCycles !== profile.financial.priorRepaymentOutcomes.length &&
    profile.financial.priorInputCreditCycles > 0
  ) {
    throw new Error(
      `priorInputCreditCycles (${profile.financial.priorInputCreditCycles}) ` +
      `must match priorRepaymentOutcomes.length (${profile.financial.priorRepaymentOutcomes.length})`
    );
  }

  // Step 1: Raw dimension scores (1-4)
  const financialScore    = calculateFinancialScore(profile.financial, weights.financial_behaviour);
  const productivityScore = calculateProductivityScore(profile.productivity, profile.primaryCrop, weights.farm_productivity);
  const climateScore      = calculateClimateScore(profile.climate, weights.climate_resilience);
  const socialScore       = calculateSocialScore(profile.social, weights.social_coop_capital);

  // Step 2: Completeness percentage and multiplier
  const { dimensionScore: completenessScore, multiplier } = calculateCompletenessScore(
    profile,
    weights.record_completeness
  );

  // Step 3: Apply completeness multiplier to dimensions 1-4
  const applyMultiplier = (dim: DimensionScore): DimensionScore => ({
    ...dim,
    completenessMultiplier: multiplier,
    adjustedScore: dim.weightedScore * multiplier,
  });

  const adjustedFinancial    = applyMultiplier(financialScore);
  const adjustedProductivity = applyMultiplier(productivityScore);
  const adjustedClimate      = applyMultiplier(climateScore);
  const adjustedSocial       = applyMultiplier(socialScore);

  // Step 4: Total score
  // Completeness dimension itself is NOT multiplied by the multiplier
  const totalScore = Math.round(
    (
      adjustedFinancial.adjustedScore +
      adjustedProductivity.adjustedScore +
      adjustedClimate.adjustedScore +
      adjustedSocial.adjustedScore +
      completenessScore.adjustedScore
    ) * 10
  ) / 10; // Round to 1 decimal place

  return {
    totalScore,
    tier: determineTier(totalScore),
    dimensions: {
      financial_behaviour: adjustedFinancial,
      farm_productivity:   adjustedProductivity,
      climate_resilience:  adjustedClimate,
      social_coop_capital: adjustedSocial,
      record_completeness: completenessScore,
    },
    weights,
    computedAt: new Date().toISOString(),
  };
}
