# data-model.md — Data Model
# ShambaLadder · Kenya AI Challenge 2025

## Purpose
Defines every entity, field, type, and relationship in ShambaLadder. This is the single source of truth for TypeScript types and API shapes. Agents building any feature read this document.

---

## Core Entities

### FarmerProfile

The complete data record for a farmer. The scoring engine operates on this.

```typescript
interface FarmerProfile {
  farmerId: string;                  // UUID, generated at onboarding
  name: string;
  location: GPSCoordinates;
  region: 'kenya' | 'uganda' | 'rwanda';
  primaryCrop: string;               // e.g. "maize", "beans", "coffee"
  farmSizeAcres: number;             // 1-5 acres for target population
  currentSeason: string;             // e.g. "Long Rains 2025"

  // Financial Behaviour inputs (Dimension 1, 30%)
  financial: FinancialInputs;

  // Farm Productivity inputs (Dimension 2, 25%)
  productivity: ProductivityInputs;

  // Climate Resilience inputs (Dimension 3, 20%)
  climate: ClimateInputs;

  // Social & Coop Capital inputs (Dimension 4, 15%)
  social: SocialInputs;

  // Record Completeness inputs (Dimension 5, 10%)
  completeness: CompletenessInputs;

  // Metadata
  createdAt: string;                 // ISO 8601
  lastUpdatedAt: string;
  consentGrantedAt: string;          // When farmer granted data consent
  sharedProfiles: SharedProfile[];   // Profiles shared with lenders
}
```

### FinancialInputs

```typescript
interface FinancialInputs {
  // Mobile money behaviour (self-declared in prototype; MNO API in production)
  mobileMoneyRegularity: 'none' | 'irregular' | 'monthly' | 'weekly';
  mobileMoneyMonthlyVolume: number | null;  // KES approx

  // Savings group
  savingsGroupMember: boolean;
  savingsGroupContributionRegularity: 'none' | 'irregular' | 'regular' | null;

  // Input credit repayment via cooperative
  priorInputCreditCycles: number;          // Number of completed input credit cycles
  priorRepaymentOutcomes: ('on_time' | 'late' | 'default')[];  // One per cycle

  // Verification status per field
  verificationStatus: {
    mobileMoneyRegularity: VerificationStatus;
    savingsGroupMember: VerificationStatus;
    priorRepaymentOutcomes: VerificationStatus;
  };
}
```

### ProductivityInputs

```typescript
interface ProductivityInputs {
  // Shambapro yield records
  yieldLastSeason: number | null;       // kg/acre
  yieldPreviousSeason: number | null;
  cropDiversity: number;                // Number of distinct crops grown

  // Input quality
  usesImprovedSeeds: boolean;
  usesFertilizer: boolean;
  usesAgrochemicals: boolean;

  // GPS boundary
  gpsConfirmed: boolean;
  farmBoundaryCoordinates: GPSCoordinates[] | null;

  // Soil quality (from SoilGrids API — auto-populated)
  soilQualityIndex: number | null;      // 0-100 from SoilGrids
  soilDataSource: 'soilgrids' | null;

  // Verification status
  verificationStatus: {
    yieldLastSeason: VerificationStatus;
    gpsConfirmed: VerificationStatus;
    soilQualityIndex: VerificationStatus;
  };
}
```

### ClimateInputs

```typescript
interface ClimateInputs {
  // Climate exposure (from Open-Meteo — auto-populated, NOT scored directly)
  // These are CONTEXT FLAGS for the lender, not farmer penalties
  rainfallIndexLastSeason: number | null;     // mm, from Open-Meteo
  droughtIndexLastSeason: number | null;      // SPEI score
  climateRiskLevel: 'low' | 'medium' | 'high' | null;  // derived from above

  // Adaptive practices (self-reported — these are what enter the composite score)
  hasIrrigationAccess: boolean;
  usesDroughtTolerantVarieties: boolean;
  practisesSoilConservation: boolean;
  hasPostHarvestStorage: boolean;
  hasCropInsurance: boolean;

  // Verification status
  verificationStatus: {
    rainfallIndexLastSeason: VerificationStatus;   // always 'third_party'
    adaptivePractices: VerificationStatus;          // always 'self_reported'
  };
}
```

### SocialInputs

