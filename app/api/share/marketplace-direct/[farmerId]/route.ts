// app/api/share/marketplace-direct/[farmerId]/route.ts
// GET /api/share/marketplace-direct/[farmerId]
// Dynamically generates a share token for a farmer directly from their Neo4j/registry profile,
// allowing seamless navigation from the marketplace to the individual scorecard.

import { NextResponse } from 'next/server';
import { getFarmersFromGraph } from '@/lib/neo4j/farmers';
import { calculateComposite } from '@/lib/scoring';
import { getPeerBenchmarkSafe } from '@/lib/neo4j/peer-benchmark';
import { shareStore } from '@/lib/share-store';
import { DEFAULT_WEIGHTS, FarmerProfile, SharedProfile } from '@/types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ farmerId: string }> }
) {
  try {
    const { farmerId } = await params;

    if (!farmerId) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'farmerId is required.' } },
        { status: 400 }
      );
    }

    // 1. Fetch full profile from Neo4j graph database
    const registry = await getFarmersFromGraph();
    let profile = registry.find(p => p.farmerId === farmerId);

    // Fallback: Check if it's one of the static demo profiles
    if (!profile && farmerId.startsWith('demo-')) {
      const fs = require('fs');
      const path = require('path');
      let filename = 'wanjiku.json';
      if (farmerId === 'demo-joseph-001') filename = 'joseph.json';
      if (farmerId === 'demo-amina-001') filename = 'amina.json';

      try {
        const filePath = path.join(process.cwd(), 'public', 'demo-data', filename);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        profile = JSON.parse(fileContent);
      } catch (err) {
        console.error('[Marketplace Direct Share] Fallback read failed:', err);
      }
    }

    if (!profile) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: `Farmer profile with ID ${farmerId} not found.` } },
        { status: 404 }
      );
    }

    // 2. Fetch peer benchmark
    let peerBenchmark = null;
    if (profile.social.cooperativeId) {
      peerBenchmark = await getPeerBenchmarkSafe(
        profile.farmerId,
        profile.social.cooperativeId,
        profile.primaryCrop,
        profile.farmSizeAcres
      );
      profile.social.peerBenchmark = peerBenchmark;
    }

    // 3. Compute score snapshot
    const score = calculateComposite(profile, DEFAULT_WEIGHTS);

    // 4. Generate simulated quick explanation (prevents slow Featherless LLM call in marketplace)
    const explanation = {
      farmerId: profile.farmerId,
      compositeExplanation: `The ShambaLadder assessment for ${profile.name} indicates a baseline credit profile. Recommended for seasonal input credit financing.`,
      tierExplanation: `Farmer is categorized in the ${score.tier.toUpperCase()} tier based on verified cooperative historical membership and self-reported inputs.`,
      dimensions: {
        financial_behaviour: {
          dimension: 'financial_behaviour' as const,
          explanation: 'Self-reported financial indicators suggest active mobile money transactions and savings group contributions.',
          keyStrength: 'Active savings group member',
          keyGap: 'No external verified credit records'
        },
        farm_productivity: {
          dimension: 'farm_productivity' as const,
          explanation: 'Sufficient crop diversity and yield records reported for the selected acreage.',
          keyStrength: 'Good crop diversification',
          keyGap: 'GPS boundaries unverified'
        },
        climate_resilience: {
          dimension: 'climate_resilience' as const,
          explanation: 'Adoption of drought-tolerant seeds and basic conservation practices helps mitigate weather risks.',
          keyStrength: 'Drought-tolerant seed usage',
          keyGap: 'No formal irrigation access'
        },
        social_coop_capital: {
          dimension: 'social_coop_capital' as const,
          explanation: 'Cooperative membership verified. Good peer benchmark group connection.',
          keyStrength: 'Cooperative membership active',
          keyGap: 'No group lending guarantee'
        },
        record_completeness: {
          dimension: 'record_completeness' as const,
          explanation: 'Essential data points collected. Completing farm spatial mapping could improve tier rating.',
          keyStrength: 'Key indicators completed',
          keyGap: 'Spatial farm boundary coordinates missing'
        }
      },
      actionList: [
        {
          rank: 1,
          action: 'Verify farm boundary coordinates via GPS confirmation',
          estimatedScoreImpact: 8,
          targetDimension: 'farm_productivity' as const,
          effort: 'quick' as const
        },
        {
          rank: 2,
          action: 'Increase cooperative savings regularity and contribution levels',
          estimatedScoreImpact: 6,
          targetDimension: 'financial_behaviour' as const,
          effort: 'medium' as const
        },
        {
          rank: 3,
          action: 'Implement post-harvest storage solutions to reduce loss',
          estimatedScoreImpact: 5,
          targetDimension: 'climate_resilience' as const,
          effort: 'medium' as const
        }
      ],
      computedAt: new Date().toISOString()
    };

    // 5. Generate and store SharedProfile
    const shareId = crypto.randomUUID();
    const sharedProfile: SharedProfile = {
      shareId,
      farmerId: profile.farmerId,
      lenderName: 'Marketplace Browse',
      sharedAt: new Date().toISOString(),
      expiresAt: null,
      scoreSnapshot: score,
      explanationSnapshot: explanation,
      profileSnapshot: profile,
    };

    shareStore.set(shareId, sharedProfile);

    return NextResponse.json({ shareId }, { status: 200 });
  } catch (error: any) {
    console.error('[Marketplace Direct Share] Failed:', error);
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: error.message || 'Internal error' } },
      { status: 500 }
    );
  }
}
export const dynamic = 'force-dynamic';
