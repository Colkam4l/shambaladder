// types/index.ts — All shared TypeScript types and enums
// ShambaLadder · Kenya AI Challenge 2025
// Source of truth: data-model.md

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

export interface GPSCoordinates {
  latitude: number;
  longitude: number;
}

// ---------------------------------------------------------------------------
// Verification
// ---------------------------------------------------------------------------

export type VerificationStatus =
  | 'verified'       // Confirmed from third-party source (coop records, MNO)
  | 'self_reported'  // Provided by farmer, not independently confirmed
  | 'third_party'    // Auto-populated from Open-Meteo, SoilGrids
  | 'graph_derived'  // Computed from Neo4j graph
  | 'missing';       // Field not provided

export interface VerificationFlag {
  field: string;
  status: VerificationStatus;
  source: string;
  note?: string;
}

// ---------------------------------------------------------------------------
// Dimension names
// ---------------------------------------------------------------------------

export type DimensionName =
  | 'financial_behaviour'
  | 'farm_productivity'
  | 'climate_resilience'
  | 'social_coop_capital'
  | 'record_completeness';

// ---------------------------------------------------------------------------
// Credit Tier
// ---------------------------------------------------------------------------

export type CreditTier = 'seedling' | 'growing' | 'established' | 'trusted';

export const TIER_THRESHOLDS = {
  seedling:    { min: 0,  max: 39  },
  growing:     { min: 40, max: 59  },
  established: { min: 60, max: 79  },
  trusted:     { min: 80, max: 100 },
} as const;

export const TIER_DISPLAY: Record<CreditTier, { label: string; creditSignal: string; color: string }> = {
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
};

// ---------------------------------------------------------------------------
// Dimension Weights
// ---------------------------------------------------------------------------

export interface DimensionWeights {
  financial_behaviour: number;   // Default: 0.30
  farm_productivity: number;     // Default: 0.25
  climate_resilience: number;    // Default: 0.20
  social_coop_capital: number;   // Default: 0.15
  record_completeness: number;   // Default: 0.10
}

export const DEFAULT_WEIGHTS: DimensionWeights = {
  financial_behaviour: 0.30,
  farm_productivity:   0.25,
  climate_resilience:  0.20,
  social_coop_capital: 0.15,
  record_completeness: 0.10,
};

// ---------------------------------------------------------------------------
// Peer Benchmark (Neo4j)
// ---------------------------------------------------------------------------

export interface PeerBenchmarkResult {
  cooperativeId: string;
  cooperativeName: string;
  peerCount: number;
  onTimeCount: number;
  lateCount: number;
  defaultCount: number;
  avgPeerTier: number;
  repaymentRate: number;
  displayString: string;
  sufficientData: boolean;
}

// ---------------------------------------------------------------------------
// Farmer Input Blocks
// ---------------------------------------------------------------------------

export interface FinancialInputs {
  mobileMoneyRegularity: 'none' | 'irregular' | 'monthly' | 'weekly';
  mobileMoneyMonthlyVolume: number | null;
  savingsGroupMember: boolean;
  savingsGroupContributionRegularity: 'none' | 'irregular' | 'regular' | null;
  priorInputCreditCycles: number;
  priorRepaymentOutcomes: ('on_time' | 'late' | 'default')[];
  verificationStatus: {
    mobileMoneyRegularity: VerificationStatus;
    savingsGroupMember: VerificationStatus;
    priorRepaymentOutcomes: VerificationStatus;
  };
}

export interface ProductivityInputs {
  yieldLastSeason: number | null;
  yieldPreviousSeason: number | null;
  cropDiversity: number;
  usesImprovedSeeds: boolean;
  usesFertilizer: boolean;
  usesAgrochemicals: boolean;
  gpsConfirmed: boolean;
  farmBoundaryCoordinates: GPSCoordinates[] | null;
  soilQualityIndex: number | null;
  soilDataSource: 'soilgrids' | null;
  verificationStatus: {
    yieldLastSeason: VerificationStatus;
    gpsConfirmed: VerificationStatus;
    soilQualityIndex: VerificationStatus;
  };
}