```typescript
interface SocialInputs {
  // Cooperative membership
  cooperativeId: string | null;
  cooperativeName: string | null;
  cooperativeMemberSinceSeasons: number;    // Number of seasons as member

  // Off-taker relationship
  hasStableOfftaker: boolean;
  offtakerSeasons: number;                  // How many seasons with same off-taker

  // Neo4j peer data (auto-populated from graph query)
  peerBenchmark: PeerBenchmarkResult | null;

  // Cooperative trust signal (from Neo4j cooperative node)
  cooperativeRepaymentRate: number | null;  // 0-1, average across all members

  // Verification status
  verificationStatus: {
    cooperativeMembership: VerificationStatus;
    offtakerRelationship: VerificationStatus;
    peerBenchmark: VerificationStatus;       // always 'graph_derived'
  };
}
```

### CompletenessInputs

```typescript
interface CompletenessInputs {
  // Profile completeness signals
  shamboproProfileComplete: boolean;
  gpsConfirmed: boolean;         // mirrors productivity.gpsConfirmed
  entryConsistencyScore: number; // 0-1, cross-season consistency check
  internalConsistencyScore: number; // 0-1, cross-field plausibility check

  // Completeness percentage (derived — not directly entered)
  completenessPercentage: number; // 0-100
}
```

---

## Scoring Types

### DimensionScore

```typescript
interface DimensionScore {
  dimension: DimensionName;
  rawScore: number;         // 0-100 before completeness multiplier
  weight: number;           // Default weight (0-1). Lender can override.
  weightedScore: number;    // rawScore * weight
  completenessMultiplier: number;  // 0.5-1.0, applied from Record Completeness
  adjustedScore: number;    // weightedScore * completenessMultiplier

  // For display
  missingFields: string[];          // Fields that would improve this score
  verificationFlags: VerificationFlag[];
}

type DimensionName =
  | 'financial_behaviour'
  | 'farm_productivity'
  | 'climate_resilience'
  | 'social_coop_capital'
  | 'record_completeness';
```

### CompositeScore

```typescript
interface CompositeScore {
  totalScore: number;      // 0-100, sum of adjustedScores
  tier: CreditTier;
  dimensions: Record<DimensionName, DimensionScore>;
  weights: DimensionWeights;  // Weights used in this calculation
  computedAt: string;         // ISO 8601
}
```

### CreditTier

```typescript
type CreditTier = 'seedling' | 'growing' | 'established' | 'trusted';

const TIER_THRESHOLDS = {
  seedling: { min: 0, max: 39 },
  growing: { min: 40, max: 59 },
  established: { min: 60, max: 79 },
  trusted: { min: 80, max: 100 },
} as const;

const TIER_DISPLAY = {
  seedling: {
    label: 'Seedling',
    creditSignal: 'Small monitored input credit',
    color: '--color-tier-seedling',
  },
  growing: {
    label: 'Growing',
    creditSignal: 'Standard seasonal input loan',
    color: '--color-tier-growing',
  },
  established: {
    label: 'Established',
    creditSignal: 'Larger productive investment loan',
    color: '--color-tier-established',
  },
  trusted: {
    label: 'Trusted',
    creditSignal: 'Group lending eligible, lower rate negotiable',
    color: '--color-tier-trusted',
  },
} as const;
```

### DimensionWeights

```typescript
interface DimensionWeights {
  financial_behaviour: number;    // Default: 0.30
  farm_productivity: number;      // Default: 0.25
  climate_resilience: number;     // Default: 0.20
  social_coop_capital: number;    // Default: 0.15
  record_completeness: number;    // Default: 0.10
}

// Weights must always sum to 1.0
// Validated at scoring engine entry and at lender weight config UI
```

---

## Verification Types

```typescript
type VerificationStatus =
  | 'verified'       // Confirmed from third-party source (coop records, MNO)
  | 'self_reported'  // Provided by farmer, not independently confirmed
  | 'third_party'    // Auto-populated from Open-Meteo, SoilGrids
  | 'graph_derived'  // Computed from Neo4j graph
  | 'missing';       // Field not provided

interface VerificationFlag {
  field: string;
  status: VerificationStatus;
  source: string;    // e.g. "SoilGrids API", "Farmer self-reported", "M-Pesa records"
  note?: string;     // e.g. "Cross-validated against SoilGrids yield potential"
}
```

---

## Explanation Types

```typescript
interface ExplanationResponse {
  farmerId: string;
  compositeExplanation: string;     // 3-4 sentence overall summary
  tierExplanation: string;          // What this tier means for credit access
  dimensions: Record<DimensionName, DimensionExplanation>;
  actionList: ScoredAction[];       // Ranked by score impact, descending
  computedAt: string;
}

interface DimensionExplanation {
  dimension: DimensionName;
  explanation: string;              // 2-3 sentences, plain language
  keyStrength: string | null;       // One sentence on what's good
  keyGap: string | null;            // One sentence on biggest gap
}

interface ScoredAction {
  rank: number;                     // 1 = highest impact
  action: string;                   // Specific action description
  estimatedScoreImpact: number;     // Points added if action completed
  targetDimension: DimensionName;
  effort: 'quick' | 'medium' | 'hard';
  // effort guidance:
  // quick = completable today (confirm GPS, update profile field)
  // medium = 1-2 weeks (open savings account, join coop)
  // hard = next season+ (complete full credit cycle, improve yield)
}
```

