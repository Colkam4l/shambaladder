import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { generateFullExplanation } from '@/lib/featherless/generate-explanation';
import type { FarmerProfile, CompositeScore } from '@/types';

const GPSSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});

const VerificationStatusSchema = z.enum([
  'verified', 'self_reported', 'third_party', 'graph_derived', 'missing',
]);

const ExplainRequestSchema = z.object({
  profile: z.object({
    farmerId: z.string(),
    name: z.string(),
    location: GPSSchema,
    region: z.enum(['kenya', 'uganda', 'rwanda']),
    primaryCrop: z.string(),
    farmSizeAcres: z.number(),
    currentSeason: z.string(),
    financial: z.object({
      verificationStatus: z.object({
        mobileMoneyRegularity: VerificationStatusSchema,
        savingsGroupMember: VerificationStatusSchema,
        priorRepaymentOutcomes: VerificationStatusSchema,
      }),
    }),
    productivity: z.object({
      verificationStatus: z.object({
        yieldLastSeason: VerificationStatusSchema,
        gpsConfirmed: VerificationStatusSchema,
        soilQualityIndex: VerificationStatusSchema,
      }),
    }),
    climate: z.object({
      verificationStatus: z.object({
        rainfallIndexLastSeason: VerificationStatusSchema,
        adaptivePractices: VerificationStatusSchema,
      }),
    }),
    social: z.object({
      cooperativeId: z.string().nullable(),
      cooperativeName: z.string().nullable(),
      verificationStatus: z.object({
        cooperativeMembership: VerificationStatusSchema,
        offtakerRelationship: VerificationStatusSchema,
        peerBenchmark: VerificationStatusSchema,
      }),
    }),
  }),
  score: z.object({
    totalScore: z.number(),
    tier: z.enum(['seedling', 'growing', 'established', 'trusted']),
    dimensions: z.object({
      financial_behaviour: z.object({
        rawScore: z.number(),
        weight: z.number(),
        missingFields: z.array(z.string()),
      }),
      farm_productivity: z.object({
        rawScore: z.number(),
        weight: z.number(),
        missingFields: z.array(z.string()),
      }),
      climate_resilience: z.object({
        rawScore: z.number(),
        weight: z.number(),
        missingFields: z.array(z.string()),
      }),
      social_coop_capital: z.object({
        rawScore: z.number(),
        weight: z.number(),
        missingFields: z.array(z.string()),
      }),
      record_completeness: z.object({
        rawScore: z.number(),
        weight: z.number(),
        missingFields: z.array(z.string()),
      }),
    }),
  }),
  peerBenchmark: z.object({
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
  }).nullable(),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON' } },
      { status: 400 }
    );
  }

  const parsed = ExplainRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'INVALID_INPUT', message: parsed.error.message } },
      { status: 400 }
    );
  }

  try {
    const { profile, score, peerBenchmark } = parsed.data;
    const explanation = await generateFullExplanation(
      profile as unknown as FarmerProfile,
      score as unknown as CompositeScore,
      peerBenchmark
    );
    return NextResponse.json(explanation, { status: 200 });
  } catch (error) {
    console.error('[Explain API] Failed:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: { code: 'EXPLANATION_FAILED', message: `Could not generate explanation: ${message}` } },
      { status: 500 }
    );
  }
}
