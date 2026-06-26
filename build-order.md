# build-order.md — Build Order and Sprint Definitions
# ShambaLadder · Kenya AI Challenge 2025

## Purpose
Defines the complete build sequence for ShambaLadder for the hackathon and beyond. Each sprint is scoped to one agent session. Every sprint ends in a committed, runnable, demo-able state.

## Hackathon Tier Legend
- 🟢 **HACKATHON CORE** — Must be built. Demo fails without it.
- 🟡 **HACKATHON NICE** — Include if time allows. Demo stronger with it.
- 🔴 **POST-HACKATHON** — Do not build. Noted for production roadmap.

## Build Principles

**Demo-first.** The first milestone is a judge-facing demo: a farmer sees their score, the LLM explains it, the lender sees the peer context. Everything else is secondary.

**Scoring engine is the real AI.** Neo4j peer graph + Open-Meteo/SoilGrids + Featherless LLM is the technical stack judges will evaluate. Build these first, wrap UI second.

**Stitch foundation.** UI components are generated from the Google Stitch prompt in `docs/stitch-import.md`. Do not design from scratch. Adapt the Stitch output to the design system. You own the colour palette — replace all Stitch colours with CSS variables from `design-system.md`.

**Sprint = one agent session.** Scope is fixed per sprint. If something is not listed, do not build it.

---

## Sprint Map

| Sprint | Name | Tier | Ends With |
|---|---|---|---|
| Sprint 1 | Foundation + Scoring Engine | 🟢 | Scoring engine runs, types defined, API routes scaffold |
| Sprint 2 | Neo4j + External APIs | 🟢 | Peer benchmark query live, climate/soil data flowing |
| Sprint 3 | LLM Explanation Engine | 🟢 | Featherless integration, all 5 dimension templates working |
| Sprint 4 | Farmer View UI | 🟢 | Farmer dashboard, score cards, action list visible |
| Sprint 5 | Lender View UI | 🟢 | Lender scorecard, peer signal, weight config panel |
| Sprint 6 | Onboarding + Demo Mode | 🟢 | 3 demo farmer profiles, onboarding form, share flow |
| Sprint 7 | Polish + Integration | 🟡 | End-to-end flow, edge cases, submission prep |

---

## Sprint 1 — Foundation + Scoring Engine

**What gets built:**
- Next.js 14 app scaffold with TypeScript strict mode
- `types/index.ts` — all shared types: `FarmerProfile`, `CompositeScore`, `DimensionScore`, `CreditTier`, `ScoreRequest`, `ScoreResponse`
- `lib/scoring/` — pure function scoring engine:
  - `calculateFinancialScore(inputs: FinancialInputs): DimensionScore`
  - `calculateProductivityScore(inputs: ProductivityInputs): DimensionScore`
  - `calculateClimateScore(inputs: ClimateInputs): DimensionScore`
  - `calculateSocialScore(inputs: SocialInputs): DimensionScore`
  - `calculateCompletenessScore(inputs: CompletenessInputs): DimensionScore`
  - `calculateComposite(dimensions: DimensionScores, weights: DimensionWeights): CompositeScore`
  - `determineTier(score: number): CreditTier`
- Unit tests for every scoring function
- `app/api/score/route.ts` — POST endpoint: accepts `FarmerProfile`, returns `CompositeScore`
- Environment variable scaffold (`.env.local.example`)
- `docs/current-state.md` — initial state

**What is NOT built:**
- Any UI
- Neo4j integration
- LLM integration
- External API calls

**Documents to read:**
1. `CLAUDE.md`
2. `docs/data-model.md`
3. `docs/scoring-engine.md`

**Sprint complete when:**
- [ ] `calculateComposite()` produces correct scores for all three demo farmer profiles
- [ ] `POST /api/score` returns a valid `ScoreResponse`
- [ ] All scoring unit tests pass
- [ ] TypeScript compiles with zero errors

---

## Sprint 2 — Neo4j + External APIs

**What gets built:**
- Neo4j Aura connection client: `lib/neo4j/client.ts`
- Synthetic cooperative dataset seeded to Neo4j Aura (50 farmers, Kisii cooperative — schema from `docs/neo4j-queries.md`)
- `lib/neo4j/peer-benchmark.ts` — `getPeerBenchmark(farmerId, cooperativeId, crop, farmSize)` → `PeerBenchmarkResult`
- `app/api/neo4j/peer/route.ts` — GET endpoint: returns peer benchmark for a farmer
- Open-Meteo client: `lib/open-meteo/client.ts` — fetches rainfall, drought index for GPS coordinates
- SoilGrids client: `lib/soilgrids/client.ts` — fetches soil quality for GPS coordinates
- `app/api/climate/route.ts` — GET endpoint: proxies Open-Meteo with caching
- `app/api/soil/route.ts` — GET endpoint: proxies SoilGrids with caching
- Integration of climate + soil data into scoring engine inputs

