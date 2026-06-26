# current-state.md — Live System State
# ShambaLadder · Kenya AI Challenge 2025

> **Every agent reads this before starting a sprint.**
> **Every agent updates this before ending a sprint.**
> **This document reflects the actual current state, not the planned state.**

---

## Last Updated
Sprint: 3 — LLM Explanation Engine
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
| Neo4j Aura | ✅ Active | Provisioned and connected |
| Synthetic seed data | ✅ Seeded | 50 synthetic farmers in Kisii Cooperative |
| /api/neo4j/peer | ✅ Built | GET /api/neo4j/peer returning peer benchmark details |
| Open-Meteo client | ✅ Built | `lib/open-meteo/client.ts` SPEI approximation calculations |
| SoilGrids client | ✅ Built | `lib/soilgrids/client.ts` soil quality index derivation |
| /api/climate | ✅ Built | GET /api/climate with caching and demo coordination pre-population |
| /api/soil | ✅ Built | GET /api/soil with caching and demo coordination pre-population |
| Featherless client | ✅ Built | `lib/featherless/client.ts` wrapper |
| LLM templates | ✅ Built | `lib/featherless/templates.ts` prompt definitions |
| /api/explain | ✅ Built | POST /api/explain with parallel generation and parsing |
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

## What Sprint 4 Should Start With
1. Review `docs/stitch-import.md` and `docs/design-system.md`
2. Create Google Stitch UI component imports in `components/ui/`
3. Implement core CSS variables/tokens in `app/globals.css` (or `index.css` system)
4. Implement Farmer Dashboard (`/dashboard`) showing composite score, tier, and per-dimension scores
5. Implement Action List (`/actions`) showing the ranked LLM actions
6. Implement Score Detail page (`/score/[dimension]`)
7. Implement Share Profile Flow (`/share`) returning share token
8. Update this file to reflect the completed state
