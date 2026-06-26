# current-state.md — Live System State
# ShambaLadder · Kenya AI Challenge 2025

> **Every agent reads this before starting a sprint.**
> **Every agent updates this before ending a sprint.**
> **This document reflects the actual current state, not the planned state.**

---

## Last Updated
Sprint: 1 — Foundation + Scoring Engine
Date: 2025-06-26

---

## System Status

| Layer | Status | Notes |
|---|---|---|
| Next.js scaffold | ✅ Built | Next.js 16, TypeScript strict, Tailwind, App Router |
| TypeScript types | ✅ Built | `types/index.ts` — all interfaces from data-model.md |
| Scoring engine | ✅ Built | `lib/scoring/` — all 5 dimension scorers + composite |
| Unit tests | ✅ 61/61 passing | `lib/scoring/scoring.test.ts` |
| /api/score | ✅ Built | POST /api/score with zod validation |
| Demo data (JSON) | ✅ Built | Wanjiku, Joseph, Amina in `public/demo-data/` |
| Neo4j Aura | ❌ Not provisioned | Sprint 2 |
| Synthetic seed data | ❌ Not seeded | Sprint 2 |
| /api/neo4j/peer | ❌ Not built | Sprint 2 |
| Open-Meteo client | ❌ Not built | Sprint 2 |
| SoilGrids client | ❌ Not built | Sprint 2 |
| /api/climate | ❌ Not built | Sprint 2 |
| /api/soil | ❌ Not built | Sprint 2 |
| Featherless client | ❌ Not built | Sprint 3 |
| LLM templates | ❌ Not built | Sprint 3 |
| /api/explain | ❌ Not built | Sprint 3 |
| Farmer Dashboard UI | ❌ Not built | Sprint 4 |
| Action List UI | ❌ Not built | Sprint 4 |
| Share Profile UI | ❌ Not built | Sprint 4 |
| Lender Scorecard UI | ❌ Not built | Sprint 5 |
| Demo Mode | ❌ Not built | Sprint 6 |
| Onboarding Form | ❌ Not built | Sprint 6 |

---

## Active Environment Variables
All configured in `.env.local` (not committed):
- `NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD`, `NEO4J_DATABASE`
- `FEATHERLESS_API_KEY`, `FEATHERLESS_MODEL`
- `NEXT_PUBLIC_APP_URL`

---

## Demo Farmer Computed Scores (Sprint 1 engine)

| Farmer | Score | Tier | Key Gap |
|---|---|---|---|
| Wanjiku Kamau | ~48 (growing) | 🌱 Growing | GPS not confirmed (+8 pts available) |
| Joseph Omondi | ~90 (trusted) | 🌳 Trusted | Well-established profile |
| Amina Hassan | ~15 (seedling) | 🌱 Seedling | No M-Pesa, no coop, no GPS |

---

## Known Issues
- None. TypeScript compiles with zero errors. All 61 unit tests pass.

---

## What Sprint 2 Should Start With
1. Install `neo4j-driver`: `npm install neo4j-driver`
2. Create `lib/neo4j/client.ts` — `runQuery()` using `NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD`
3. Create `scripts/seed-neo4j.ts` — seed 50 synthetic farmers to Kisii Cooperative
4. Run `npx tsx scripts/seed-neo4j.ts` and verify with `MATCH (f:Farmer) RETURN count(f)` = 50
5. Create `lib/neo4j/peer-benchmark.ts` — `getPeerBenchmark()` and `getPeerBenchmarkSafe()`
6. Create `app/api/neo4j/peer/route.ts` — GET endpoint
7. Create `lib/open-meteo/client.ts` — `fetchClimateData(lat, lng)`
8. Create `lib/soilgrids/client.ts` — `fetchSoilData(lat, lng)`
9. Create `app/api/climate/route.ts` and `app/api/soil/route.ts`
10. Update this file to reflect what was built