---

## Peer Benchmark Types (Neo4j)

```typescript
interface PeerBenchmarkResult {
  cooperativeId: string;
  cooperativeName: string;
  peerCount: number;
  onTimeCount: number;
  lateCount: number;
  defaultCount: number;
  avgPeerTier: number;         // Numeric average (1=seedling, 4=trusted)
  repaymentRate: number;       // onTimeCount / peerCount
  displayString: string;       // Pre-formatted: "19 of 23 similar farmers repaid on time"
  sufficientData: boolean;     // false if peerCount < 10
}
```

---

## Share Profile Types

```typescript
interface SharedProfile {
  shareId: string;              // UUID, used as URL token
  farmerId: string;
  lenderName: string | null;    // Entered by farmer at share time
  sharedAt: string;             // ISO 8601
  expiresAt: string | null;     // null = no expiry for hackathon
  scoreSnapshot: CompositeScore; // Score at time of sharing — immutable
  explanationSnapshot: ExplanationResponse;
}
```

---

## GPS Types

```typescript
interface GPSCoordinates {
  latitude: number;
  longitude: number;
}
```

---

## Demo Farmer Profiles

Pre-built profiles used in Demo Mode. These are the authoritative demo scenarios.

### Profile 1: Wanjiku Kamau (Tier 2 → Tier 3 candidate)

```typescript
const WANJIKU_PROFILE: FarmerProfile = {
  farmerId: 'demo-wanjiku-001',
  name: 'Wanjiku Kamau',
  location: { latitude: -0.6698, longitude: 37.2655 }, // Kisii, Kenya
  region: 'kenya',
  primaryCrop: 'maize',
  farmSizeAcres: 2.5,
  currentSeason: 'Long Rains 2025',
  financial: {
    mobileMoneyRegularity: 'monthly',
    mobileMoneyMonthlyVolume: 4500,
    savingsGroupMember: true,
    savingsGroupContributionRegularity: 'regular',
    priorInputCreditCycles: 0,           // First-time borrower — structural gap
    priorRepaymentOutcomes: [],
    verificationStatus: { ... }
  },
  productivity: {
    yieldLastSeason: 680,                // kg/acre — decent
    yieldPreviousSeason: 620,
    cropDiversity: 2,
    usesImprovedSeeds: true,
    usesFertilizer: true,
    usesAgrochemicals: false,
    gpsConfirmed: false,                 // KEY GAP — 8 points if confirmed
    farmBoundaryCoordinates: null,
    soilQualityIndex: 72,
    soilDataSource: 'soilgrids',
    verificationStatus: { ... }
  },
  // ... composite score: ~57, gap to Tier 3: 3 points, GPS confirmation = 8 pts
}
```

### Profile 2: Joseph Omondi (Tier 3, established)

Kisii, maize, 3 acres, 4 seasons cooperative member, 2 completed input credit cycles both on-time, GPS confirmed. Score ~68.

### Profile 3: Amina Hassan (Tier 1, new entrant)

Kisii, beans, 1.5 acres, new to Shambapro, no mobile money regularity, no cooperative. Score ~28. High uplift potential — action list shows a clear path to Tier 2.

---

## Neo4j Graph Schema

### Node Types

```
(:Farmer {
  farmerId: String,
  name: String,
  primaryCrop: String,
  farmSizeAcres: Float,
  currentTier: Integer,  // 1-4
  region: String
})

(:Cooperative {
  cooperativeId: String,
  name: String,
  region: String,
  avgRepaymentRate: Float  // Updated as members repay
})

(:Crop {
  cropId: String,
  name: String
})

(:Region {
  regionId: String,
  name: String,
  country: String
})
```

### Relationship Types

```
(Farmer)-[:MEMBER_OF {
  tenureSeasons: Integer,
  repaymentOutcome: String | null  // 'on_time' | 'late' | 'default' | null (new member)
}]->(Cooperative)

(Farmer)-[:GROWS {
  seasons: Integer,
  avgYield: Float
}]->(Crop)

(Cooperative)-[:LOCATED_IN]->(Region)
```

---

*ShambaLadder · Kenya AI Challenge 2025*