**What is NOT built:**
- Any UI for these data sources
- MNO (mobile money) integration (🔴 post-hackathon)
- Real cooperative data (synthetic only for hackathon)

**Documents to read:**
1. `CLAUDE.md`
2. `docs/current-state.md`
3. `docs/neo4j-queries.md`
4. `docs/api-contract.md` (Neo4j, climate, soil sections)

**Sprint complete when:**
- [ ] Neo4j Aura has 50 synthetic farmers in Kisii cooperative
- [ ] `getPeerBenchmark()` returns: peer count, on-time repayment count, avg tier
- [ ] Lender view can display: "19 of 23 farmers with this profile repaid on time"
- [ ] Open-Meteo returns rainfall data for Kisii GPS coordinates
- [ ] SoilGrids returns soil quality for same coordinates
- [ ] All API routes return correct shapes

---

## Sprint 3 — LLM Explanation Engine

**What gets built:**
- Featherless API client: `lib/featherless/client.ts`
- Template engine: `lib/featherless/templates.ts` — one template per dimension + overall summary:
  - `FINANCIAL_TEMPLATE` — explains Financial Behaviour score, gaps, action
  - `PRODUCTIVITY_TEMPLATE` — explains Farm Productivity score
  - `CLIMATE_TEMPLATE` — explains Climate Resilience score
  - `SOCIAL_TEMPLATE` — explains Social & Coop Capital score
  - `COMPLETENESS_TEMPLATE` — explains Record Completeness score
  - `SUMMARY_TEMPLATE` — overall tier explanation + top 3 actions with score-impact estimates
- Output parser: `lib/featherless/parser.ts` — validates response structure, retries on malformed output (max 2 retries)
- `app/api/explain/route.ts` — POST endpoint: accepts `CompositeScore` + `FarmerProfile`, returns `ExplanationResponse`
- `ExplanationResponse` type: per-dimension plain-language explanation + ranked action list with score-impact

**Template variable set (fixed — no additions without spec change):**
```
dimensionName, dimensionScore, dimensionWeight, gapToNextTier,
missingFields[], location, primaryCrop, currentSeason,
peerBenchmarkSummary (optional, lender-only)
```

**What is NOT built:**
- Fine-tuning (🔴 post-hackathon)
- Swahili/Luganda language output (🔴 post-hackathon)
- Free-form conversation with LLM (never — Constraint 2)

**Documents to read:**
1. `CLAUDE.md`
2. `docs/current-state.md`
3. `docs/llm-integration.md`

**Sprint complete when:**
- [ ] `POST /api/explain` returns valid `ExplanationResponse` for all 3 demo farmers
- [ ] Each dimension has a 2-3 sentence plain-language explanation
- [ ] Summary includes ranked action list: minimum 3 actions with specific score-impact estimates
- [ ] Parser rejects malformed LLM output and retries
- [ ] No free-form output reaches the farmer view — all responses match template structure

---

## Sprint 4 — Farmer View UI

**What gets built:**
- Stitch component import + adaptation (see `docs/stitch-import.md`)
- Design tokens applied to Stitch base (see `docs/design-system.md`)
- **Farmer Dashboard** (`/dashboard`) 🟢:
  - Tier badge (Seedling/Growing/Established/Trusted) with visual indicator
  - Composite score number (large, prominent)
  - Five dimension score cards (name, score/100, weight, plain-language explanation from LLM)
  - Progress bar showing gap to next tier
- **Action List** (`/actions`) 🟢:
  - Ranked list of 3-5 specific actions
  - Each action: description, estimated score impact, estimated effort (Quick/Medium/Hard)
  - "Complete" marking (optimistic UI — stores in localStorage for demo)
- **Score Detail** (`/score/[dimension]`) 🟡:
  - Full breakdown of one dimension
  - Which inputs contributed what
  - Verification status per field (Verified / Self-reported / Missing)
- **Share Profile Flow** (`/share`) 🟢:
  - Consent screen — what the lender will see
  - "Share with [Lender Name]" confirmation
  - Returns a shareable link (lender view token)

**What is NOT built:**
- Real farmer authentication (demo mode only for hackathon)
- Profile editing UI (🔴 post-hackathon)
- Push notifications (🔴 post-hackathon)

**Documents to read:**
1. `CLAUDE.md`
2. `docs/current-state.md`
3. `docs/design-system.md`
4. `docs/screen-specs.md` (Farmer sections)
5. `docs/stitch-import.md`

**Sprint complete when:**
- [ ] Demo farmer "Wanjiku Kamau" dashboard renders with correct score and tier
- [ ] All 5 dimension cards show LLM explanations (not placeholders)
- [ ] Action list shows 3+ specific actions with score-impact
- [ ] Share flow produces a URL that opens the lender view for that farmer

---

## Sprint 5 — Lender View UI

