# ShambaLadder — Neo4j Usage Report & Database Architecture Analysis
**For pitch preparation and post-hackathon decision-making**

---

## Part 1: Where Neo4j Is Used in the Project

Neo4j touches exactly **one functional area** of ShambaLadder: the **Social & Cooperative Capital** dimension (Dimension 4) of the scoring engine. It is not used for storing farmer profiles, sharing snapshots, or any application state. It is purely the **peer benchmarking data engine**.

### The Three Files That Use Neo4j

---

#### 1. `lib/neo4j/client.ts` — Connection wrapper

This is the raw database connection layer. It:
- Reads credentials from `NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD` in `.env.local`
- Creates a singleton Neo4j driver (one connection reused across requests)
- Exposes a single generic `runQuery<T>(cypher, params)` function that runs any Cypher query and returns typed results
- Exposes `closeDriver()` for clean shutdown

The client is deliberately thin — it does not know anything about farmers or cooperatives. It just executes Cypher statements.

---

#### 2. `lib/neo4j/peer-benchmark.ts` — Business logic layer

This is where the actual graph intelligence lives. It contains three functions:

**`getPeerBenchmark(farmerId, cooperativeId, primaryCrop, farmSizeAcres, farmSizeTolerance=1.5)`**

This is the primary query. Given a farmer's details, it:
1. Finds the target farmer's cooperative in the graph
2. Finds all **other** farmers in the same cooperative who:
   - Grow the same primary crop
   - Have a farm size within ±1.5 acres of the target farmer (configurable tolerance)
   - Have a completed repayment cycle (non-null outcome)
3. Returns: peer count, on-time count, late count, default count, average peer tier, and a computed repayment rate

The Cypher query doing this in a single graph traversal:
```cypher
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

**`getPeerBenchmarkSafe(...)`**

A wrapper that catches any Neo4j error and returns `null` instead of throwing. This ensures the scoring engine degrades gracefully — if Neo4j is unreachable, the farmer still gets a score; the peer benchmark section just shows "Insufficient data."

**`getCooperativeRepaymentRate(cooperativeId)`**

A fallback query. If a farmer is a new cooperative member with no personal peers (or the peer sample is too small), this fetches the cooperative-level average repayment rate (`avgRepaymentRate`) stored on the Cooperative node itself. This rate (0.70 for Kisii Cooperative) was set during seeding and feeds into the Social score formula as the fallback trust signal.

---

#### 3. `app/api/neo4j/peer/route.ts` — HTTP API endpoint

The REST interface that wraps the business logic. It is a `GET /api/neo4j/peer` endpoint that:
- Accepts `farmerId`, `cooperativeId`, `primaryCrop`, `farmSizeAcres` as query params
- Validates all required params and numeric parsing
- Calls `getPeerBenchmark()` and returns the result as JSON
- Returns `503 NEO4J_UNAVAILABLE` if the database is down (graceful error surfacing)

This endpoint is called during:
1. **Demo profile loading** — when a judge clicks "View profile", the score API calls this to enrich the Social score
2. **Onboarding form submission** — Step 5 of the onboarding form calls this before scoring to include peer context

---

#### 4. `scripts/seed-neo4j.ts` — Data seeding (run once)

A one-off script run with `npx tsx scripts/seed-neo4j.ts`. It:
1. Wipes all existing `Farmer`, `Cooperative`, and `Region` nodes
2. Creates one `Cooperative` node: **Kisii Maize Cooperative** with `avgRepaymentRate: 0.70`
3. Creates one `Region` node: **Kisii, Kenya**
4. Creates a `LOCATED_IN` relationship between them
5. Seeds **50 synthetic farmers** with their `MEMBER_OF` relationships to the cooperative, each carrying `tenureSeasons` and `repaymentOutcome` properties
6. Seeds the 3 demo farmers (Wanjiku, Joseph, Amina) with their specific graph entries

The 50 farmers are distributed as: 18 on-time, 2 late, 2 default (in-range for peer matching), plus out-of-range and null-outcome farmers. This produces the target peer benchmark output: **approximately 70% repayment rate** for the cooperative overall.

---

### Graph Schema Summary

```
(:Farmer {farmerId, name, primaryCrop, farmSizeAcres, currentTier, region})
    -[:MEMBER_OF {tenureSeasons, repaymentOutcome}]->
(:Cooperative {cooperativeId, name, region, country, avgRepaymentRate})
    -[:LOCATED_IN]->
