# llm-integration.md — LLM Explanation Engine
# ShambaLadder · Kenya AI Challenge 2025

## Purpose
Specifies the Featherless API integration, all prompt templates, the output parser, and the retry logic. Agents building Sprint 3 read this document.

**Critical constraint from CLAUDE.md:** The LLM does NOT do free-form generation. Input variables are fixed. Output structure is fixed. The output parser rejects off-structure responses and retries. No agricultural advice beyond what the templates produce.

---

## Featherless Setup

Featherless provides open-source model inference (Mistral-7B, Llama-3, Phi-3).

```typescript
// lib/featherless/client.ts

const FEATHERLESS_API_URL = 'https://api.featherless.ai/v1/chat/completions';

export interface FeatherlessRequest {
  model: string;
  messages: { role: 'system' | 'user'; content: string }[];
  max_tokens: number;
  temperature: number;
}

export async function callFeatherless(req: FeatherlessRequest): Promise<string> {
  const response = await fetch(FEATHERLESS_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.FEATHERLESS_API_KEY}`,
    },
    body: JSON.stringify(req),
  });

  if (!response.ok) {
    throw new Error(`Featherless API error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return data.choices[0].message.content as string;
}
```

**Model recommendation:** Start with `mistralai/Mistral-7B-Instruct-v0.2`. If output quality is insufficient, try `meta-llama/Meta-Llama-3-8B-Instruct`.

**Environment variables:**
```
FEATHERLESS_API_KEY=[your-featherless-api-key]
FEATHERLESS_MODEL=mistralai/Mistral-7B-Instruct-v0.2
```

---

## Template Engine

### Variable Set

These are the ONLY variables the templates use. No additions without a spec change.

```typescript
interface TemplateVars {
  // Farmer context
  farmerName: string;
  location: string;           // e.g. "Kisii, Kenya"
  primaryCrop: string;        // e.g. "maize"
  currentSeason: string;      // e.g. "Long Rains 2025"
  farmSizeAcres: number;

  // Dimension-specific
  dimensionName: string;      // Human-readable: "Financial Behaviour"
  dimensionScore: number;     // 0-100
  dimensionWeight: number;    // 0-100 (percentage, not decimal)
  dimensionRawScore: number;  // Before completeness multiplier

  // Tier context
  currentTier: string;        // "Seedling" | "Growing" | "Established" | "Trusted"
  currentTierScore: number;   // e.g. 57
  nextTier: string | null;    // null if already Trusted
  gapToNextTier: number | null; // points needed to reach next tier

  // Missing fields (for action generation)
  missingFields: string[];    // e.g. ["GPS confirmation", "Mobile money regularity"]
  verificationStatus: string; // "Fully verified" | "Partially verified" | "Self-reported"

  // Peer context (for social dimension and summary)
  peerBenchmarkSummary: string | null; // e.g. "19 of 23 similar farmers repaid on time"
}
```

### System Prompt (shared across all templates)

```
You are a credit readiness advisor for smallholder farmers in East Africa.
You explain credit scores in plain, encouraging language.
You DO NOT give agricultural advice beyond what is directly relevant to improving a credit score.
You DO NOT speculate about lending decisions.
You respond ONLY in the exact JSON format specified. No preamble. No extra text.
Keep all explanations under 60 words per section.
Write as if talking directly to the farmer, unless the template specifies lender context.
```

---

## Templates

### FINANCIAL_TEMPLATE

**Purpose:** Explain the Financial Behaviour dimension score.

**User prompt:**
```
Generate a credit score explanation for the Financial Behaviour dimension.

Farmer: {{farmerName}}, {{location}}, growing {{primaryCrop}}
Dimension score: {{dimensionScore}}/100 (weight: {{dimensionWeight}}% of total score)
Current total score: {{currentTierScore}} ({{currentTier}} tier)
Missing or unverified fields: {{missingFields}}

Respond ONLY with this exact JSON structure:
{
  "explanation": "2-3 sentences explaining this score in plain language to the farmer.",
  "keyStrength": "One sentence on the strongest positive factor, or null if score is below 40.",
  "keyGap": "One sentence on the most impactful missing or weak factor, or null if score is above 80.",
  "action": "One specific, achievable action the farmer can take to improve this score. Include estimated point impact if above 5 points."
}
```

### PRODUCTIVITY_TEMPLATE

**User prompt:**
```
Generate a credit score explanation for the Farm Productivity dimension.

Farmer: {{farmerName}}, {{location}}, {{farmSizeAcres}} acres of {{primaryCrop}}
Dimension score: {{dimensionScore}}/100 (weight: {{dimensionWeight}}% of total score)
Missing or unverified fields: {{missingFields}}

Respond ONLY with this exact JSON structure:
{
  "explanation": "2-3 sentences explaining this score in plain language to the farmer.",
  "keyStrength": "One sentence on the strongest positive factor, or null if score is below 40.",
  "keyGap": "One sentence on the most impactful gap, or null if score is above 80.",
  "action": "One specific, achievable action the farmer can take. Prioritise GPS confirmation if gpsConfirmed is in missingFields."
}
```

### CLIMATE_TEMPLATE

**User prompt:**
```
Generate a credit score explanation for the Climate Resilience dimension.

Farmer: {{farmerName}}, {{location}}, growing {{primaryCrop}} in {{currentSeason}}
Dimension score: {{dimensionScore}}/100 — this score reflects adaptive practices, NOT climate risk level.
Missing or unverified fields: {{missingFields}}

Respond ONLY with this exact JSON structure:
{
  "explanation": "2-3 sentences. Explain that this score reflects the farmer's adaptive practices, not their location's climate. Be encouraging.",
  "keyStrength": "One sentence on the strongest adaptive practice, or null if score is below 40.",
  "keyGap": "One sentence on the highest-value missing practice.",
  "action": "One specific, achievable adaptation the farmer can adopt. Name the practice and the approximate point impact."
}
```

### SOCIAL_TEMPLATE

**User prompt:**
```
Generate a credit score explanation for the Social & Cooperative Capital dimension.

Farmer: {{farmerName}}, {{location}}
Dimension score: {{dimensionScore}}/100 (weight: {{dimensionWeight}}% of total score)
Peer context: {{peerBenchmarkSummary ?? "No peer data available yet."}}
Missing or unverified fields: {{missingFields}}

Respond ONLY with this exact JSON structure:
{
  "explanation": "2-3 sentences. If peer context is available, reference it to help the farmer understand how they compare. Be specific.",
  "keyStrength": "One sentence on cooperative tenure or off-taker relationship, or null if score is below 40.",
  "keyGap": "One sentence on the most impactful gap (cooperative membership, off-taker relationship, or repayment history).",
  "action": "One specific action. If farmer has no cooperative, recommend joining one and name the score impact."
}
```

### COMPLETENESS_TEMPLATE

**User prompt:**
```
Generate a credit score explanation for the Record Completeness dimension.

Farmer: {{farmerName}}, {{location}}
Completeness: {{dimensionScore}}% complete
This percentage acts as a confidence multiplier on all other scores.
Missing fields: {{missingFields}}

Respond ONLY with this exact JSON structure:
{
  "explanation": "2-3 sentences. Explain that completing their profile increases confidence in their score and makes it more credible to lenders. Name the top 1-2 missing fields.",
  "keyStrength": "One sentence if completeness is above 70%, else null.",
  "keyGap": "One sentence naming the single highest-impact missing field.",
  "action": "One specific action to improve completeness. GPS confirmation if missing — include that it adds 8 points to Farm Productivity AND improves the completeness multiplier."
}
```

### SUMMARY_TEMPLATE

**Purpose:** Generate the overall composite explanation and ranked action list.

**User prompt:**
```
Generate an overall credit readiness summary and action plan.

Farmer: {{farmerName}}, {{location}}, growing {{primaryCrop}} on {{farmSizeAcres}} acres
Current score: {{currentTierScore}} ({{currentTier}} tier)
Gap to next tier: {{gapToNextTier}} points to {{nextTier ?? "maximum tier"}}
Verification status: {{verificationStatus}}

Dimension scores:
- Financial Behaviour: {{financialScore}}/100
- Farm Productivity: {{productivityScore}}/100
- Climate Resilience: {{climateScore}}/100
- Social Capital: {{socialScore}}/100
- Record Completeness: {{completenessScore}}%

Top missing/weak areas: {{missingFields}}

Respond ONLY with this exact JSON structure:
{
  "compositeExplanation": "3-4 sentences. Summarise the overall score, what is driving it, and what the tier means for credit access. Be specific and encouraging.",
  "tierExplanation": "1-2 sentences. What credit opportunities does this tier open? What does the next tier unlock?",
  "actionList": [
    {
      "rank": 1,
      "action": "Specific action description. Name what to do, not just the category.",
      "estimatedScoreImpact": 8,
      "targetDimension": "farm_productivity",
      "effort": "quick"
    },
    {
      "rank": 2,
      "action": "...",
      "estimatedScoreImpact": 6,
      "targetDimension": "climate_resilience",
      "effort": "medium"
    },
    {
      "rank": 3,
      "action": "...",
      "estimatedScoreImpact": 5,
      "targetDimension": "record_completeness",
      "effort": "quick"
    }
  ]
}
```

Action list requirements:
- Minimum 3 actions, maximum 6
- Ranked by estimatedScoreImpact descending
- effort must be exactly 'quick' | 'medium' | 'hard'
- targetDimension must be exactly one of: 'financial_behaviour' | 'farm_productivity' | 'climate_resilience' | 'social_coop_capital' | 'record_completeness'
- estimatedScoreImpact must be a number between 1 and 30

---

## Output Parser

```typescript
// lib/featherless/parser.ts

import { z } from 'zod';

const DimensionExplanationSchema = z.object({
  explanation: z.string().min(10).max(400),
  keyStrength: z.string().max(200).nullable(),
  keyGap: z.string().max(200).nullable(),
  action: z.string().min(10).max(300),
});

const ScoredActionSchema = z.object({
  rank: z.number().int().min(1).max(10),
  action: z.string().min(10).max(300),
  estimatedScoreImpact: z.number().min(1).max(30),
  targetDimension: z.enum([
    'financial_behaviour',
    'farm_productivity',
    'climate_resilience',
    'social_coop_capital',
    'record_completeness',
  ]),
  effort: z.enum(['quick', 'medium', 'hard']),
});

const SummaryResponseSchema = z.object({
  compositeExplanation: z.string().min(20).max(500),
  tierExplanation: z.string().min(10).max(300),
  actionList: z.array(ScoredActionSchema).min(3).max(6),
});

export function parseDimensionExplanation(raw: string): z.infer<typeof DimensionExplanationSchema> {
  const cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  const parsed = JSON.parse(cleaned);
  return DimensionExplanationSchema.parse(parsed);
}

export function parseSummaryResponse(raw: string): z.infer<typeof SummaryResponseSchema> {
  const cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  const parsed = JSON.parse(cleaned);
  return SummaryResponseSchema.parse(parsed);
}
```

---

## Explanation Engine with Retry

```typescript
// lib/featherless/engine.ts

const MAX_RETRIES = 2;

async function generateWithRetry<T>(
  templateName: string,
  prompt: string,
  parser: (raw: string) => T
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const raw = await callFeatherless({
        model: process.env.FEATHERLESS_MODEL!,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        max_tokens: 600,
        temperature: 0.3,  // Low temperature for structured output consistency
      });

      return parser(raw);
    } catch (error) {
      lastError = error;
      console.warn(`[Featherless] ${templateName} attempt ${attempt + 1} failed:`, error);

      if (attempt < MAX_RETRIES) {
        // On retry, append stricter instruction
        prompt += '\n\nIMPORTANT: Respond with valid JSON only. No other text before or after the JSON object.';
      }
    }
  }

  throw new Error(`[Featherless] ${templateName} failed after ${MAX_RETRIES + 1} attempts: ${lastError}`);
}
```

---

## Full Explanation Generation

```typescript
// lib/featherless/generate-explanation.ts

export async function generateFullExplanation(
  profile: FarmerProfile,
  score: CompositeScore,
  peerBenchmark: PeerBenchmarkResult | null
): Promise<ExplanationResponse> {
  const vars = buildTemplateVars(profile, score, peerBenchmark);

  // Run dimension explanations in parallel for speed
  const [financial, productivity, climate, social, completeness, summary] = await Promise.all([
    generateDimensionExplanation('FINANCIAL', vars),
    generateDimensionExplanation('PRODUCTIVITY', vars),
    generateDimensionExplanation('CLIMATE', vars),
    generateDimensionExplanation('SOCIAL', vars),
    generateDimensionExplanation('COMPLETENESS', vars),
    generateSummary(vars, score),
  ]);

  return {
    farmerId: profile.farmerId,
    compositeExplanation: summary.compositeExplanation,
    tierExplanation: summary.tierExplanation,
    dimensions: {
      financial_behaviour: financial,
      farm_productivity: productivity,
      climate_resilience: climate,
      social_coop_capital: social,
      record_completeness: completeness,
    },
    actionList: summary.actionList,
    computedAt: new Date().toISOString(),
  };
}
```

---

## API Route

```typescript
// app/api/explain/route.ts

export async function POST(request: Request) {
  const body = await request.json();

  // Validate input
  const parsed = ExplainRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: { code: 'INVALID_INPUT', message: parsed.error.message } },
      { status: 400 }
    );
  }

  const { profile, score, peerBenchmark } = parsed.data;

  try {
    const explanation = await generateFullExplanation(profile, score, peerBenchmark);
    return Response.json(explanation);
  } catch (error) {
    console.error('[Explain API] Failed:', error);
    return Response.json(
      { error: { code: 'EXPLANATION_FAILED', message: 'Could not generate explanation' } },
      { status: 500 }
    );
  }
}
```

---

## Graceful Degradation

If the LLM explanation fails (network error, parse failure after retries):
- The scoring engine response is still returned fully.
- The farmer dashboard renders scores without explanations.
- A banner shows: "Explanation unavailable. Your score and breakdown above are accurate."
- The lender view is not affected — it does not use LLM explanations.

This is the required degradation mode. Never block the score display on LLM availability.

---

*ShambaLadder · Kenya AI Challenge 2025*