export interface ClimateInputs {
  rainfallIndexLastSeason: number | null;
  droughtIndexLastSeason: number | null;
  climateRiskLevel: 'low' | 'medium' | 'high' | null;
  hasIrrigationAccess: boolean;
  usesDroughtTolerantVarieties: boolean;
  practisesSoilConservation: boolean;
  hasPostHarvestStorage: boolean;
  hasCropInsurance: boolean;
  verificationStatus: {
    rainfallIndexLastSeason: VerificationStatus;
    adaptivePractices: VerificationStatus;
  };
}

export interface SocialInputs {
  cooperativeId: string | null;
  cooperativeName: string | null;
  cooperativeMemberSinceSeasons: number;
  hasStableOfftaker: boolean;
  offtakerSeasons: number;
  peerBenchmark: PeerBenchmarkResult | null;
  cooperativeRepaymentRate: number | null;
  verificationStatus: {
    cooperativeMembership: VerificationStatus;
    offtakerRelationship: VerificationStatus;
    peerBenchmark: VerificationStatus;
  };
}

export interface CompletenessInputs {
  shamboproProfileComplete: boolean;
  gpsConfirmed: boolean;
  entryConsistencyScore: number;
  internalConsistencyScore: number;
  completenessPercentage: number;
}

// ---------------------------------------------------------------------------
// Farmer Profile (top-level entity)
// ---------------------------------------------------------------------------

export interface FarmerProfile {
  farmerId: string;
  name: string;
  location: GPSCoordinates;
  region: 'kenya' | 'uganda' | 'rwanda';
  primaryCrop: string;
  farmSizeAcres: number;
  currentSeason: string;
  financial: FinancialInputs;
  productivity: ProductivityInputs;
  climate: ClimateInputs;
  social: SocialInputs;
  completeness: CompletenessInputs;
  createdAt: string;
  lastUpdatedAt: string;
  consentGrantedAt: string;
  marketplaceConsent: boolean; // Platform-level consent: profile visible in lender marketplace
  sharedProfiles: SharedProfile[];
}

// ---------------------------------------------------------------------------
// Scoring Types
// ---------------------------------------------------------------------------

export interface DimensionScore {
  dimension: DimensionName;
  rawScore: number;
  weight: number;
  weightedScore: number;
  completenessMultiplier: number;
  adjustedScore: number;
  missingFields: string[];
  verificationFlags: VerificationFlag[];
}

export interface CompositeScore {
  totalScore: number;
  tier: CreditTier;
  dimensions: Record<DimensionName, DimensionScore>;
  weights: DimensionWeights;
  computedAt: string;
}

// ---------------------------------------------------------------------------
// Explanation Types
// ---------------------------------------------------------------------------

export interface DimensionExplanation {
  dimension: DimensionName;
  explanation: string;
  keyStrength: string | null;
  keyGap: string | null;
}

export interface ScoredAction {
  rank: number;
  action: string;
  estimatedScoreImpact: number;
  targetDimension: DimensionName;
  effort: 'quick' | 'medium' | 'hard';
}

export interface ExplanationResponse {
  farmerId: string;
  compositeExplanation: string;
  tierExplanation: string;
  dimensions: Record<DimensionName, DimensionExplanation>;
  actionList: ScoredAction[];
  computedAt: string;
}

// ---------------------------------------------------------------------------
// Share Profile
// ---------------------------------------------------------------------------

export interface SharedProfile {
  shareId: string;
  farmerId: string;
  lenderName: string | null;
  sharedAt: string;
  expiresAt: string | null;
  scoreSnapshot: CompositeScore;
  explanationSnapshot: ExplanationResponse;
  profileSnapshot: FarmerProfile;
}

// ---------------------------------------------------------------------------
// API Shapes
// ---------------------------------------------------------------------------

export interface ScoreRequest {
  profile: FarmerProfile;
  weights?: DimensionWeights;
}

export interface ScoreResponse {
  score: CompositeScore;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    field?: string;
  };
}
