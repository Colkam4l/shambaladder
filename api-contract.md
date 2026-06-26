# api-contract.md — API Contract
# ShambaLadder · Kenya AI Challenge 2025

## Purpose
Defines every API route in ShambaLadder: input schemas, output shapes, error codes. The frontend and backend are built against this contract. Changes require updating this document first.

---

## Conventions

All routes are Next.js API Routes under `/app/api/`.
All responses are JSON.
All errors use:
```typescript
{ error: { code: string, message: string, field?: string } }
```

---

## POST /api/score

**Purpose:** Calculate the composite credit readiness score for a farmer profile.

**Input:**
```typescript
interface ScoreRequest {
  profile: FarmerProfile;
  weights?: DimensionWeights;  // Optional — uses defaults if omitted
}
```

**Output (200):**
```typescript
interface ScoreResponse {
  score: CompositeScore;
}
```

**Errors:**
| Code | Status | When |
|---|---|---|
| `INVALID_INPUT` | 400 | Profile fails schema validation |
| `INVALID_WEIGHTS` | 400 | Weights provided but don't sum to 1.0 (±0.001) |
| `SCORING_FAILED` | 500 | Internal scoring error |

**Notes:**
- Does NOT call Neo4j, Open-Meteo, or SoilGrids. Those are pre-fetched by the client and included in the profile.
- Is a pure function call wrapped in an API route. Fast (<50ms).

---

## POST /api/explain

**Purpose:** Generate LLM explanations for a computed score.

**Input:**
```typescript
interface ExplainRequest {
  profile: FarmerProfile;
  score: CompositeScore;
  peerBenchmark: PeerBenchmarkResult | null;
}
```

**Output (200):**
```typescript
// ExplanationResponse — see data-model.md
```

**Errors:**
| Code | Status | When |
|---|---|---|
| `INVALID_INPUT` | 400 | Missing required fields |
| `LLM_UNAVAILABLE` | 503 | Featherless API unreachable |
| `EXPLANATION_FAILED` | 500 | Parse failed after max retries |

**Notes:**
- Slow (~3-8 seconds for 6 parallel LLM calls). Frontend shows loading state.
- Failure is graceful — score display should not block on this endpoint.

---

## GET /api/neo4j/peer

**Purpose:** Get peer benchmark for a farmer from Neo4j cooperative graph.

**Query params:**
```
farmerId: string
cooperativeId: string
primaryCrop: string
farmSizeAcres: number
farmSizeTolerance?: number  // Default: 1.5
```

**Output (200):**
```typescript
interface PeerBenchmarkResponse {
  benchmark: PeerBenchmarkResult | null;  // null if no cooperative or insufficient data
}
```

**Errors:**
| Code | Status | When |
|---|---|---|
| `MISSING_PARAMS` | 400 | Required params absent |
| `NEO4J_UNAVAILABLE` | 503 | Cannot reach Neo4j Aura |

**Notes:**
- Returns `{ benchmark: null }` (not an error) when cooperativeId is absent or peer count < 10.
- Frontend treats null as cold-start state.

---

## GET /api/climate

**Purpose:** Fetch climate data from Open-Meteo for a GPS location.

**Query params:**
```
latitude: number
longitude: number
```

**Output (200):**
```typescript
interface ClimateResponse {
  rainfallIndexLastSeason: number;   // mm, from Open-Meteo
  droughtIndexLastSeason: number;    // SPEI approximation
  climateRiskLevel: 'low' | 'medium' | 'high';
  source: 'open-meteo';
  fetchedAt: string;  // ISO 8601
}
```

**Errors:**
| Code | Status | When |
|---|---|---|
| `MISSING_COORDS` | 400 | latitude or longitude absent |
| `CLIMATE_API_UNAVAILABLE` | 503 | Open-Meteo unreachable |

**Notes:**
- Cached in memory (or localStorage on client) for 1 hour — don't hammer Open-Meteo.
- For the hackathon demo, pre-cache the Kisii coordinates response.

