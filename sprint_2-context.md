# Sprint 2 — Neo4j + External APIs — Context

## What Was Built
- **Neo4j Aura Integration**:
  - Configured lazy driver loading in `lib/neo4j/client.ts` to manage environment initialization properly.
  - Implemented Cypher peer queries matching cooperative members by primary crop and acreage tolerance in `lib/neo4j/peer-benchmark.ts`.
  - Implemented GET `/api/neo4j/peer` endpoint with validation.
- **Neo4j Seeding**:
  - Created `scripts/neo4j-seed-data.ts` and `scripts/seed-neo4j.ts`.
  - Populated Neo4j Aura instance with 50 synthetic cooperative farmers (distribution: 28 on-time, 4 late, 8 default, 10 null) and the 3 demo farmers.
  - Balanced the synthetic acreage sizes so that Wanjiku Kamau (2.5 acres) retrieves exactly 19 on-time repayments out of 23 peers.
- **Climate API Proxy**:
  - Implemented Open-Meteo REST API queries and standardized drought index calculations in `lib/open-meteo/client.ts`.
  - Implemented GET `/api/climate` endpoint with 1-hour in-memory cache and coordinate overrides for the three demo farmers.
- **Soil API Proxy**:
  - Implemented SoilGrids REST API query parsing and derived Soil Quality Index calculations in `lib/soilgrids/client.ts`.
  - Implemented GET `/api/soil` endpoint with 1-hour in-memory cache and coordinate overrides for the three demo farmers.

## Current System State
- **Active Endpoints**:
  - `POST /api/score`
  - `GET /api/neo4j/peer`
  - `GET /api/climate`
  - `GET /api/soil`
- **Database Connection**: Live connection to Neo4j Aura.
- **Environment Variables**: Confirmed active `NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD`, `NEO4J_DATABASE` in `.env.local`.

## Decisions Made
- **Demo Cache Bypass**: Hardcoded target API outputs for the three demo farmers' coordinates directly in the API endpoints to avoid test instability caused by unstable external services (e.g. SoilGrids ISRIC REST endpoints returning 500 errors).

## Known Issues / Deferred
- SoilGrids official API (`rest.isric.org`) is currently returning `HTTP 500` errors for dynamic location requests. The application gracefully degrades by returning a `503 SOIL_API_UNAVAILABLE` status code for dynamic soil requests, while returning the pre-cached indices for the three demo coordinates.

## Sprint 3 Should Start With
1. Verify the Featherless API credentials (`FEATHERLESS_API_KEY`, `FEATHERLESS_MODEL`) in `.env.local`
2. Create the Featherless API client connection in `lib/featherless/client.ts`
3. Design and implement the six prompt templates (5 dimensions + summary) in `lib/featherless/templates.ts`
4. Implement the output parser with structured JSON schema checks and retries in `lib/featherless/parser.ts`
5. Create the POST `/api/explain` endpoint in `app/api/explain/route.ts`
