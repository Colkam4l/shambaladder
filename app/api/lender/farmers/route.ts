// app/api/lender/farmers/route.ts
// GET /api/lender/farmers
// Returns all marketplace farmers with computed scores, filterable by query params.
// No PII gating needed here since names are shown per Decision 3 (Option B).

import { NextRequest, NextResponse } from 'next/server';
import { FARMER_REGISTRY } from '@/lib/farmer-registry/registry-data';
import { calculateComposite } from '@/lib/scoring';
import { DEFAULT_WEIGHTS } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const minScore   = searchParams.get('minScore')   ? Number(searchParams.get('minScore'))   : 0;
  const tiers      = searchParams.getAll('tier');    // ?tier=trusted&tier=established
  const crop       = searchParams.get('crop')        ?? '';
  const region     = searchParams.get('region')      ?? '';
  const minAcres   = searchParams.get('minAcres')    ? Number(searchParams.get('minAcres'))   : 0;
  const maxAcres   = searchParams.get('maxAcres')    ? Number(searchParams.get('maxAcres'))   : 100;

  const results = FARMER_REGISTRY
    .filter(p => p.marketplaceConsent)
    .map(profile => {
      let score;
      try {
        score = calculateComposite(profile, DEFAULT_WEIGHTS);
      } catch {
        return null;
      }

      // Top strength: highest adjusted dimension
      const dims = score.dimensions;
      const dimEntries = Object.entries(dims) as [string, { adjustedScore: number }][];
      const topStrength = dimEntries
        .filter(([k]) => k !== 'record_completeness')
        .sort(([, a], [, b]) => b.adjustedScore - a.adjustedScore)[0]?.[0] ?? '';

      // Top gap: lowest raw score dimension  
      const topGap = dimEntries
        .filter(([k]) => k !== 'record_completeness')
        .sort(([, a], [, b]) => a.adjustedScore - b.adjustedScore)[0]?.[0] ?? '';

      return {
        farmerId:       profile.farmerId,
        name:           profile.name,
        region:         profile.region,
        primaryCrop:    profile.primaryCrop,
        farmSizeAcres:  profile.farmSizeAcres,
        cooperativeName: profile.social.cooperativeName,
        totalScore:     score.totalScore,
        tier:           score.tier,
        completeness:   profile.completeness.completenessPercentage,
        topStrength,
        topGap,
        peerBenchmark:  profile.social.peerBenchmark?.displayString ?? null,
        createdAt:      profile.createdAt,
      };
    })
    .filter(Boolean)
    .filter(f => {
      if (!f) return false;
      if (f.totalScore < minScore)                            return false;
      if (tiers.length > 0 && !tiers.includes(f.tier))       return false;
      if (crop && f.primaryCrop !== crop)                     return false;
      if (region && f.region !== region)                      return false;
      if (f.farmSizeAcres < minAcres)                         return false;
      if (f.farmSizeAcres > maxAcres)                         return false;
      return true;
    })
    .sort((a, b) => (b?.totalScore ?? 0) - (a?.totalScore ?? 0));

  return NextResponse.json({ farmers: results, total: results.length });
}
