import { z } from 'zod';

export const DimensionExplanationSchema = z.object({
  explanation: z.string().min(10).max(1000),
  keyStrength: z.string().max(600).nullable(),
  keyGap: z.string().max(600).nullable(),
  action: z.string().min(10).max(800),
});

export const ScoredActionSchema = z.object({
  rank: z.number().int().min(1).max(10),
  action: z.string().min(10).max(800),
  estimatedScoreImpact: z.number().min(1).max(30),
  targetDimension: z.enum([
    'financial_behaviour',
    'farm_productivity',
    'climate_resilience',
    'social_coop_capital',
    'record_completeness',
  ]),
  effort: z.enum(['quick', 'medium', 'hard']),
});

export const SummaryResponseSchema = z.object({
  compositeExplanation: z.string().min(20).max(1000),
  tierExplanation: z.string().min(10).max(600),
  actionList: z.array(ScoredActionSchema).min(3).max(6),
});

export type DimensionExplanationType = z.infer<typeof DimensionExplanationSchema>;
export type SummaryResponseType = z.infer<typeof SummaryResponseSchema>;

export function parseDimensionExplanation(raw: string): DimensionExplanationType {
  const cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  const parsed = JSON.parse(cleaned);
  return DimensionExplanationSchema.parse(parsed);
}

export function parseSummaryResponse(raw: string): SummaryResponseType {
  const cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  const parsed = JSON.parse(cleaned);
  return SummaryResponseSchema.parse(parsed);
}
