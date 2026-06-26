# CLAUDE.md — Agent Operating Manual
# ShambaLadder · Kenya AI Challenge 2025 · AgriFin Track

> **Read this document in full before touching any file, running any command, or writing any code.**
> This is the operating contract for every agent working on this project.

---

## What This Project Is

ShambaLadder is an AI-powered credit readiness scorecard for smallholder farmers in Kenya, Uganda, and Rwanda. It is built for the Kenya AI Challenge 2025 AgriFin Track (Shambapro brief).

The product has two views:
- **Farmer View** — A farmer sees their score across five dimensions, understands what shaped it, and gets a prioritised action list to improve it. They control sharing their profile.
- **Lender View** — A loan officer sees the same scorecard with per-field verification flags, peer benchmarks from Neo4j, and configurable dimension weights.

The AI explanation engine (hosted via Featherless, Mistral-7B) takes the structured scorecard and produces plain-language explanations and action lists from constrained templates.

---

## This Is a Hackathon Build

**Hackathon Date:** Today. You have one session per spec. Move fast. Build the demo-able core. Do not gold-plate.

Every spec is marked with one of:
- 🟢 **HACKATHON CORE** — Must be built. Demo fails without it.
- 🟡 **HACKATHON NICE** — Include if time allows. Demo is stronger with it. Cut if behind.
- 🔴 **POST-HACKATHON** — Do not build now. Noted for production roadmap.

If you are assigned a spec, your first question is: which tier is this?

---

## Three Constraints That Must Never Be Violated

**Constraint 1 — The scoring engine is rules-based, not ML.**
The composite score is a weighted sum across five dimensions with configurable lender weights. No model training, no embedding, no black box. Every number the farmer sees must be traceable to a specific input field and a published weight. If a calculation is not auditable in plain arithmetic, it is wrong.

**Constraint 2 — The LLM explanation engine uses constrained templates only.**
The Featherless/Mistral integration does not do free-form generation. It receives a fixed variable set (dimension score, gap to threshold, missing fields, location, crop, season) and fills a fixed output template. The output parser rejects any response that does not match the expected structure and retries with a stricter prompt. No agricultural advice beyond what the template produces.

**Constraint 3 — Farmer controls all data sharing.**
No lender receives farmer data without an explicit "Share Profile" action by the farmer. The lender view receives a snapshot, not live account access. Every share action logs a consent record. The farmer can revoke a share. This is non-negotiable for responsible AI compliance.

---

## Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | Next.js 14 (App Router) + Tailwind CSS | Deployed to Vercel |
| UI Foundation | Google Stitch-generated components (imported) | See `docs/stitch-import.md` |
| Backend | Next.js API Routes | Serverless, co-located with frontend |
| Graph DB | Neo4j Aura Free | Cooperative peer intelligence |
| LLM | Featherless API (Mistral-7B) | Constrained template generation |
| Climate API | Open-Meteo | No auth, free at prototype volume |
| Soil API | SoilGrids REST API | No auth, GPS-based |
| Deployment | Vercel (frontend + API) + Neo4j Aura (graph) | |
| Language | TypeScript everywhere | Strict mode on |

---

## Document Suite

Read only the documents listed in your spec brief. Do not read ahead.

```
docs/
├── CLAUDE.md                   This document — read first, always
├── current-state.md            Live system state — read before starting any spec
├── architecture.md             System architecture, data flow, service boundaries
├── data-model.md               All entities, fields, scoring logic, Neo4j schema
├── scoring-engine.md           Exact scoring formula, dimension weights, tier thresholds
├── api-contract.md             All API routes — inputs, outputs, error shapes
├── design-system.md            Design tokens, component library, Stitch import guide
├── screen-specs.md             Every screen — layout, components, data, interactions
├── neo4j-queries.md            Cypher queries, graph schema, peer benchmark logic
├── llm-integration.md          Featherless setup, prompt templates, output parser
├── stitch-import.md            How to prompt, export, and adapt Google Stitch UI components
├── build-order.md              Sprint definitions, scope, hackathon vs post-hackathon flags
└── decisions.md                All architectural decisions — what was chosen and why

context/
└── sprint_N-context.md         Written at the end of each sprint
```

---

## Project Structure