**What gets built:**
- **Lender Scorecard** (`/lender/scorecard/[token]`) 🟢:
  - Farmer name + tier badge
  - Composite score
  - Per-dimension breakdown: score, weight, verification status badge (Verified/Self-reported/Missing/Simulated)
  - Neo4j peer signal: "X of Y similar farmers in [Cooperative] repaid on time" — shown only if peer count ≥ 10
  - Cold-start message when peer count < 10: "Insufficient peer data. Available after first lending cycle."
  - Disclaimer banner: "ShambaLadder is decision support. Credit decisions remain with your institution."
- **Weight Configuration Panel** (`/lender/configure`) 🟡:
  - Sliders for each dimension weight
  - Weights must sum to 100% (validation)
  - "Recalculate" button re-runs scoring engine with new weights
  - "Reset to defaults" button
- **Downloadable Profile** 🟡:
  - PDF export of the lender scorecard (basic — print-to-PDF via `window.print()` styling, not a real PDF generator)

**What is NOT built:**
- Lender authentication (🔴 post-hackathon)
- Lender portfolio dashboard (🔴 post-hackathon)
- CRM integration (🔴 post-hackathon)

**Documents to read:**
1. `CLAUDE.md`
2. `docs/current-state.md`
3. `docs/design-system.md`
4. `docs/screen-specs.md` (Lender sections)
5. `docs/neo4j-queries.md` (peer benchmark display logic)

**Sprint complete when:**
- [ ] Lender scorecard renders for all 3 demo farmers
- [ ] Peer signal shows "19 of 23 farmers with this profile in Kisii Cooperative repaid on time" for demo
- [ ] Every field has a verification status badge
- [ ] Disclaimer banner is visible and un-dismissable
- [ ] No farmer data is exposed without the share token

---

## Sprint 6 — Onboarding + Demo Mode

**What gets built:**
- **Demo Mode** (`/demo`) 🟢 — Priority: build this before onboarding:
  - Three pre-built farmer cards: Wanjiku, Joseph, Amina
  - Click a card → loads that farmer's dashboard instantly
  - "View Lender Perspective" toggle on each demo farmer's dashboard
  - No data entry required — everything runs from `public/demo-data/`
- **Onboarding Form** (`/onboarding`) 🟡:
  - Step 1: Basic info (name, location, primary crop, farm size)
  - Step 2: Financial behaviour (mobile money regularity — self-declared, savings group, coop membership)
  - Step 3: Farm productivity (yield last season, input quality, GPS confirmation)
  - Step 4: Climate practices (irrigation, drought-tolerant varieties, soil conservation)
  - Step 5: Consent screen (per-category consent, data usage explanation)
  - Progress indicator across all steps
  - On completion: runs scoring engine, fetches LLM explanations, renders dashboard

**What is NOT built:**
- GPS capture from device (demo uses hardcoded Kisii coordinates) 🟡→🔴
- Document upload (🔴 post-hackathon)
- SACCO/cooperative data import (🔴 post-hackathon)

**Documents to read:**
1. `CLAUDE.md`
2. `docs/current-state.md`
3. `docs/screen-specs.md` (Demo and Onboarding sections)
4. `docs/data-model.md` (FarmerProfile fields)

**Sprint complete when:**
- [ ] `/demo` shows 3 farmer cards
- [ ] Clicking any card loads a fully scored dashboard with LLM explanations
- [ ] "View Lender Perspective" shows the lender scorecard for that farmer
- [ ] Demo runs end-to-end without any placeholder text or "Coming soon" states

---

## Sprint 7 — Polish + Integration

**What gets built:**
- End-to-end flow test: onboarding → score → explain → share → lender view
- Loading states for all async operations (scoring, LLM, Neo4j)
- Error states (API failures, LLM timeout, Neo4j cold start)
- Mobile responsiveness check (mid-range Android, 360px viewport)
- Demo script prep: timed walkthrough of the 3 demo profiles
- `README.md` — setup instructions for judges
- Environment variable documentation

**What is NOT built:**
- Anything 🔴 in any other sprint

**Sprint complete when:**
- [ ] Full demo flow runs without errors in Chrome on a phone-sized viewport
- [ ] All loading states show meaningful progress (not blank screens)
- [ ] All 🟢 items across all sprints are complete
- [ ] README has clear setup instructions including Neo4j Aura and Featherless credentials

---

## Post-Hackathon Roadmap (🔴 — Do Not Build Now)

**Production data integrations:**
- MNO (M-Pesa/Airtel) API integration for real financial behaviour data
- Cooperative management system integration for repayment history
- GPS farm boundary capture from device

**Production auth:**
- Farmer authentication (phone + OTP)
- Lender authentication (institutional login)
- Farmer consent management dashboard

**AI upgrades:**
- ML scoring layer with SHAP explainability (once repayment outcome data exists)
- Featherless fine-tuning on agricultural finance templates
- Swahili/Luganda explanation output
- Voice explanation output for low-literacy farmers

**Scale:**
- Real cooperative data partnerships (replace synthetic)
- Shambapro CRM integration
- MFI/SACCO white-label lender portal

---

*ShambaLadder · Kenya AI Challenge 2025*
