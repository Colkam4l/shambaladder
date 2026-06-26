# Sprint 3 — LLM Explanation Engine — Context

## What Was Built
- **Featherless LLM API Client**: Wrapper to call completions endpoint (`lib/featherless/client.ts`).
- **Prompt Templates**: Structured dimension and summary instructions under strict credit advisor constraints (`lib/featherless/templates.ts`).
- **Sanitizer & Zod Parser**: Clean string responses and validate shape structures to avoid hallucinations (`lib/featherless/parser.ts`).
- **Retry Engine**: Up to 2 retries on parsing failure with stricter JSON prompt reinforcement (`lib/featherless/engine.ts`).
- **Parallel Generator**: Orchestrates 6 parallel LLM calls to reduce API latency via `Promise.all` (`lib/featherless/generate-explanation.ts`).
- **Explain API Endpoint**: POST `/api/explain` with input zod validation (`app/api/explain/route.ts`).

## Current System State
- **Active Endpoints**:
  - `POST /api/score`
  - `POST /api/explain`
  - `GET /api/neo4j/peer`
  - `GET /api/climate`
  - `GET /api/soil`
- **Integrations**: Neo4j Aura (live, seeded), Open-Meteo (live proxy, cached), SoilGrids (live proxy, cached), Featherless API (live proxy, retry).
- **Environment variables**: `FEATHERLESS_API_KEY`, `FEATHERLESS_MODEL` (active in `.env.local`).

## Decisions Made
- **Strict Zod Output Validation**: Enforces exact prompt models. Errors are logged and caught by retry or fallbacks.

## Known Issues / Deferred
- **Featherless Latency**: Parallel calls can take 3-8 seconds to resolve depending on model availability.

## Sprint 4 Should Start With
1. Review the Stitch UI import checklist (`docs/stitch-import.md`).
2. Add global color variable setups matching the design system (`docs/design-system.md`) into `app/globals.css`.
3. Create Next.js page files for:
   - Farmer Dashboard (`/dashboard`)
   - Action List (`/actions`)
   - Score Detail breakdown (`/score/[dimension]`)
   - Profile Share Flow (`/share`)
4. Wire frontend hooks to `/api/score` and `/api/explain`.
