# neo4j-queries.md — Neo4j Graph Queries
# ShambaLadder · Kenya AI Challenge 2025

## Purpose
Defines the Neo4j Aura graph schema, all Cypher queries, the synthetic seed data structure, and the peer benchmark logic. Agents building Sprint 2 read this document.

---

## Connection

```typescript
// lib/neo4j/client.ts
import neo4j from 'neo4j-driver';

const driver = neo4j.driver(
  process.env.NEO4J_URI!,
  neo4j.auth.basic(process.env.NEO4J_USERNAME!, process.env.NEO4J_PASSWORD!)
);

export async function runQuery<T>(
  cypher: string,
  params: Record<string, unknown>
): Promise<T[]> {
  const session = driver.session();
  try {
    const result = await session.run(cypher, params);
    return result.records.map(r => r.toObject() as T);
  } finally {
    await session.close();
  }
}
```

**Environment variables:**
```
NEO4J_URI=neo4j+s://[your-aura-instance].databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=[your-aura-password]
```

---

## Node Schema

### Farmer Node
```cypher
(:Farmer {
  farmerId: String,          // UUID
  name: String,
  primaryCrop: String,       // 'maize' | 'beans' | 'coffee' | etc.
  farmSizeAcres: Float,
  currentTier: Integer,      // 1 (Seedling) to 4 (Trusted)
  region: String             // 'kisii' | 'kakamega' | etc.
})
```

### Cooperative Node
```cypher
(:Cooperative {
  cooperativeId: String,
  name: String,
  region: String,
  country: String,            // 'kenya' | 'uganda' | 'rwanda'
  avgRepaymentRate: Float     // 0.0 to 1.0, updated periodically
})
```

### Region Node
```cypher
(:Region {
  regionId: String,
  name: String,
  country: String
})
```

---

## Relationship Schema

### MEMBER_OF
```cypher
(f:Farmer)-[:MEMBER_OF {
  tenureSeasons: Integer,
  repaymentOutcome: String   // 'on_time' | 'late' | 'default' | null (no cycle yet)
}]->(c:Cooperative)
```

### LOCATED_IN
```cypher
(c:Cooperative)-[:LOCATED_IN]->(r:Region)
```

---

## Synthetic Seed Data (Sprint 2)

Seed 50 farmers into Neo4j Aura, all in **Kisii Cooperative** (cooperativeId: `coop-kisii-001`), all growing **maize**, farm sizes **1.5-4.0 acres**.

Distribution:
- 10 farmers: repaymentOutcome = null (new members, no cycle yet)
- 8 farmers: repaymentOutcome = 'default'
- 4 farmers: repaymentOutcome = 'late'
- 28 farmers: repaymentOutcome = 'on_time'

This produces: 28 on-time out of 40 farmers with completed cycles = 70% repayment rate.

For the demo with Wanjiku Kamau (2.5 acres, maize), the peer query will select farmers with farmSizeAcres within 1.5 acres of 2.5 (i.e. 1.0-4.0 acres) who grow maize in Kisii Cooperative. That covers most of the 50 synthetic farmers.

**Target peer benchmark output for Wanjiku:** "19 of 23 similar farmers in Kisii Cooperative repaid on time."

Adjust seed data to produce this specific output for the demo. (23 farmers with farm sizes 1.0-4.0, 19 on-time.)

### Seed Script

```typescript
// scripts/seed-neo4j.ts
// Run with: npx tsx scripts/seed-neo4j.ts

import { runQuery } from '../lib/neo4j/client';

async function seed() {
  // Create Kisii Cooperative
  await runQuery(`
    MERGE (:Cooperative {
      cooperativeId: 'coop-kisii-001',
      name: 'Kisii Maize Cooperative',
      region: 'kisii',
      country: 'kenya',
      avgRepaymentRate: 0.70
    })
  `, {});

  // Create Region
  await runQuery(`
    MERGE (:Region { regionId: 'region-kisii', name: 'Kisii', country: 'kenya' })
  `, {});

  // Create cooperative-region relationship
  await runQuery(`
    MATCH (c:Cooperative {cooperativeId: 'coop-kisii-001'})
    MATCH (r:Region {regionId: 'region-kisii'})
    MERGE (c)-[:LOCATED_IN]->(r)
  `, {});

  // Create 50 synthetic farmers
  // See full seed data array in scripts/neo4j-seed-data.ts
  for (const farmer of SYNTHETIC_FARMERS) {
    await runQuery(`
      MERGE (f:Farmer {farmerId: $farmerId})
      SET f.name = $name,
          f.primaryCrop = $primaryCrop,
          f.farmSizeAcres = $farmSizeAcres,
          f.currentTier = $currentTier,
          f.region = $region
    `, farmer);

    await runQuery(`
      MATCH (f:Farmer {farmerId: $farmerId})
      MATCH (c:Cooperative {cooperativeId: 'coop-kisii-001'})
      MERGE (f)-[m:MEMBER_OF]->(c)
      SET m.tenureSeasons = $tenureSeasons,
          m.repaymentOutcome = $repaymentOutcome
    `, {
      farmerId: farmer.farmerId,
      tenureSeasons: farmer.tenureSeasons,
      repaymentOutcome: farmer.repaymentOutcome,
    });
  }
}

seed().then(() => console.log('Neo4j seed complete')).catch(console.error);
```

