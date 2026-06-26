# Sprint 0 — Specification Complete — Context

## What Was Built
- Complete specification document suite for ShambaLadder (11 docs)
- CLAUDE.md — agent operating manual and hackathon constraints
- build-order.md — 7 sprints defined with 🟢/🟡/🔴 hackathon tier flags
- data-model.md — all TypeScript types, FarmerProfile, scoring types, demo profiles
- scoring-engine.md — exact formulas for all 5 dimensions and composite
- screen-specs.md — 13 screens with full layout/interaction specs
- neo4j-queries.md — Cypher queries, synthetic seed structure, TypeScript wrappers
- llm-integration.md — Featherless setup, 6 prompt templates, output parser
- design-system.md — colour tokens, typography, 9 component specs
- stitch-import.md — Google Stitch prompt (covers all 11 pages), export workflow, and adaptation guide
- api-contract.md — all 8 API routes with input/output/error shapes
- architecture.md — system architecture, data flow, module structure
- decisions.md — 13 architectural decisions
- current-state.md — initial state (all ❌, nothing built)

## Current System State
- No code written. Docs only.
- No Vercel project created.
- No Neo4j Aura instance provisioned.
- No Featherless API key obtained.
- No environment variables configured.

## Decisions Made
All decisions are recorded in decisions.md (D-01 through D-13).

## Known Issues / Deferred
- Google Stitch UI generation not yet done. Sprint 4 agent should run the Stitch prompt from `stitch-import.md` before building farmer UI. Colours are NOT taken from Stitch — the team defines the palette in `design-system.md`.
- Neo4j Aura free tier requires signup at https://neo4j.com/cloud/aura/ before Sprint 2 can begin.
- Featherless API key requires signup at https://featherless.ai before Sprint 3 can begin.
- Demo farmer scores in screen-specs.md (57, 68, 28) are targets. Sprint 1 agent must verify the scoring engine produces these values from the data-model.md demo profiles. If they drift, adjust the demo data to match, not the scoring formula.

## Sprint 1 Should Start With
1. Read CLAUDE.md in full.
2. Read current-state.md (this file after Sprint 0).
3. Read data-model.md and scoring-engine.md.
4. Run: `npx create-next-app@latest shambaladder --typescript --tailwind --app`
5. Create `types/index.ts` — copy all interfaces from data-model.md directly.
6. Create `lib/scoring/` — implement pure functions from scoring-engine.md formulas exactly.
7. Write unit tests: verify Wanjiku = ~57, Joseph = ~68, Amina = ~28.
8. Create `app/api/score/route.ts`.
9. Create `.env.local.example` with placeholder keys.
10. Update current-state.md.