```
shambaladder/
├── app/
│   ├── (farmer)/
│   │   ├── dashboard/          Farmer score dashboard
│   │   ├── score/              Per-dimension score detail
│   │   ├── actions/            Prioritised action list
│   │   └── share/              Share profile flow
│   ├── (lender)/
│   │   ├── scorecard/          Lender scorecard view
│   │   ├── configure/          Weight configuration panel
│   │   └── peer-context/       Neo4j peer benchmark display
│   ├── onboarding/             Farmer data entry flow
│   ├── demo/                   Demo mode — pre-seeded farmer profiles
│   └── api/
│       ├── score/              Scoring engine endpoint
│       ├── explain/            Featherless LLM explanation endpoint
│       ├── climate/            Open-Meteo proxy
│       ├── soil/               SoilGrids proxy
│       └── neo4j/              Neo4j peer benchmark endpoint
├── components/
│   ├── ui/                     Design system primitives (from Stitch + custom)
│   ├── scorecard/              Scorecard-specific components
│   ├── farmer/                 Farmer view components
│   └── lender/                 Lender view components
├── lib/
│   ├── scoring/                Scoring engine — pure functions
│   ├── neo4j/                  Neo4j client and query runners
│   ├── featherless/            LLM client and template engine
│   ├── open-meteo/             Climate API client
│   └── soilgrids/              Soil API client
├── types/
│   └── index.ts                All shared TypeScript types and enums
├── docs/                       All specification documents (this folder)
└── public/
    └── demo-data/              Synthetic farmer profiles for demo mode
```

---

## How to Start a Sprint

1. Read `CLAUDE.md` (this document) in full.
2. Read `current-state.md` — know what is already built.
3. Read the context file for the previous sprint: `context/sprint_N-context.md`.
4. Read only the documents listed in your sprint brief in `build-order.md`.
5. Check the hackathon tier of everything in your sprint. Do not build 🔴 items.
6. Do not begin coding until steps 1–5 are complete.

## How to End a Sprint

1. Ensure the build passes with zero TypeScript errors.
2. Update `current-state.md`.
3. Write `context/sprint_N-context.md` using the structure below.

### What to Expect at the End of Each Sprint

A quick plain-language summary of what "done" looks like per sprint so you can tell at a glance whether a sprint is complete.

| Sprint | You should be able to… |
|---|---|
| **Sprint 1** | Call `POST /api/score` with a farmer profile and get back a score number and a tier label (Seedling / Growing / Established / Trusted). All 61 unit tests pass. |
| **Sprint 2** | Farmer data flows from Neo4j (peer benchmark), Open-Meteo (climate), and SoilGrids (soil). Each has its own API route that returns real data. |
| **Sprint 3** | Call `POST /api/explain` and get back plain-language sentences explaining each score dimension plus a ranked action list. No placeholder text. |
| **Sprint 4** | Open `/demo` in a browser, pick Wanjiku, and see her score dashboard with real LLM explanations and a working "Share" button. |
| **Sprint 5** | Open the share link as a lender and see the full scorecard with peer benchmark data and verification badges. |
| **Sprint 6** | The full demo runs end-to-end — pick a farmer, see the score, share it, view it as a lender — with zero placeholder text. |
| **Sprint 7** | The demo runs on a phone-sized browser window with no broken layouts, loading states on every async call, and a complete README. |

### How to Test the Completed Sprint

Run these commands after every sprint to confirm nothing is broken.

**1. TypeScript — zero errors required**
```bash
npx tsc --noEmit
```
If this prints anything, fix it before moving on.

**2. Unit tests (Sprints 1+)**
```bash
npm test
```
All tests must pass. A failing test means the scoring engine has a bug — do not skip.

**3. Dev server — confirms the app actually starts**
```bash
npm run dev
```
Visit `http://localhost:3000`. If the page loads, the scaffold is healthy.

**4. Smoke-test the score API (Sprints 1+)**
```bash
curl -s -X POST http://localhost:3000/api/score \
  -H "Content-Type: application/json" \
  -d @public/demo-data/wanjiku.json | jq '.score.totalScore, .score.tier'
```
Expected: a number between 40–59 and `"growing"`.

**5. Smoke-test the explain API (Sprint 3+)**
```bash
# Start dev server first, then:
curl -s -X POST http://localhost:3000/api/explain \
  -H "Content-Type: application/json" \
  -d '{"profile": <wanjiku JSON>, "score": <score JSON>}' | jq '.actionList | length'
```
Expected: a number between 3–6.