(:Region {regionId, name, country})
```

The relationship properties on `MEMBER_OF` (tenure seasons, repayment outcome) are what make the peer query possible — these facts live on the edges of the graph, not in separate join tables.

---

## Part 2: Why Neo4j and Not Something Else

### The Problem Being Solved

The peer benchmark query is fundamentally a **graph traversal question**:

> *"Who are the farmers that look like me (same crop, similar farm size) inside my cooperative, and how did they repay their loans?"*

This requires navigating **relationships between entities**, not just retrieving rows. The natural language of the problem — "farmers connected to cooperatives through membership relationships" — maps directly to a property graph.

---

### Why Not PostgreSQL / Supabase (Relational)?

You could absolutely model this in a relational database. Here is what it would look like:

```sql
-- Tables needed
farmers (farmer_id, name, primary_crop, farm_size_acres, current_tier, region)
cooperatives (cooperative_id, name, avg_repayment_rate, region)
farmer_cooperative_memberships (farmer_id, cooperative_id, tenure_seasons, repayment_outcome)

-- The peer benchmark query
SELECT
  COUNT(*) as peer_count,
  SUM(CASE WHEN m.repayment_outcome = 'on_time' THEN 1 ELSE 0 END) as on_time_count,
  ...
FROM farmer_cooperative_memberships m
JOIN farmers peer ON peer.farmer_id = m.farmer_id
WHERE m.cooperative_id = $cooperativeId
  AND peer.farmer_id != $farmerId
  AND peer.primary_crop = $primaryCrop
  AND ABS(peer.farm_size_acres - $farmSizeAcres) < 1.5
  AND m.repayment_outcome IS NOT NULL
