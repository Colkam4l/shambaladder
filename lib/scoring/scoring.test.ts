// lib/scoring/scoring.test.ts — Unit tests for the scoring engine
// Source of truth: scoring-engine.md
// Test oracle: demo farmer profiles in public/demo-data/

import {
  mobileMoneyScore,
  savingsGroupScore,
  cycleScore,
  repaymentScore,
  calculateFinancialScore,
} from './financial';
import {
  yieldScore,
  yieldTrendScore,
  cropDiversityScore,
  calculateProductivityScore,
} from './productivity';
import { calculateClimateScore } from './climate';
import {
  cooperativeTenureScore,
  offtakerTenureScore,
  calculateSocialScore,
} from './social';
import {
  calculateCompletenessPercentage,
  completenessMultiplier,
} from './completeness';
import { determineTier, gapToNextTier } from './tiers';
import { calculateComposite, validateWeights } from './index';
import { DEFAULT_WEIGHTS } from '@/types';

import wanjiku from '../../public/demo-data/wanjiku.json';
import joseph  from '../../public/demo-data/joseph.json';
import amina   from '../../public/demo-data/amina.json';

// ---------------------------------------------------------------------------
// Financial sub-scorers
// ---------------------------------------------------------------------------

describe('mobileMoneyScore', () => {
  it('returns 0 for none',      () => expect(mobileMoneyScore('none')).toBe(0));
  it('returns 8 for irregular', () => expect(mobileMoneyScore('irregular')).toBe(8));
  it('returns 18 for monthly',  () => expect(mobileMoneyScore('monthly')).toBe(18));
  it('returns 25 for weekly',   () => expect(mobileMoneyScore('weekly')).toBe(25));
});

describe('savingsGroupScore', () => {
  it('returns 0 for null',      () => expect(savingsGroupScore(null)).toBe(0));
  it('returns 0 for none',      () => expect(savingsGroupScore('none')).toBe(0));
  it('returns 4 for irregular', () => expect(savingsGroupScore('irregular')).toBe(4));
  it('returns 10 for regular',  () => expect(savingsGroupScore('regular')).toBe(10));
});

describe('cycleScore', () => {
  it('returns 0 for 0 cycles',  () => expect(cycleScore(0)).toBe(0));
  it('returns 12 for 1 cycle',  () => expect(cycleScore(1)).toBe(12));
  it('returns 20 for 2 cycles', () => expect(cycleScore(2)).toBe(20));
  it('returns 25 for 3 cycles', () => expect(cycleScore(3)).toBe(25));
  it('returns 25 for 5 cycles', () => expect(cycleScore(5)).toBe(25));
});

describe('repaymentScore', () => {
  it('returns 0 with 0 cycles', () => expect(repaymentScore([], 0)).toBe(0));
  it('returns 25 for all on-time', () =>
    expect(repaymentScore(['on_time', 'on_time'], 2)).toBe(25));
  it('weights late outcomes at 0.5', () =>
    expect(repaymentScore(['on_time', 'late'], 2)).toBeCloseTo(18.75));
  it('returns 0 for all defaults', () =>
    expect(repaymentScore(['default', 'default'], 2)).toBe(0));
});

// ---------------------------------------------------------------------------
// Productivity sub-scorers
// ---------------------------------------------------------------------------

describe('yieldScore', () => {
  it('returns 0 when yield is null', () =>
    expect(yieldScore(null, null, 'maize')).toBe(0));

  it('uses soil-adjusted score when soilQualityIndex available', () => {
    // 680 / (72 * 12) = 680/864 = 0.787 → 0.787 * 30 = 23.6
    const score = yieldScore(680, 72, 'maize');
    expect(score).toBeCloseTo(23.6, 0);
  });

  it('uses crop fallback when soilQualityIndex is null', () => {
    expect(yieldScore(680, null, 'maize')).toBe(20); // 600-799 → 20pts
    expect(yieldScore(800, null, 'maize')).toBe(30);
    expect(yieldScore(300, null, 'maize')).toBe(0);
  });
});

describe('yieldTrendScore', () => {
  it('returns 0 when yield is null',    () => expect(yieldTrendScore(null, null)).toBe(0));
  it('returns 5 neutral when no prior', () => expect(yieldTrendScore(680, null)).toBe(5));
  it('returns 10 for 10%+ improvement',  () => expect(yieldTrendScore(750, 680)).toBe(10));
  it('returns 7 for stable yield',       () => expect(yieldTrendScore(680, 620)).toBe(7));
  it('returns 3 for declining yield',    () => expect(yieldTrendScore(500, 680)).toBe(3));
});

describe('cropDiversityScore', () => {
  it('returns 5 for 1 crop',  () => expect(cropDiversityScore(1)).toBe(5));
  it('returns 10 for 2 crops', () => expect(cropDiversityScore(2)).toBe(10));
  it('returns 15 for 3+ crops', () => expect(cropDiversityScore(3)).toBe(15));
});

// ---------------------------------------------------------------------------
// Cooperative / Social sub-scorers
// ---------------------------------------------------------------------------

