# architecture.md — System Architecture
# ShambaLadder · Kenya AI Challenge 2025

## Purpose
Defines the system architecture, service boundaries, data flow, and infrastructure. Agents read this to understand how the pieces fit before reading feature-specific docs.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    VERCEL DEPLOYMENT                        │
│                                                             │
│  ┌─────────────────┐    ┌───────────────────────────────┐  │
│  │   Next.js App   │    │       Next.js API Routes      │  │
│  │  (React + RSC)  │    │                               │  │
│  │                 │    │  POST /api/score               │  │
│  │  /demo          │◄──►│  POST /api/explain             │  │
│  │  /dashboard     │    │  GET  /api/neo4j/peer          │  │
│  │  /actions       │    │  GET  /api/climate             │  │
│  │  /share         │    │  GET  /api/soil                │  │
│  │  /lender/...    │    │  POST /api/share               │  │
│  │  /onboarding/.. │    │  GET  /api/share/[id]          │  │
│  │                 │    │  GET  /api/demo/*              │  │
│  └─────────────────┘    └──────────┬────────────────────┘  │
│                                    │                        │
└────────────────────────────────────┼────────────────────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
              ▼                      ▼                      ▼
    ┌─────────────────┐   ┌─────────────────┐   ┌──────────────────┐
    │   Neo4j Aura    │   │  Featherless API │   │  Open-Meteo /    │
    │  (Graph DB)     │   │  (Mistral-7B)   │   │  SoilGrids APIs  │
    │                 │   │                 │   │                  │
    │  Cooperative    │   │  Constrained    │   │  Climate data    │
    │  peer graph     │   │  template       │   │  Soil quality    │
    │  50 synthetic   │   │  generation     │   │  (no auth, free) │
    │  farmers        │   │  + parser       │   │                  │
    └─────────────────┘   └─────────────────┘   └──────────────────┘
```

---

## Data Flow: Core Scoring Path

```
1. Farmer enters data (onboarding) OR demo profile loaded

2. Client calls:
   GET /api/climate?lat=...&lng=...        → ClimateResponse
   GET /api/soil?lat=...&lng=...           → SoilResponse
   GET /api/neo4j/peer?farmerId=...&...   → PeerBenchmarkResult

3. Client assembles FarmerProfile (including climate, soil, peer data)

4. Client calls:
   POST /api/score { profile, weights? }  → CompositeScore

5. Client calls:
   POST /api/explain { profile, score, peerBenchmark }  → ExplanationResponse
   (runs 6 Featherless calls in parallel: 5 dimensions + 1 summary)

6. Farmer Dashboard renders:
   - CompositeScore → ScoreHero, DimensionCards
   - ExplanationResponse → AIExplanationBanner, dimension explanations, ActionList
```

---

## Data Flow: Share Path

```
1. Farmer taps "Share with a lender" on dashboard

2. Share flow shows consent screen (what lender will/won't see)

3. Farmer confirms → POST /api/share {
     farmerId,
     lenderName,
     scoreSnapshot: CompositeScore,   // frozen at share time
     explanationSnapshot: ExplanationResponse
   }

4. API returns shareId and shareUrl

5. Farmer copies URL or QR code → sends to lender

6. Lender opens URL → GET /api/share/[shareId]
   → Returns SharedProfile (snapshot, not live data)

7. Lender scorecard renders from SharedProfile:
   - Scorecard with verification flags
   - Peer benchmark (re-fetched from Neo4j at view time — live data)
   - Climate context (re-fetched from Open-Meteo — live data)
   Note: score and explanations come from snapshot, not re-computed
```

---

## Service Boundaries

### What lives in Next.js API Routes (our code)
- Scoring engine execution (`/api/score`)
- LLM template assembly and response parsing (`/api/explain`)
- Share profile storage and retrieval (`/api/share`)
- Climate and soil API proxy with caching (`/api/climate`, `/api/soil`)
- Neo4j query execution (`/api/neo4j/peer`)
- Demo profile management (`/api/demo/*`)

### What lives in external services
- Graph storage and traversal: Neo4j Aura
- LLM inference: Featherless (Mistral-7B)
- Climate data: Open-Meteo
- Soil data: SoilGrids
- Hosting: Vercel

### What lives in the client (browser)
- Farmer session state (current profile being built during onboarding)
- Completed actions (localStorage for demo — optimistic UI)
- Demo mode farmer selection

---

## Module Structure

```
lib/
├── scoring/
│   ├── index.ts              calculateComposite() — entry point
│   ├── financial.ts          calculateFinancialScore()
│   ├── productivity.ts       calculateProductivityScore()
│   ├── climate.ts            calculateClimateScore()
│   ├── social.ts             calculateSocialScore()
│   ├── completeness.ts       calculateCompletenessScore() + multiplier
│   ├── tiers.ts              determineTier(), TIER_THRESHOLDS
│   └── scoring.test.ts       Unit tests for all scoring functions
│
├── neo4j/
│   ├── client.ts             runQuery() — Neo4j Aura connection
│   ├── peer-benchmark.ts     getPeerBenchmark(), getPeerBenchmarkSafe()
│   └── queries.ts            PEER_BENCHMARK_QUERY, COOPERATIVE_QUERY
│
├── featherless/
│   ├── client.ts             callFeatherless()
│   ├── templates.ts          All 6 prompt templates
│   ├── parser.ts             parseDimensionExplanation(), parseSummaryResponse()
│   ├── engine.ts             generateWithRetry(), generateFullExplanation()
│   └── system-prompt.ts      SYSTEM_PROMPT constant
│
├── open-meteo/
│   └── client.ts             fetchClimateData()
│
├── soilgrids/
│   └── client.ts             fetchSoilData()
│
└── share/
    └── store.ts              shareStore Map, createShare(), getShare()

types/
└── index.ts                  All TypeScript interfaces and enums

public/
└── demo-data/
    ├── wanjiku.json           FarmerProfile for Wanjiku Kamau
    ├── joseph.json            FarmerProfile for Joseph Omondi
    └── amina.json             FarmerProfile for Amina Hassan

scripts/
└── seed-neo4j.ts             Seeds 50 synthetic farmers to Neo4j Aura
```

---

## Environment Variables

```bash
# .env.local

# Neo4j Aura
NEO4J_URI=neo4j+s://[instance].databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=[password]

# Featherless
FEATHERLESS_API_KEY=[key]
FEATHERLESS_MODEL=mistralai/Mistral-7B-Instruct-v0.2

# App
NEXT_PUBLIC_APP_URL=https://shambaladder.vercel.app
# (no NEXT_PUBLIC_ for API keys — never expose to browser)
```

---

## What Is NOT in This Architecture (Hackathon Scope)

These are documented for production but not built:

- **Database (PostgreSQL):** Shares are in-memory. Farmer profiles are session-only or demo-only.
- **Authentication:** No farmer login, no lender login. Demo mode only.
- **MNO integration:** Mobile money data is self-declared.
- **Cooperative data integration:** Real cooperative records not connected. Synthetic Neo4j data only.
- **Field verification:** No field agents, no satellite imagery cross-validation beyond SoilGrids plausibility.
- **OTA or mobile app:** Web only. Chrome on Android is the target device but no native app.

---

*ShambaLadder · Kenya AI Challenge 2025*
