import { runQuery } from './client';
import type { PeerBenchmarkResult } from '@/types';

const MIN_PEER_SAMPLE = 10;

const PEER_BENCHMARK_QUERY = `
  MATCH (f:Farmer {farmerId: $farmerId})-[:MEMBER_OF]->(c:Cooperative {cooperativeId: $cooperativeId})
  MATCH (peer:Farmer)-[m:MEMBER_OF]->(c)
  WHERE peer.farmerId <> $farmerId
    AND peer.primaryCrop = $primaryCrop
    AND abs(peer.farmSizeAcres - $farmSizeAcres) < $farmSizeTolerance
    AND m.repaymentOutcome IS NOT NULL
  RETURN
    count(peer) AS peerCount,
    sum(CASE WHEN m.repaymentOutcome = 'on_time' THEN 1 ELSE 0 END) AS onTimeCount,
    sum(CASE WHEN m.repaymentOutcome = 'late' THEN 1 ELSE 0 END) AS lateCount,
    sum(CASE WHEN m.repaymentOutcome = 'default' THEN 1 ELSE 0 END) AS defaultCount,
    avg(peer.currentTier) AS avgPeerTier
`;

function toNumber(val: unknown): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'object' && val !== null && 'low' in val) {
    return (val as { low: number }).low;
  }
  return Number(val);
}

export async function getPeerBenchmark(
  farmerId: string,
  cooperativeId: string,
  primaryCrop: string,
  farmSizeAcres: number,
  farmSizeTolerance = 1.5
): Promise<PeerBenchmarkResult | null> {
  if (!cooperativeId) return null;

  const coopResult = await runQuery<{ name: string }>(
    `MATCH (c:Cooperative {cooperativeId: $cooperativeId}) RETURN c.name AS name`,
    { cooperativeId }
  );
  
  const cooperativeName = coopResult[0]?.name || 'Unknown Cooperative';

  const results = await runQuery<{
    peerCount: unknown;
    onTimeCount: unknown;
    lateCount: unknown;
    defaultCount: unknown;
    avgPeerTier: number | null;
  }>(PEER_BENCHMARK_QUERY, {
    farmerId,
    cooperativeId,
    primaryCrop,
    farmSizeAcres,
    farmSizeTolerance,
  });

  if (!results.length) return null;

  const row = results[0];
  const peerCount = toNumber(row.peerCount);
  const onTimeCount = toNumber(row.onTimeCount);
  const lateCount = toNumber(row.lateCount);
  const defaultCount = toNumber(row.defaultCount);
  const avgPeerTier = row.avgPeerTier !== null ? Number(row.avgPeerTier) : 0;

  if (peerCount === 0) return null;

  const sufficientData = peerCount >= MIN_PEER_SAMPLE;
  const repaymentRate = onTimeCount / peerCount;

  return {
    cooperativeId,
    cooperativeName,
    peerCount,
    onTimeCount,
    lateCount,
    defaultCount,
    avgPeerTier,
    repaymentRate,
    displayString: `${onTimeCount} of ${peerCount} similar farmers in this cooperative repaid on time`,
    sufficientData,
  };
}

export async function getPeerBenchmarkSafe(
  ...args: Parameters<typeof getPeerBenchmark>
): Promise<PeerBenchmarkResult | null> {
  try {
    return await getPeerBenchmark(...args);
  } catch (error) {
    console.error('[Neo4j] Peer benchmark query failed:', error);
    return null;
  }
}

export async function getCooperativeRepaymentRate(
  cooperativeId: string
): Promise<{ repaymentRate: number | null; name: string | null } | null> {
  if (!cooperativeId) return null;
  try {
    const results = await runQuery<{ avgRepaymentRate: number; name: string }>(
      `MATCH (c:Cooperative {cooperativeId: $cooperativeId}) RETURN c.avgRepaymentRate AS avgRepaymentRate, c.name AS name`,
      { cooperativeId }
    );
    if (!results.length) return null;
    return {
      repaymentRate: results[0].avgRepaymentRate,
      name: results[0].name,
    };
  } catch (error) {
    console.error('[Neo4j] Cooperative trust rate query failed:', error);
    return null;
  }
}
