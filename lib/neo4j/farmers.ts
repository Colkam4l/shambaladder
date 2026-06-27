// lib/neo4j/farmers.ts
// Neo4j database helper to save and retrieve farmer profiles.
// Keeps query properties indexed on nodes, and stores the full FarmerProfile as a JSON string.

import { runQuery } from './client';
import type { FarmerProfile } from '@/types';
import { calculateComposite } from '../scoring';

export async function saveFarmerToGraph(profile: FarmerProfile): Promise<void> {
  const composite = calculateComposite(profile);
  const tierNumber = 
    composite.tier === 'trusted' ? 4 :
    composite.tier === 'established' ? 3 :
    composite.tier === 'growing' ? 2 : 1;

  // Storing queryable properties separately, and the full object as serialized JSON.
  const query = `
    MERGE (f:Farmer {farmerId: $farmerId})
    SET f.name = $name,
        f.primaryCrop = $primaryCrop,
        f.farmSizeAcres = $farmSizeAcres,
        f.currentTier = $currentTier,
        f.region = $region,
        f.profileJson = $profileJson
    WITH f
    MATCH (c:Cooperative {cooperativeId: 'coop-kisii-001'})
    MERGE (f)-[m:MEMBER_OF]->(c)
    SET m.tenureSeasons = $tenureSeasons
  `;

  await runQuery(query, {
    farmerId: profile.farmerId,
    name: profile.name,
    primaryCrop: profile.primaryCrop,
    farmSizeAcres: profile.farmSizeAcres,
    currentTier: tierNumber,
    region: profile.region,
    profileJson: JSON.stringify(profile),
    tenureSeasons: profile.social.cooperativeMemberSinceSeasons || 1,
  });
}

export async function getFarmersFromGraph(): Promise<FarmerProfile[]> {
  const query = `
    MATCH (f:Farmer)
    RETURN f.profileJson AS profileJson
  `;

  const results = await runQuery<{ profileJson: string }>(query, {});
  return results
    .map(r => {
      try {
        return JSON.parse(r.profileJson) as FarmerProfile;
      } catch {
        return null;
      }
    })
    .filter(Boolean) as FarmerProfile[];
}
