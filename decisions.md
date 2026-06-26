# decisions.md — Architectural Decisions
# ShambaLadder · Kenya AI Challenge 2025

## Purpose
Every architectural decision made for ShambaLadder is recorded here. Agents must not make architectural decisions not already in this document. If a situation arises that is not covered, stop and document the question before proceeding.

---

## D-01: Next.js 14 App Router + Vercel

**Decision:** Use Next.js 14 with App Router, deployed to Vercel.

**Rationale:**
- API routes co-located with frontend — one deployment, one repo, no CORS issues.
- Vercel is the fastest path from code to live URL for a hackathon.
- App Router supports server components and server actions — reduces client-side data fetching complexity.

**Alternatives considered:** Separate Express backend + React frontend. Rejected: two deployments add friction, no benefit at hackathon scale.

---

## D-02: Rules-Based Scoring Engine (Not ML)

**Decision:** The composite score is a weighted sum across five dimensions. No model training. No embeddings.

**Rationale:**
- Fully auditable — every point traceable to a specific input.
- No training data required — critical since cooperative repayment outcome data does not exist yet.
- Appropriate for a financially regulated context — regulators can inspect the formula.
- SHAP-explained ML is the documented upgrade path once real repayment outcome data exists.

**Alternatives considered:** Fine-tuned classifier on CGAP dataset. Rejected: no farmer-specific training data in our possession; black-box scoring is a known trust failure mode per World Bank 2021.

---

## D-03: Neo4j Aura Free Tier

**Decision:** Use Neo4j Aura Free for the cooperative peer graph.

**Rationale:**
- The peer benchmark query traverses farmer, cooperative, crop, farm size, and repayment outcome simultaneously. Multi-table joins in a relational DB become expensive at scale.
- Neo4j graph traversal is native to this domain model — farmers are nodes in a social/institutional network.
- Aura Free is sufficient for the synthetic 50-farmer prototype dataset.
- Hackathon judges will recognise Neo4j as the required technology — using it correctly is part of the judging criteria.

**Alternatives considered:** PostgreSQL with JSON columns for graph-like queries. Rejected: loses the native graph traversal benefit and weakens the Neo4j technology showcase.

---

## D-04: Featherless for LLM Inference

**Decision:** Use Featherless API (Mistral-7B-Instruct-v0.2) for explanation generation.

**Rationale:**
- Cost sustainability at scale — open-source model inference.
- Data sovereignty compatible — option to run locally-hosted model post-hackathon.
- No vendor lock-in to OpenAI/Anthropic at the inference layer.

**Model selection:** Start with `mistralai/Mistral-7B-Instruct-v0.2`. If structured output quality is poor, fall back to `meta-llama/Meta-Llama-3-8B-Instruct`.

**Temperature:** 0.3 — low temperature for structured output consistency. Not 0 — some variation in explanation phrasing is desirable.

---

## D-05: Constrained LLM Templates Only

**Decision:** The LLM does not do free-form generation. Fixed input variable sets, fixed output JSON structures, output parser with retry.

**Rationale:**
- Eliminates hallucination risk for financial advice.
- Makes output auditable and predictable.
- Parser catches off-structure responses before they reach the farmer UI.
- Aligns with responsible AI principle: no hidden reasoning, no untraceable advice.

**What this means in practice:**
- No prompt that includes "tell me about farming" or "what should I do."
- Every template variable is listed in `llm-integration.md`. No additions without spec change.
- LLM failure → graceful degradation to scores-without-explanation. Never block on LLM.

---

## D-06: Open-Meteo + SoilGrids (No Auth)

**Decision:** Use Open-Meteo and SoilGrids REST APIs for climate and soil data.

**Rationale:**
- Both are free, no API key required at prototype request volumes.
- Both are GPS-coordinate-based — no address lookup or geocoding needed.
- Open-Meteo provides historical rainfall and evapotranspiration data suitable for SPEI approximation.
- SoilGrids provides pH and organic carbon data suitable for soil quality index derivation.

