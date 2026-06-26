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

    // Run explanation LLM
    const explanation = await generateFullExplanation(profile, score, peerBenchmark);

    // Store in cache
    const responsePayload = {
      profile,
      score,
      explanation,
      peerBenchmark,
    };
    demoScoreCache.set(farmerId, responsePayload);

    return NextResponse.json(responsePayload, { status: 200 });
  } catch (error: any) {
    console.error(`Failed to generate demo score for farmer:`, error);
    return NextResponse.json(
      {
        error: {
          code: 'SERVER_ERROR',
          message: error.message || 'An internal error occurred.',
        },
      },
      { status: 500 }
    );
  }
}
