// app/api/demo/score/[farmerId]/route.ts
import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { calculateComposite } from '../../../../../lib/scoring';
import { generateFullExplanation } from '../../../../../lib/featherless/generate-explanation';
import { getPeerBenchmarkSafe } from '../../../../../lib/neo4j/peer-benchmark';
import { demoScoreCache } from '../../../../../lib/share-store';
import { DEFAULT_WEIGHTS, FarmerProfile } from '../../../../../types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ farmerId: string }> }
) {
  try {
    const { farmerId } = await params;

    if (!farmerId) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_INPUT',
            message: 'farmerId is required.',
          },
        },
        { status: 400 }
      );
    }

    // Check in-memory cache first
    const cachedData = demoScoreCache.get(farmerId);
    if (cachedData) {
      return NextResponse.json(cachedData, { status: 200 });
    }

    // Map farmerId to filename
    let filename = '';
    if (farmerId === 'demo-wanjiku-001') {
      filename = 'wanjiku.json';
    } else if (farmerId === 'demo-joseph-001') {
      filename = 'joseph.json';
    } else if (farmerId === 'demo-amina-001') {
      filename = 'amina.json';
    } else {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: `Demo farmer with ID ${farmerId} not found.`,
          },
        },
        { status: 404 }
      );
    }

    // Load file from public/demo-data
    const dataDir = path.join(process.cwd(), 'public', 'demo-data');
    const filePath = path.join(dataDir, filename);
    const fileContent = await fs.readFile(filePath, 'utf8');
    const profile: FarmerProfile = JSON.parse(fileContent);

    // Fetch peer benchmark from Neo4j (if applicable)
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

    // Run scoring engine
    const score = calculateComposite(profile, DEFAULT_WEIGHTS);

    // Run explanation LLM with fallback
    let explanation;
    try {
      explanation = await generateFullExplanation(profile, score, peerBenchmark);
    } catch (llmError) {
      console.warn(`[API] LLM explanation generation failed for ${farmerId}, using fallback:`, llmError);
      explanation = {
        farmerId: profile.farmerId,
        compositeExplanation: `The ShambaLadder assessment for ${profile.name} indicates a baseline credit profile. Recommended for seasonal input credit financing.`,
        tierExplanation: `Farmer is categorized in the ${score.tier.toUpperCase()} tier based on verified cooperative historical membership and self-reported inputs.`,
        dimensions: {
          financial_behaviour: {
            dimension: 'financial_behaviour',
            explanation: 'Self-reported financial indicators suggest active mobile money transactions and savings group contributions.',
            keyStrength: 'Active savings group member',
            keyGap: 'No external verified credit records'
          },
          farm_productivity: {
            dimension: 'farm_productivity',
            explanation: 'Sufficient crop diversity and yield records reported for the selected acreage.',
            keyStrength: 'Good crop diversification',
            keyGap: 'GPS boundaries unverified'
          },
          climate_resilience: {
            dimension: 'climate_resilience',
            explanation: 'Adoption of drought-tolerant seeds and basic conservation practices helps mitigate weather risks.',
            keyStrength: 'Drought-tolerant seed usage',
            keyGap: 'No formal irrigation access'
          },
          social_coop_capital: {
            dimension: 'social_coop_capital',
            explanation: 'Cooperative membership verified. Good peer benchmark group connection.',
            keyStrength: 'Cooperative membership active',
            keyGap: 'No group lending guarantee'
          },
          record_completeness: {
            dimension: 'record_completeness',
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
            targetDimension: 'farm_productivity',
            effort: 'quick'
          },
          {
            rank: 2,
            action: 'Increase cooperative savings regularity and contribution levels',
            estimatedScoreImpact: 6,
            targetDimension: 'financial_behaviour',
            effort: 'medium'
          },
          {
            rank: 3,
            action: 'Implement post-harvest storage solutions to reduce loss',
            estimatedScoreImpact: 5,
            targetDimension: 'climate_resilience',
            effort: 'medium'
          }
        ],
        computedAt: new Date().toISOString()
      };
    }

    // Store in cache
    const responsePayload = {
      profile,
      score,
      explanation,
      peerBenchmark,
    };
    demoScoreCache.set(farmerId, responsePayload);

    return NextResponse.json(responsePayload, { status: 200 });
  } catch (error: unknown) {
    console.error(`Failed to generate demo score for farmer:`, error);
    const message = error instanceof Error ? error.message : 'An internal error occurred.';
    return NextResponse.json(
      {
        error: {
          code: 'SERVER_ERROR',
          message,
        },
      },
      { status: 500 }
    );
  }
}