Open-Meteo endpoint:
```
https://api.open-meteo.com/v1/forecast
  ?latitude={lat}
  &longitude={lng}
  &daily=precipitation_sum,et0_fao_evapotranspiration
  &past_days=90
```

SPEI approximation: `(precipitation_sum - et0_fao_evapotranspiration) / stddev` — simplified. Good enough for demo.

---

## GET /api/soil

**Purpose:** Fetch soil quality data from SoilGrids for a GPS location.

**Query params:**
```
latitude: number
longitude: number
```

**Output (200):**
```typescript
interface SoilResponse {
  soilQualityIndex: number;    // 0-100 derived index
  phTop: number;               // Soil pH at 0-5cm
  organicCarbonTop: number;    // g/kg
  source: 'soilgrids';
  fetchedAt: string;
}
```

**Errors:**
| Code | Status | When |
|---|---|---|
| `MISSING_COORDS` | 400 | latitude or longitude absent |
| `SOIL_API_UNAVAILABLE` | 503 | SoilGrids unreachable |

SoilGrids endpoint:
```
https://rest.isric.org/soilgrids/v2.0/properties/query
  ?lon={lng}
  &lat={lat}
  &property=phh2o,soc
  &depth=0-5cm
  &value=mean
```

Soil quality index derivation:
```
phScore = (ph is 5.5-7.0) ? 100 : (ph is 4.5-5.5 or 7.0-7.5) ? 65 : 30
socScore = min(organicCarbon / 30 * 100, 100)
soilQualityIndex = (phScore * 0.5) + (socScore * 0.5)
```

---

## POST /api/share

**Purpose:** Create a shared farmer profile snapshot.

**Input:**
```typescript
interface ShareRequest {
  farmerId: string;
  lenderName: string | null;
  scoreSnapshot: CompositeScore;
  explanationSnapshot: ExplanationResponse;
}
```

**Output (201):**
```typescript
interface ShareResponse {
  shareId: string;       // UUID
  shareUrl: string;      // Full URL: https://shambaladder.com/lender/scorecard/{shareId}
  expiresAt: null;       // No expiry for hackathon
}
```

**Errors:**
| Code | Status | When |
|---|---|---|
| `INVALID_INPUT` | 400 | Missing required fields |
| `STORAGE_FAILED` | 500 | Could not persist share |

**Notes — Hackathon Storage:**
For the hackathon, shares are stored in memory (a simple Map in the API route module). This resets on server restart. Production would use a database.

```typescript
// Simple in-memory store for hackathon
const shareStore = new Map<string, SharedProfile>();

// In production: replace with database write
```

---

## GET /api/share/[shareId]

**Purpose:** Retrieve a shared farmer profile for the lender view.

**Output (200):**
```typescript
interface SharedProfileResponse {
  sharedProfile: SharedProfile;
}
```

**Errors:**
| Code | Status | When |
|---|---|---|
| `NOT_FOUND` | 404 | shareId does not exist or was revoked |

---

## Demo Endpoints (🟢 HACKATHON ONLY)

These endpoints exist only to serve the demo mode. Do not build for production.

### GET /api/demo/farmers

Returns the three demo farmer profiles as pre-computed `FarmerProfile` objects (from `public/demo-data/`).

**Output (200):**
```typescript
{ farmers: FarmerProfile[] }
```

### GET /api/demo/score/[farmerId]

Returns a pre-computed `CompositeScore` + `ExplanationResponse` for a demo farmer.

Built by running the scoring engine and LLM explanation at server startup against the demo profiles in `public/demo-data/`. Cached for the session.

**Output (200):**
```typescript
{
  score: CompositeScore;
  explanation: ExplanationResponse;
  peerBenchmark: PeerBenchmarkResult | null;
}
```

---

*ShambaLadder · Kenya AI Challenge 2025*
