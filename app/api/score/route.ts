// app/api/score/route.ts — Scoring engine API endpoint
// POST /api/score
// Accepts: ScoreRequest { profile: FarmerProfile, weights?: DimensionWeights }
// Returns: ScoreResponse { score: CompositeScore }

import { z } from 'zod';
import type { NextRequest } from 'next/server';
import { calculateComposite } from '@/lib/scoring';
import { DEFAULT_WEIGHTS } from '@/types';

// ---------------------------------------------------------------------------
// Input validation schema
// ---------------------------------------------------------------------------

const GPSSchema = z.object({
  latitude:  z.number(),
  longitude: z.number(),
});

const VerificationStatusSchema = z.enum([
  'verified', 'self_reported', 'third_party', 'graph_derived', 'missing',
]);

const FinancialInputsSchema = z.object({
  mobileMoneyRegularity: z.enum(['none', 'irregular', 'monthly', 'weekly']),
  mobileMoneyMonthlyVolume: z.number().nullable(),
  savingsGroupMember: z.boolean(),
  savingsGroupContributionRegularity: z.enum(['none', 'irregular', 'regular']).nullable(),
  priorInputCreditCycles: z.number().int().min(0),
  priorRepaymentOutcomes: z.array(z.enum(['on_time', 'late', 'default'])),
  verificationStatus: z.object({
    mobileMoneyRegularity: VerificationStatusSchema,
    savingsGroupMember: VerificationStatusSchema,
    priorRepaymentOutcomes: VerificationStatusSchema,
  }),
});

const ProductivityInputsSchema = z.object({
  yieldLastSeason: z.number().nullable(),
  yieldPreviousSeason: z.number().nullable(),
  cropDiversity: z.number().int().min(1),
  usesImprovedSeeds: z.boolean(),
  usesFertilizer: z.boolean(),
  usesAgrochemicals: z.boolean(),
  gpsConfirmed: z.boolean(),
  farmBoundaryCoordinates: z.array(GPSSchema).nullable(),
  soilQualityIndex: z.number().min(0).max(100).nullable(),
  soilDataSource: z.literal('soilgrids').nullable(),
  verificationStatus: z.object({
    yieldLastSeason: VerificationStatusSchema,
    gpsConfirmed: VerificationStatusSchema,
    soilQualityIndex: VerificationStatusSchema,
  }),
});

const ClimateInputsSchema = z.object({
  rainfallIndexLastSeason: z.number().nullable(),
  droughtIndexLastSeason: z.number().nullable(),
  climateRiskLevel: z.enum(['low', 'medium', 'high']).nullable(),
  hasIrrigationAccess: z.boolean(),
  usesDroughtTolerantVarieties: z.boolean(),
  practisesSoilConservation: z.boolean(),
  hasPostHarvestStorage: z.boolean(),
  hasCropInsurance: z.boolean(),
  verificationStatus: z.object({
    rainfallIndexLastSeason: VerificationStatusSchema,
    adaptivePractices: VerificationStatusSchema,
  }),
});

const PeerBenchmarkSchema = z.object({
  cooperativeId: z.string(),
  cooperativeName: z.string(),
  peerCount: z.number(),
  onTimeCount: z.number(),
  lateCount: z.number(),
  defaultCount: z.number(),
  avgPeerTier: z.number(),
  repaymentRate: z.number(),
  displayString: z.string(),
  sufficientData: z.boolean(),
});

const SocialInputsSchema = z.object({
  cooperativeId: z.string().nullable(),
  cooperativeName: z.string().nullable(),
  cooperativeMemberSinceSeasons: z.number().int().min(0),
  hasStableOfftaker: z.boolean(),
  offtakerSeasons: z.number().int().min(0),
  peerBenchmark: PeerBenchmarkSchema.nullable(),
  cooperativeRepaymentRate: z.number().min(0).max(1).nullable(),
  verificationStatus: z.object({
    cooperativeMembership: VerificationStatusSchema,
    offtakerRelationship: VerificationStatusSchema,
    peerBenchmark: VerificationStatusSchema,
  }),
});

const CompletenessInputsSchema = z.object({
  shamboproProfileComplete: z.boolean(),
  gpsConfirmed: z.boolean(),
  entryConsistencyScore: z.number().min(0).max(1),
  internalConsistencyScore: z.number().min(0).max(1),
  completenessPercentage: z.number().min(0).max(100),
});

const FarmerProfileSchema = z.object({
  farmerId: z.string().min(1),
  name: z.string().min(1),
  location: GPSSchema,
  region: z.enum(['kenya', 'uganda', 'rwanda']),
  primaryCrop: z.string().min(1),
  farmSizeAcres: z.number().min(0).max(100),
  currentSeason: z.string().min(1),
  financial: FinancialInputsSchema,
  productivity: ProductivityInputsSchema,
  climate: ClimateInputsSchema,
  social: SocialInputsSchema,
  completeness: CompletenessInputsSchema,
  createdAt: z.string(),
  lastUpdatedAt: z.string(),
  consentGrantedAt: z.string(),
  sharedProfiles: z.array(z.unknown()),
});

const DimensionWeightsSchema = z.object({
  financial_behaviour: z.number().min(0).max(1),
  farm_productivity:   z.number().min(0).max(1),
  climate_resilience:  z.number().min(0).max(1),
  social_coop_capital: z.number().min(0).max(1),
  record_completeness: z.number().min(0).max(1),
});

const ScoreRequestSchema = z.object({
  profile: FarmerProfileSchema,
  weights: DimensionWeightsSchema.optional(),
});

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON' } },
      { status: 400 }
    );
  }

  const parsed = ScoreRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: { code: 'INVALID_INPUT', message: parsed.error.message } },
      { status: 400 }
    );
  }

  try {
    const { profile, weights } = parsed.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const score = calculateComposite(profile as any, weights ?? DEFAULT_WEIGHTS);
    return Response.json({ score }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown scoring error';
    return Response.json(
      { error: { code: 'SCORING_FAILED', message } },
      { status: 500 }
    );
  }
}
