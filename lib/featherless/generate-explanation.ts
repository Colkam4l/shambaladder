import type { FarmerProfile, CompositeScore, PeerBenchmarkResult, ExplanationResponse } from '@/types';
import {
  buildTemplateVars,
  renderTemplate,
  FINANCIAL_TEMPLATE,
  PRODUCTIVITY_TEMPLATE,
  CLIMATE_TEMPLATE,
  SOCIAL_TEMPLATE,
  COMPLETENESS_TEMPLATE,
  SUMMARY_TEMPLATE,
} from './templates';
import { parseDimensionExplanation, parseSummaryResponse } from './parser';
import { generateWithRetry } from './engine';

export async function generateFullExplanation(
  profile: FarmerProfile,
  score: CompositeScore,
  peerBenchmark: PeerBenchmarkResult | null
): Promise<ExplanationResponse> {
  const baseVars = buildTemplateVars(profile, score, peerBenchmark);

  const runDimension = async (
    name: string,
    template: string,
    dimKey: keyof CompositeScore['dimensions'],
    humanName: string
  ) => {
    const dimScoreObj = score.dimensions[dimKey];
    const vars = {
      ...baseVars,
      dimensionName: humanName,
      dimensionScore: Math.round(dimScoreObj.rawScore),
      dimensionWeight: Math.round(dimScoreObj.weight * 100),
      dimensionRawScore: Math.round(dimScoreObj.rawScore),
      missingFields: dimScoreObj.missingFields,
    };
    const prompt = renderTemplate(template, vars);
    return generateWithRetry(name, prompt, parseDimensionExplanation);
  };

  const runSummary = async () => {
    const allMissing = Object.values(score.dimensions).flatMap((d) => d.missingFields);
    const vars = {
      ...baseVars,
      financialScore: Math.round(score.dimensions.financial_behaviour.rawScore),
      productivityScore: Math.round(score.dimensions.farm_productivity.rawScore),
      climateScore: Math.round(score.dimensions.climate_resilience.rawScore),
      socialScore: Math.round(score.dimensions.social_coop_capital.rawScore),
      completenessScore: Math.round(score.dimensions.record_completeness.rawScore),
      missingFields: allMissing,
    };
    const prompt = renderTemplate(SUMMARY_TEMPLATE, vars);
    return generateWithRetry('SUMMARY', prompt, parseSummaryResponse);
  };

  // Batch requests to respect the Featherless account concurrency limit of 4.
  // Running 6 concurrent requests triggers 429s and retries. Batching into 3 + 3 prevents rate limiting.
  const [financial, productivity, climate] = await Promise.all([
    runDimension('FINANCIAL', FINANCIAL_TEMPLATE, 'financial_behaviour', 'Financial Behaviour'),
    runDimension('PRODUCTIVITY', PRODUCTIVITY_TEMPLATE, 'farm_productivity', 'Farm Productivity'),
    runDimension('CLIMATE', CLIMATE_TEMPLATE, 'climate_resilience', 'Climate Resilience'),
  ]);

  const [social, completeness, summary] = await Promise.all([
    runDimension('SOCIAL', SOCIAL_TEMPLATE, 'social_coop_capital', 'Social & Cooperative Capital'),
    runDimension('COMPLETENESS', COMPLETENESS_TEMPLATE, 'record_completeness', 'Record Completeness'),
    runSummary(),
  ]);

  return {
    farmerId: profile.farmerId,
    compositeExplanation: summary.compositeExplanation,
    tierExplanation: summary.tierExplanation,
    dimensions: {
      financial_behaviour: {
        dimension: 'financial_behaviour',
        explanation: financial.explanation,
        keyStrength: financial.keyStrength,
        keyGap: financial.keyGap,
      },
      farm_productivity: {
        dimension: 'farm_productivity',
        explanation: productivity.explanation,
        keyStrength: productivity.keyStrength,
        keyGap: productivity.keyGap,
      },
      climate_resilience: {
        dimension: 'climate_resilience',
        explanation: climate.explanation,
        keyStrength: climate.keyStrength,
        keyGap: climate.keyGap,
      },
      social_coop_capital: {
        dimension: 'social_coop_capital',
        explanation: social.explanation,
        keyStrength: social.keyStrength,
        keyGap: social.keyGap,
      },
      record_completeness: {
        dimension: 'record_completeness',
        explanation: completeness.explanation,
        keyStrength: completeness.keyStrength,
        keyGap: completeness.keyGap,
      },
    },
    actionList: summary.actionList,
    computedAt: new Date().toISOString(),
  };
}