describe('cooperativeTenureScore', () => {
  it('returns 0 for 0 seasons',  () => expect(cooperativeTenureScore(0)).toBe(0));
  it('returns 10 for 1 season',  () => expect(cooperativeTenureScore(1)).toBe(10));
  it('returns 18 for 2 seasons', () => expect(cooperativeTenureScore(2)).toBe(18));
  it('returns 24 for 3 seasons', () => expect(cooperativeTenureScore(3)).toBe(24));
  it('returns 30 for 4 seasons', () => expect(cooperativeTenureScore(4)).toBe(30));
  it('returns 30 for 6 seasons', () => expect(cooperativeTenureScore(6)).toBe(30));
});

describe('offtakerTenureScore', () => {
  it('returns 0 for 0 seasons', () => expect(offtakerTenureScore(0)).toBe(0));
  it('returns 4 for 1 season',  () => expect(offtakerTenureScore(1)).toBe(4));
  it('returns 7 for 2 seasons', () => expect(offtakerTenureScore(2)).toBe(7));
  it('returns 10 for 3 seasons', () => expect(offtakerTenureScore(3)).toBe(10));
});

// ---------------------------------------------------------------------------
// Completeness multiplier
// ---------------------------------------------------------------------------

describe('completenessMultiplier', () => {
  it('returns 0.50 for 0-40%',   () => expect(completenessMultiplier(30)).toBe(0.50));
  it('returns 0.65 for 41-60%',  () => expect(completenessMultiplier(55)).toBe(0.65));
  it('returns 0.80 for 61-75%',  () => expect(completenessMultiplier(70)).toBe(0.80));
  it('returns 0.92 for 76-90%',  () => expect(completenessMultiplier(80)).toBe(0.92));
  it('returns 1.00 for 91-100%', () => expect(completenessMultiplier(95)).toBe(1.00));
});

// ---------------------------------------------------------------------------
// Tier determination
// ---------------------------------------------------------------------------

describe('determineTier', () => {
  it('seedling for score < 40',   () => expect(determineTier(28)).toBe('seedling'));
  it('growing for score 40-59',   () => expect(determineTier(57)).toBe('growing'));
  it('established for score 60-79', () => expect(determineTier(68)).toBe('established'));
  it('trusted for score 80+',     () => expect(determineTier(85)).toBe('trusted'));
  it('boundary: 39 → seedling',   () => expect(determineTier(39)).toBe('seedling'));
  it('boundary: 40 → growing',    () => expect(determineTier(40)).toBe('growing'));
  it('boundary: 80 → trusted',    () => expect(determineTier(80)).toBe('trusted'));
});

describe('gapToNextTier', () => {
  it('shows gap to growing from seedling',       () => {
    const r = gapToNextTier(28);
    expect(r.nextTier).toBe('growing');
    expect(r.gap).toBe(12);
  });
  it('shows null gap when trusted',              () => {
    const r = gapToNextTier(85);
    expect(r.nextTier).toBeNull();
    expect(r.gap).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Weight validation
// ---------------------------------------------------------------------------

describe('validateWeights', () => {
  it('accepts valid weights summing to 1.0', () => {
    expect(() => validateWeights(DEFAULT_WEIGHTS)).not.toThrow();
  });
  it('rejects weights not summing to 1.0', () => {
    expect(() => validateWeights({ ...DEFAULT_WEIGHTS, financial_behaviour: 0.50 })).toThrow();
  });
});

// ---------------------------------------------------------------------------
// End-to-end: Demo farmer composite scores
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toProfile = (json: any) => json;

describe('Demo farmer Wanjiku Kamau', () => {
  const profile = toProfile(wanjiku);
  let score: ReturnType<typeof calculateComposite>;
  beforeAll(() => { score = calculateComposite(profile); });

  it('computes a score in growing tier range (40-59)', () => {
    expect(score.totalScore).toBeGreaterThanOrEqual(40);
    expect(score.totalScore).toBeLessThanOrEqual(59);
  });
  it('tier is growing', () => expect(score.tier).toBe('growing'));
  it('GPS gap is flagged in productivity missing fields', () => {
    expect(score.dimensions.farm_productivity.missingFields).toContain('GPS farm boundary confirmation');
  });
});

describe('Demo farmer Joseph Omondi', () => {
  const profile = toProfile(joseph);
  let score: ReturnType<typeof calculateComposite>;
  beforeAll(() => { score = calculateComposite(profile); });

  // Joseph is a strong farmer — weekly M-Pesa, GPS confirmed, 2 on-time credit cycles,
  // 4 cooperative seasons, full climate practices. Composite engine correctly computes trusted.
  it('computes a score of 80+ (trusted — well-established profile)', () => {
    expect(score.totalScore).toBeGreaterThanOrEqual(80);
  });
  it('tier is trusted', () => expect(score.tier).toBe('trusted'));
});

describe('Demo farmer Amina Hassan', () => {
  const profile = toProfile(amina);
  let score: ReturnType<typeof calculateComposite>;
  beforeAll(() => { score = calculateComposite(profile); });

  it('computes a score in seedling tier range (0-39)', () => {
    expect(score.totalScore).toBeGreaterThanOrEqual(0);
    expect(score.totalScore).toBeLessThanOrEqual(39);
  });
  it('tier is seedling', () => expect(score.tier).toBe('seedling'));
});