---

## Queries

### 1. Peer Benchmark Query

The primary query. Returns repayment statistics for farmers similar to the target farmer in the same cooperative.

```cypher
// Peer benchmark for a target farmer
// Parameters: $farmerId, $cooperativeId, $primaryCrop, $farmSizeAcres, $farmSizeTolerance
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
```

**Default `$farmSizeTolerance`: 1.5 acres**

### TypeScript wrapper

```typescript
// lib/neo4j/peer-benchmark.ts

export interface PeerBenchmarkResult {
  peerCount: number;
  onTimeCount: number;
  lateCount: number;
  defaultCount: number;
  avgPeerTier: number;
  repaymentRate: number;
  displayString: string;
  sufficientData: boolean;
}

const MIN_PEER_SAMPLE = 10;

export async function getPeerBenchmark(
  farmerId: string,
  cooperativeId: string,
  primaryCrop: string,
  farmSizeAcres: number,
  farmSizeTolerance = 1.5
): Promise<PeerBenchmarkResult | null> {
  if (!cooperativeId) return null;

  const results = await runQuery<{
    peerCount: { low: number };
    onTimeCount: { low: number };
    lateCount: { low: number };
    defaultCount: { low: number };
    avgPeerTier: number;
  }>(PEER_BENCHMARK_QUERY, {
    farmerId,
    cooperativeId,
    primaryCrop,
    farmSizeAcres,
    farmSizeTolerance,
  });

  if (!results.length) return null;

  const row = results[0];
  const peerCount = row.peerCount.low;
  const onTimeCount = row.onTimeCount.low;

  if (peerCount === 0) return null;

  const sufficientData = peerCount >= MIN_PEER_SAMPLE;
  const repaymentRate = onTimeCount / peerCount;

  return {
    peerCount,
    onTimeCount,
    lateCount: row.lateCount.low,
    defaultCount: row.defaultCount.low,
    avgPeerTier: row.avgPeerTier,
    repaymentRate,
    displayString: `${onTimeCount} of ${peerCount} similar farmers in this cooperative repaid on time`,
    sufficientData,
  };
}
```

### 2. Cooperative Trust Rate Query

Used when a farmer is a new member (no personal repayment history). Fetches the cooperative-level repayment rate to use as a social trust signal.

```cypher
MATCH (c:Cooperative {cooperativeId: $cooperativeId})
RETURN c.avgRepaymentRate AS avgRepaymentRate, c.name AS cooperativeName
```

### 3. Insert Demo Farmer into Graph

Run at demo setup to ensure the three demo farmers exist in the graph.

```cypher
MERGE (f:Farmer {farmerId: $farmerId})
SET f.name = $name,
    f.primaryCrop = $primaryCrop,
    f.farmSizeAcres = $farmSizeAcres,
    f.currentTier = $currentTier,
    f.region = $region
WITH f
MATCH (c:Cooperative {cooperativeId: $cooperativeId})
MERGE (f)-[m:MEMBER_OF]->(c)
SET m.tenureSeasons = $tenureSeasons,
    m.repaymentOutcome = $repaymentOutcome
```

**Demo farmer graph entries:**
- Wanjiku: tenureSeasons=2, repaymentOutcome=null (first-time borrower)
- Joseph: tenureSeasons=4, repaymentOutcome='on_time'
- Amina: tenureSeasons=0, repaymentOutcome=null (not a cooperative member)

---

## Display Logic

### When to show peer benchmark in lender view

```typescript
if (!peerBenchmark || !peerBenchmark.sufficientData) {
  // Show cold-start message
  return "Insufficient peer data. Available after first full lending cycle.";
}

// Show benchmark
return peerBenchmark.displayString;
// e.g. "19 of 23 similar farmers in Kisii Cooperative repaid on time"
```

### Score impact of peer benchmark

The peer benchmark feeds into **Dimension 4: Social & Cooperative Capital** scoring as described in `scoring-engine.md`. It does not appear as a standalone score on the scorecard.

---

## Error Handling

```typescript
// lib/neo4j/peer-benchmark.ts

export async function getPeerBenchmarkSafe(
  ...args: Parameters<typeof getPeerBenchmark>
): Promise<PeerBenchmarkResult | null> {
  try {
    return await getPeerBenchmark(...args);
  } catch (error) {
    console.error('[Neo4j] Peer benchmark query failed:', error);
    // Graceful degradation: return null, show cold-start message
    // Do NOT throw — scoring must work even if Neo4j is unreachable
    return null;
  }
}
```

---

## Neo4j Aura Setup

1. Create a free Neo4j Aura instance at https://neo4j.com/cloud/aura/
2. Download the connection credentials
3. Add `NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD` to `.env.local`
4. Install driver: `npm install neo4j-driver`
5. Run seed script: `npx tsx scripts/seed-neo4j.ts`
6. Verify in Neo4j Browser: `MATCH (f:Farmer) RETURN count(f)` should return 50

---

*ShambaLadder · Kenya AI Challenge 2025*