```

This SQL query would work. So why not use it?

**Reason 1: The future data model is inherently graph-shaped.**

The current prototype only has one hop: Farmer → Cooperative. But the intended production model from `neo4j-queries.md` and the design documents includes:
- Farmer → Cooperative (membership + repayment)
- Cooperative → Region (geographic context)
- Farmer → Farmer (peer references, guarantor relationships in group lending)
- Cooperative → Cooperative (inter-cooperative lending networks)

As soon as you add two-hop relationships ("find farmers who are in cooperatives near my cooperative that have high repayment rates"), a relational JOIN chain becomes cumbersome. A graph traversal stays clean regardless of depth. This was a deliberate forward-architecture decision.

**Reason 2: The query reads like the domain, not like a JOIN cascade.**

The Cypher query is nearly readable as plain English:
```
MATCH (farmer)-[:MEMBER_OF]->(cooperative)
MATCH (peer)-[:MEMBER_OF]->(same cooperative)
WHERE peer looks like farmer
RETURN peer repayment stats
```
This is a genuine advantage when explaining the system to a panel or a lender partner — the data model is self-documenting.

**Reason 3: Relationship properties as first-class citizens.**

In the schema, `tenure_seasons` and `repayment_outcome` live on the `MEMBER_OF` relationship itself, not in a separate junction table. This is a semantic distinction: the repayment history is a property of the *relationship* (how this farmer relates to this cooperative), not of the farmer or the cooperative in isolation. Neo4j models this naturally. In a relational database, it would require a separate `memberships` table and careful JOIN management.

**Reason 4: Neo4j Aura Free tier removes infrastructure overhead.**

Neo4j Aura provides a fully managed cloud instance with no server to configure. For a hackathon, the barrier was: sign up, download credentials, add to `.env.local`, run seed script. That is the same friction as Supabase, but Neo4j is the right tool for this specific query shape.

---

### Why Not SQLite?

SQLite was considered and explicitly rejected for two reasons:
1. **No cloud hosting** — SQLite is a file-based database. Running it in a Next.js app on Vercel or any serverless environment means the file is not persisted between function invocations. It only works on a persistent server.
2. **JOIN chains for graph queries** — same problem as PostgreSQL above. Recursive CTEs in SQLite can express some graph traversals, but they are painful to write and maintain.

---

### Why Not a Simple JSON File?

The seed data *could* have been a JSON file loaded into memory. In fact, the initial `demoScoreCache` approach does something similar. But a static JSON file:
- Cannot be updated without a code deploy
- Cannot express relationships dynamically (adding a new cooperative means changing code)
- Cannot run filtered aggregate queries efficiently
- Defeats the demo value — "we use a live graph database" is a stronger pitch than "we compute from a JSON array"

---

## Part 3: Supabase vs Neo4j for the Share Link Persistence Fix

This is a separate, independent problem. The **share store** currently uses an in-memory Node.js `Map` that resets on any server restart. The question is: what is the right database to fix this?

### What the Share Store Actually Needs

When a farmer clicks "Share with a lender", the app:
1. **POSTs** a `SharedProfile` object to `/api/share` — this includes the full score snapshot, explanation snapshot, and farmer profile snapshot
2. Gets back a `shareId` (UUID) and a URL
3. When a lender opens the URL, **GET `/api/share/[shareId]`** looks up that UUID and returns the entire `SharedProfile` object

The data requirements:
- **Write once** — a share is created once and never updated
- **Read by primary key** — lookup is always `shareId → SharedProfile`
- **No relationships needed** — the ShareId → SharedProfile mapping is completely flat
- **JSON blob storage** — the `SharedProfile` is a large nested JSON object
- **TTL/expiry** — ideally links expire (currently no expiry, flagged as a known gap)

### Neo4j for the Share Store — Wrong Tool

Neo4j is poorly suited for this:
- The share relationship is flat: `shareId → blob`. There are no graph traversals needed.
- Neo4j does not natively store large JSON blobs efficiently — you would have to break the SharedProfile into node properties or stringify it.
- Every share lookup would be a Cypher `MATCH (s:Share {shareId: $shareId}) RETURN s` — this is using a graph database as a key-value store. That is a misuse.
- You would be conflating two completely different data domains (cooperative graph + share snapshots) in one Neo4j instance.

### Supabase for the Share Store — Right Tool

Supabase (PostgreSQL under the hood) is the correct choice for share persistence. Here is why:

**The data model is trivially relational:**
```sql
CREATE TABLE shared_profiles (
  share_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id    TEXT NOT NULL,
  lender_name  TEXT,
  shared_at    TIMESTAMPTZ DEFAULT NOW(),
  expires_at   TIMESTAMPTZ,          -- NULL = no expiry
  profile_data JSONB NOT NULL        -- the full SharedProfile object as JSON
);
```

**Why this is the right fit:**
- `JSONB` column stores the full nested `SharedProfile` object efficiently — no schema changes needed as the SharedProfile type evolves
- Lookup by `share_id` is a single primary key query — PostgreSQL primary key lookups are O(log n) on a B-tree index, instant at hackathon scale
- Built-in TTL via `expires_at` column — a scheduled Supabase Edge Function or a simple `WHERE expires_at > NOW()` check implements expiry
- Row-level security — Supabase's RLS policies could restrict reads to specific origins (future: farmer-gated revocation)
- Supabase free tier persists data across server restarts, deploys, and cold starts — it is a real cloud database
- Supabase has a JavaScript SDK (`@supabase/supabase-js`) that is simpler than the neo4j-driver for basic CRUD

**Compared to Neo4j for shares:**

| Concern | Neo4j | Supabase |
|---|---|---|
| Data model fit | Poor (graph for flat KV) | Excellent (JSONB table) |
| Setup complexity | Already configured | ~10 minutes, similar |
| Persistence across restarts | Yes (Aura is cloud) | Yes (Supabase is cloud) |
| Query type needed | Cypher MATCH (overkill) | SQL SELECT WHERE pk (perfect) |
| TTL/expiry support | Manual logic | Native timestamp column |
| SDK ergonomics | neo4j-driver (verbose) | supabase-js (simple) |
| Conflation of concerns | Mixes graph + blob | Separated by purpose |

### Clear Recommendation

| Database | Use for |
|---|---|
| **Neo4j (keep)** | Peer benchmarking — cooperative graph, farmer relationships, repayment propagation |
| **Supabase (add)** | Share link persistence — flat `share_id → SharedProfile` key-value lookups |

They solve different problems. Using Neo4j for share persistence would be like using a GPS navigation system to store your grocery list. Using Supabase for the peer graph would lose the relationship-traversal expressiveness that makes the peer benchmark query clean.

### If Adding Supabase Is Out of Scope for the Pitch

For the hackathon demo, the simplest mitigation is:
- Do not restart the dev server from the point the demo begins
- Seed one static share token at server startup (a hardcoded UUID + SharedProfile stored in the Map on cold start)
- Present the share feature by showing the link generation and loading it in the same browser tab before reloading

The share store is a **fixable gap**, not a fundamental architecture flaw. The architecture is correct. The implementation chose in-memory as a "hackathon shortcut" (acknowledged in the code comment `// Store in global memory map`). The fix is replacing one `Map` with one Supabase table insert and one select.

---

*Report prepared: June 27, 2026*