**Limitations:** These are coarse approximations. Not field-verified. Labelled as "third-party source, not field-verified" in the lender view.

---

## D-07: Climate Exposure Is a Context Flag, Not a Score Input

**Decision:** Open-Meteo rainfall and drought index data appear as lender context flags only. They do not enter the composite score.

**Rationale:**
- A farmer cannot control where they were born. Penalising geography is unfair and harms adoption in high-risk zones.
- What enters the composite score is the farmer's adaptive response (irrigation, drought-tolerant varieties, soil conservation, etc.).
- A high-risk-zone farmer who adapts well scores higher than a low-risk-zone farmer who does not adapt.
- Lenders see both: exposure level AND adaptive response. This is more information, not less.

---

## D-08: Completeness as Confidence Multiplier

**Decision:** Record Completeness (Dimension 5) produces a multiplier (0.5–1.0) applied to all other dimension weighted scores, rather than adding points.

**Rationale:**
- A high raw score from a 50%-complete profile should not be treated the same as the same score from a 95%-complete profile.
- A multiplier approach explicitly communicates confidence level without penalising absolute score unnecessarily.
- Lenders see both raw and adjusted scores — full transparency.

---

## D-09: In-Memory Share Store for Hackathon

**Decision:** Shared profiles are stored in a server-side `Map` for the hackathon. No database.

**Rationale:**
- Fastest path to a working share flow. Judges won't restart the server.
- Production: replace with PostgreSQL or equivalent.

**Known limitation:** Shares reset on server restart. Acceptable for hackathon demo.

---

## D-10: Demo Mode Pre-Computes Scores at Build Time

**Decision:** The three demo farmer profiles are scored and explained at server startup, then cached in memory. The `/api/demo/score/[farmerId]` endpoint returns cached results.

**Rationale:**
- Eliminates LLM latency from the judge demo flow. Loading a demo farmer profile is instant.
- The scoring engine and LLM engine still run on real data — the results are just cached.
- If the LLM call fails at startup, the cache is populated with a fallback explanation.

---

## D-11: Farmer Controls All Data Sharing

**Decision:** No lender receives farmer data without an explicit "Share Profile" action by the farmer. Lender view is token-gated.

**Rationale:**
- Responsible AI principle. Farmer data is farmer data.
- Consent screen explicitly shows what the lender will and will not see.
- Lender receives a snapshot (at share time), not live account access.

**Implications for build:**
- The lender scorecard route `/lender/scorecard/[token]` is always token-gated.
- No route exists that returns a farmer's full profile by farmerId without a share token.
- Demo mode shares are pre-generated at startup — they are not bypassing the consent model, they are simulating a completed share flow.

---

## D-12: Google Stitch for UI Scaffold

**Decision:** Use Google Stitch to generate the initial UI scaffold from a single comprehensive prompt, then adapt to our design system.

**Rationale:**
- Hackathon time constraint. Stitch generates a full multi-page React app in one prompt pass, covering all 11 pages simultaneously — faster than building page by page.
- The team owns the colour palette entirely. Stitch output uses placeholder colours; the adaptation step replaces every colour value with CSS variables from `design-system.md`. This is intentional — colour decisions stay with the team, not the tool.
- The adaptation step (colour tokens, TypeScript types, real data wiring) is scoped to ~110 minutes.
- Final codebase contains zero raw Stitch output — only adapted components.

**See:** `docs/stitch-import.md` for the full prompt and adaptation workflow.

---

## D-13: TypeScript Strict Mode, No `any`

**Decision:** TypeScript strict mode everywhere. `any` is forbidden. Narrow `unknown` with guards.

**Rationale:**
- The scoring engine is safety-critical for the farmer's credit profile. Type safety is not optional.
- `any` in the scoring path could silently produce wrong scores.

---

*ShambaLadder · Kenya AI Challenge 2025*