**6. Check `current-state.md` is up to date**
Open `current-state.md` and confirm every item built this sprint has a ✅ next to it. If anything still shows ❌ that should be done, the sprint is not complete.

### Sprint Context File Structure

```markdown
# Sprint N — [Sprint Name] Context

## What Was Built
- One bullet per discrete deliverable. Be specific.

## Current System State
- What routes/components are live
- Which integrations are active vs stubbed
- Environment variables added this sprint

## Decisions Made
Any decisions not already in decisions.md. If none: "None."

## Known Issues / Deferred
- What was cut for time
- What is fragile
- What the next agent must know

## Sprint N+1 Should Start With
1. Explicit first steps. No ambiguity.
```

---

## Code Standards

### Language
- TypeScript strict everywhere. Zero `any`. Narrow `unknown` with guards.
- ESM modules. No CommonJS.

### Naming
| Thing | Convention |
|---|---|
| Files | `kebab-case.ts` |
| Components | `PascalCase.tsx` |
| Functions | `camelCase` |
| Constants | `SCREAMING_SNAKE_CASE` |
| Types/Interfaces | `PascalCase`, no `I` prefix |
| API routes | `/api/kebab-case` |

### Component Pattern
All components are functional with explicit prop types. No implicit `any` props.

```typescript
// ✅ CORRECT
interface ScoreCardProps {
  farmerId: string;
  score: CompositeScore;
  tier: CreditTier;
  onShare?: () => void;
}

export function ScoreCard({ farmerId, score, tier, onShare }: ScoreCardProps) { ... }

// ❌ WRONG
export function ScoreCard(props: any) { ... }
```

### Scoring Engine — Must Be Pure Functions
The scoring engine in `lib/scoring/` must be pure functions with no side effects. Every calculation must be unit-testable.

```typescript
// ✅ CORRECT
export function calculateFinancialScore(inputs: FinancialInputs): DimensionScore {
  // pure computation — same inputs always produce same output
}

// ❌ WRONG
export async function calculateFinancialScore(farmerId: string): Promise<DimensionScore> {
  // fetching inside the scoring engine — untestable, impure
}
```

### API Route Pattern
```typescript
// ✅ CORRECT
export async function POST(request: Request) {
  const body = await request.json();
  const parsed = scoreRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: { code: 'INVALID_INPUT', message: parsed.error.message } }, { status: 400 });
  }
  // ...
}
```

### Error Shape
All API errors use this shape:
```typescript
interface ApiError {
  error: {
    code: string;       // SCREAMING_SNAKE_CASE machine-readable code
    message: string;    // human-readable
    field?: string;     // for validation errors
  };
}
```

### HTTP Status Codes
| Situation | Code |
|---|---|
| Successful retrieval | 200 |
| Successful creation | 201 |
| Validation error | 400 |
| Unauthorized | 401 |
| Not found | 404 |
| Server error | 500 |

---

## What Agents Must Not Do

1. **Build 🔴 post-hackathon items.** Flag if the spec accidentally includes one.
2. **Make architectural decisions not in `decisions.md`.** Stop and document the question.
3. **Write free-form LLM prompts.** The LLM integration uses fixed templates from `llm-integration.md` only.
4. **Share farmer data without explicit consent action.** The sharing flow is defined in the screen spec. Do not shortcut it.
5. **Add external dependencies without justification.** Document in `decisions.md`.
6. **Hardcode GPS coordinates, API keys, or farmer data in application code.** Use environment variables and demo data files.

---

## Demo Mode

The hackathon demo requires three pre-built farmer profiles:
- **Wanjiku Kamau** — Tier 2 → Tier 3 upgrade candidate (score 57, GPS confirmed, missing repayment history)
- **Joseph Omondi** — Tier 3, established record (score 68, cooperative member 4 seasons)
- **Amina Hassan** — Tier 1, new entrant (score 28, sparse records, high score uplift potential)

All demo profiles are in `public/demo-data/`. Demo mode routes are under `/demo/` and bypass real data entry. The scoring engine runs on the demo data — it is not faked. The LLM explanation engine runs on the computed scores — it is not mocked.

---

*ShambaLadder · Kenya AI Challenge 2025 · AgriFin Track · Shambapro Brief*
*This document is maintained by the ShambaLadder founding team. Do not modify during a sprint.*
