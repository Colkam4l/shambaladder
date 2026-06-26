import type { FarmerProfile, CompositeScore, PeerBenchmarkResult } from '@/types';
import { gapToNextTier } from '../scoring/tiers';

export interface TemplateVars {
  farmerName: string;
  location: string;
  primaryCrop: string;
  currentSeason: string;
  farmSizeAcres: number;
  dimensionName: string;
  dimensionScore: number;
  dimensionWeight: number;
  dimensionRawScore: number;
  currentTier: string;
  currentTierScore: number;
  nextTier: string | null;
  gapToNextTier: number | null;
  missingFields: string[];
  verificationStatus: string;
  peerBenchmarkSummary: string | null;
}

export const SYSTEM_PROMPT = `You are a credit readiness advisor for smallholder farmers in East Africa.
You explain credit scores in plain, encouraging language.
You DO NOT give agricultural advice beyond what is directly relevant to improving a credit score.
You DO NOT speculate about lending decisions.
You respond ONLY in the exact JSON format specified. No preamble. No extra text.
Keep explanations under 50 words. Keep keyStrength, keyGap, and action short and concise (under 20 words each).
Write as if talking directly to the farmer, unless the template specifies lender context.`;

export const FINANCIAL_TEMPLATE = `Generate a credit score explanation for the Financial Behaviour dimension.

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
}`;

export const PRODUCTIVITY_TEMPLATE = `Generate a credit score explanation for the Farm Productivity dimension.

Farmer: {{farmerName}}, {{location}}, {{farmSizeAcres}} acres of {{primaryCrop}}
Dimension score: {{dimensionScore}}/100 (weight: {{dimensionWeight}}% of total score)
Missing or unverified fields: {{missingFields}}

Respond ONLY with this exact JSON structure:
{
  "explanation": "2-3 sentences explaining this score in plain language to the farmer.",
  "keyStrength": "One sentence on the strongest positive factor, or null if score is below 40.",
  "keyGap": "One sentence on the most impactful gap, or null if score is above 80.",
  "action": "One specific, achievable action the farmer can take. Prioritise GPS confirmation if gpsConfirmed is in missingFields."
}`;

export const CLIMATE_TEMPLATE = `Generate a credit score explanation for the Climate Resilience dimension.

Farmer: {{farmerName}}, {{location}}, growing {{primaryCrop}} in {{currentSeason}}
Dimension score: {{dimensionScore}}/100 — this score reflects adaptive practices, NOT climate risk level.
Missing or unverified fields: {{missingFields}}

Respond ONLY with this exact JSON structure:
{
  "explanation": "2-3 sentences. Explain that this score reflects the farmer's adaptive practices, not their location's climate. Be encouraging.",
  "keyStrength": "One sentence on the strongest adaptive practice, or null if score is below 40.",
  "keyGap": "One sentence on the highest-value missing practice.",
  "action": "One specific, achievable adaptation the farmer can adopt. Name the practice and the approximate point impact."
}`;

export const SOCIAL_TEMPLATE = `Generate a credit score explanation for the Social & Cooperative Capital dimension.

Farmer: {{farmerName}}, {{location}}
Dimension score: {{dimensionScore}}/100 (weight: {{dimensionWeight}}% of total score)
Peer context: {{peerBenchmarkSummary}}
Missing or unverified fields: {{missingFields}}

Respond ONLY with this exact JSON structure:
{
  "explanation": "2-3 sentences. If peer context is available, reference it to help the farmer understand how they compare. Be specific.",
  "keyStrength": "One sentence on cooperative tenure or off-taker relationship, or null if score is below 40.",
  "keyGap": "One sentence on the most impactful gap (cooperative membership, off-taker relationship, or repayment history).",
  "action": "One specific action. If farmer has no cooperative, recommend joining one and name the score impact."
}`;

export const COMPLETENESS_TEMPLATE = `Generate a credit score explanation for the Record Completeness dimension.

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
}`;

export const SUMMARY_TEMPLATE = `Generate an overall credit readiness summary and action plan.

Farmer: {{farmerName}}, {{location}}, growing {{primaryCrop}} on {{farmSizeAcres}} acres
Current score: {{currentTierScore}} ({{currentTier}} tier)
Gap to next tier: {{gapToNextTier}} points to {{nextTier}}
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
}`;

export function getTierLabel(tier: string): string {
  if (tier === 'seedling') return 'Seedling';
  if (tier === 'growing') return 'Growing';
  if (tier === 'established') return 'Established';
  if (tier === 'trusted') return 'Trusted';
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

export function buildTemplateVars(
  profile: FarmerProfile,
  score: CompositeScore,
  peerBenchmark: PeerBenchmarkResult | null
): Omit<TemplateVars, 'dimensionName' | 'dimensionScore' | 'dimensionWeight' | 'dimensionRawScore' | 'missingFields'> {
  const coopName = profile.social.cooperativeName;
  const regionCapitalized = profile.region.charAt(0).toUpperCase() + profile.region.slice(1);
  const location = coopName
    ? `${coopName.replace(' Cooperative', '').replace(' Maize', '')}, ${regionCapitalized}`
    : regionCapitalized;

  const gapInfo = gapToNextTier(score.totalScore);

  const statuses = [
    ...Object.values(profile.financial.verificationStatus),
    ...Object.values(profile.productivity.verificationStatus),
    ...Object.values(profile.climate.verificationStatus),
    ...Object.values(profile.social.verificationStatus),
  ];

  let verificationStatus = 'Self-reported';
  if (statuses.every(s => s === 'verified')) {
    verificationStatus = 'Fully verified';
  } else if (statuses.some(s => s === 'verified' || s === 'graph_derived' || s === 'third_party')) {
    verificationStatus = 'Partially verified';
  }

  const peerBenchmarkSummary = peerBenchmark?.displayString || 'No peer data available yet.';

  return {
    farmerName: profile.name,
    location,
    primaryCrop: profile.primaryCrop,
    currentSeason: profile.currentSeason,
    farmSizeAcres: profile.farmSizeAcres,
    currentTier: getTierLabel(score.tier),
    currentTierScore: score.totalScore,
    nextTier: gapInfo.nextTier ? getTierLabel(gapInfo.nextTier) : 'maximum tier',
    gapToNextTier: gapInfo.gap,
    verificationStatus,
    peerBenchmarkSummary,
  };
}

export function renderTemplate(template: string, vars: Record<string, unknown>): string {
  let rendered = template;
  for (const [key, val] of Object.entries(vars)) {
    const placeholder = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
    let replacement = '';
    if (val === null || val === undefined) {
      replacement = 'none';
    } else if (Array.isArray(val)) {
      replacement = val.length > 0 ? val.join(', ') : 'none';
    } else {
      replacement = String(val);
    }
    rendered = rendered.replace(placeholder, replacement);
  }
  return rendered;
}
