import { NextRequest, NextResponse } from 'next/server';
import { getPeerBenchmark } from '@/lib/neo4j/peer-benchmark';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const farmerId = searchParams.get('farmerId');
  const cooperativeId = searchParams.get('cooperativeId');
  const primaryCrop = searchParams.get('primaryCrop');
  const farmSizeAcresStr = searchParams.get('farmSizeAcres');
  const farmSizeToleranceStr = searchParams.get('farmSizeTolerance');

  if (!farmerId || !cooperativeId || !primaryCrop || !farmSizeAcresStr) {
    return NextResponse.json(
      { error: { code: 'MISSING_PARAMS', message: 'Required query parameters: farmerId, cooperativeId, primaryCrop, farmSizeAcres' } },
      { status: 400 }
    );
  }

  const farmSizeAcres = parseFloat(farmSizeAcresStr);
  if (isNaN(farmSizeAcres)) {
    return NextResponse.json(
      { error: { code: 'INVALID_INPUT', message: 'farmSizeAcres must be a valid number' } },
      { status: 400 }
    );
  }

  const farmSizeTolerance = farmSizeToleranceStr ? parseFloat(farmSizeToleranceStr) : 1.5;
  if (isNaN(farmSizeTolerance)) {
    return NextResponse.json(
      { error: { code: 'INVALID_INPUT', message: 'farmSizeTolerance must be a valid number' } },
      { status: 400 }
    );
  }

  try {
    const benchmark = await getPeerBenchmark(
      farmerId,
      cooperativeId,
      primaryCrop,
      farmSizeAcres,
      farmSizeTolerance
    );
    return NextResponse.json({ benchmark }, { status: 200 });
  } catch (error) {
    console.error('[API] GET /api/neo4j/peer failed:', error);
    return NextResponse.json(
      { error: { code: 'NEO4J_UNAVAILABLE', message: 'Cannot reach Neo4j Aura database' } },
      { status: 503 }
    );
  }
}
