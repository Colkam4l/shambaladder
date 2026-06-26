# current-state.md — Live System State
# ShambaLadder · Kenya AI Challenge 2025

> **Every agent reads this before starting a sprint.**
> **Every agent updates this before ending a sprint.**
> **This document reflects the actual current state, not the planned state.**

---

## Last Updated
Sprint: 7 — Polish + Integration
Date: 2026-06-26

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
| Farmer Dashboard UI | ✅ Built | Dashboard with large score display and dimension breakdown cards |
| Action List UI | ✅ Built | Ranked prioritised actions with projected score calculator |
| Share Profile UI | ✅ Built | Consent checklists and share URL generation |
| Lender Scorecard UI | ✅ Built | Disclaimer warning, accordion breakdowns, and climate metrics |
| Demo Mode | ✅ Built | Demo landing page with pre-computed cards at /demo |
| Onboarding Form | ✅ Built | Steps 1-5 multi-step form, dynamic APIs connection, client persistence |

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

## Hackathon Submission Status
* **Core & Nice-to-Have Requirements:** 100% Completed
* **Verification:** All tests passing, builds clean, type checks pass, manual flow runs successfully.
* **Next Phase (Post-Hackathon):** Deploy and scale real-time integrations (M-Pesa API, MNO history, device GPS boundary capture, and institutional logins).

