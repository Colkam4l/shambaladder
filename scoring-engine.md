# scoring-engine.md — Scoring Engine Specification
# ShambaLadder · Kenya AI Challenge 2025

## Purpose
Defines the exact scoring formula for every dimension. Every number in this document is the authoritative calculation. The TypeScript implementation must produce identical results. This document is the test oracle.

---

## Design Principles

1. **Rules-based, not ML.** Fully auditable. No black box. Appropriate for a financially regulated context.
2. **No geography penalty.** A farmer in a high-risk drought zone is not penalised for their location. Climate exposure is a lender context flag. What scores is the adaptive response.
3. **Completeness as confidence multiplier.** Record Completeness does not add points — it discounts other dimensions for low-completeness profiles.
4. **Lender-configurable weights.** Default weights reflect CGAP evidence. Lenders can reconfigure per portfolio context. Weights must sum to 1.0.

---

## Dimension 1: Financial Behaviour (Default Weight: 0.30)

### What this measures
Mobile money transaction regularity, savings group participation, and — most importantly — prior input credit repayment history via cooperative.

### Input fields

| Field | Type | Max Points | Notes |
|---|---|---|---|
| `mobileMoneyRegularity` | enum | 25 | none=0, irregular=8, monthly=18, weekly=25 |
| `savingsGroupMember` | boolean | 15 | true=15, false=0 |
| `savingsGroupContributionRegularity` | enum | 10 | null/none=0, irregular=4, regular=10 |
| `priorInputCreditCycles` | number | 25 | 0=0, 1=12, 2=20, 3+=25 |
| `priorRepaymentOutcomes` | array | 25 | See repayment scoring below |

**Total: 100 points**

### Mobile money regularity scoring
```
none      → 0
irregular → 8
monthly   → 18
weekly    → 25
```

### Repayment outcome scoring
```
If priorInputCreditCycles === 0: repayment score = 0

Otherwise:
  onTimeCount = count of 'on_time' in priorRepaymentOutcomes
  lateCount = count of 'late' in priorRepaymentOutcomes
  defaultCount = count of 'default' in priorRepaymentOutcomes
  total = priorInputCreditCycles

  repaymentRate = (onTimeCount + (lateCount * 0.5)) / total
  repaymentScore = repaymentRate * 25

  Note: 'default' outcomes do not contribute any points and trigger a
  lender-visible flag regardless of overall score.
```

### Financial score formula
```
financialRawScore =
  mobileMoneySCore(mobileMoneyRegularity) +
  (savingsGroupMember ? 15 : 0) +
  savingsGroupScore(savingsGroupContributionRegularity) +
  cycleScore(priorInputCreditCycles) +
  repaymentScore(priorRepaymentOutcomes, priorInputCreditCycles)
```

---

## Dimension 2: Farm Productivity (Default Weight: 0.25)

### What this measures
Shambapro yield records, crop diversity, input quality, and GPS boundary confirmation. Cross-validated against SoilGrids soil quality.

### Input fields

| Field | Type | Max Points | Notes |
|---|---|---|---|
| `yieldLastSeason` vs soil potential | number | 30 | Yield as % of SoilGrids potential |
| `yieldTrend` | computed | 10 | yieldLastSeason vs yieldPreviousSeason |
| `cropDiversity` | number | 15 | 1=5, 2=10, 3+=15 |
| `usesImprovedSeeds` | boolean | 15 | true=15 |
| `usesFertilizer` | boolean | 10 | true=10 |
| `gpsConfirmed` | boolean | 20 | true=20, false=0 — significant gap signaler |

**Total: 100 points**

### Yield vs soil potential scoring
```
If yieldLastSeason is null: yieldScore = 0

If soilQualityIndex is not null:
  // SoilGrids gives quality 0-100. Estimate potential yield from quality.
  estimatedPotentialYield = soilQualityIndex * 12  // kg/acre (rough heuristic)
  yieldPotentialRatio = yieldLastSeason / estimatedPotentialYield
  yieldScore = min(yieldPotentialRatio * 30, 30)

If soilQualityIndex is null:
  // Fallback: absolute yield score by crop type
  // Maize: 400 kg/acre = 10pts, 600 = 20pts, 800+ = 30pts
  // Use crop-specific lookup table defined in scoring-engine constants
  yieldScore = cropsYieldScore(primaryCrop, yieldLastSeason)
```

### Yield trend scoring
```
If yieldPreviousSeason is null: trendScore = 5 (neutral)

trend = (yieldLastSeason - yieldPreviousSeason) / yieldPreviousSeason
if trend >= 0.1:  trendScore = 10  // 10%+ improvement
if 0 <= trend < 0.1: trendScore = 7  // stable
if trend < 0: trendScore = 3  // declining
```

### Productivity score formula
```
productivityRawScore =
  yieldScore +
  trendScore +
  cropDiversityScore(cropDiversity) +
  (usesImprovedSeeds ? 15 : 0) +
  (usesFertilizer ? 10 : 0) +
  (gpsConfirmed ? 20 : 0)
```

---

## Dimension 3: Climate Resilience (Default Weight: 0.20)

### Design note
Climate exposure (rainfall, drought index from Open-Meteo) is a **lender context flag only**. It does NOT enter the composite score. A farmer cannot be penalised for living in a drought-prone area.

What enters the composite score: the farmer's **adaptive response**.

### Input fields (adaptive practices — these are scored)

| Field | Type | Max Points | Notes |
|---|---|---|---|
| `hasIrrigationAccess` | boolean | 30 | true=30 |
| `usesDroughtTolerantVarieties` | boolean | 25 | true=25 |
| `practisesSoilConservation` | boolean | 20 | true=20 |
| `hasPostHarvestStorage` | boolean | 15 | true=15 |
| `hasCropInsurance` | boolean | 10 | true=10 |

**Total: 100 points**

### Context flags (lender view only — not in composite)

```typescript
interface ClimateContextFlag {
  rainfallIndexLastSeason: number;      // From Open-Meteo
  droughtIndexLastSeason: number;       // SPEI score
  climateRiskLevel: 'low' | 'medium' | 'high';
  // Derived: if SPEI < -1.0 → high, -1.0 to -0.5 → medium, > -0.5 → low
}
```

Lender view displays: "This farm is in a [high/medium/low] climate risk zone. Farmer's adaptive response score: [N]/100."

### Climate score formula
```
climateRawScore =
  (hasIrrigationAccess ? 30 : 0) +
  (usesDroughtTolerantVarieties ? 25 : 0) +
  (practisesSoilConservation ? 20 : 0) +
  (hasPostHarvestStorage ? 15 : 0) +
  (hasCropInsurance ? 10 : 0)
```

---

## Dimension 4: Social & Cooperative Capital (Default Weight: 0.15)

### What this measures
Cooperative membership tenure, off-taker relationship stability, and — from Neo4j — peer repayment benchmarks and cooperative trust propagation.

### Input fields

| Field | Type | Max Points | Notes |
|---|---|---|---|
| `cooperativeMemberSinceSeasons` | number | 30 | 0=0, 1=10, 2=18, 3=24, 4+=30 |
| `hasStableOfftaker` | boolean | 20 | true=20 |
| `offtakerSeasons` | number | 10 | 0=0, 1=4, 2=7, 3+=10 |
| `cooperativeRepaymentRate` | number | 20 | From Neo4j cooperative node. rate * 20 |
| `peerBenchmark (if available)` | derived | 20 | peerRepaymentRate * 20 |

**Total: 100 points**

### Cooperative tenure scoring
```
0 seasons  → 0
1 season   → 10
2 seasons  → 18
3 seasons  → 24
4+ seasons → 30
```

### Cooperative trust propagation (for new members)
```
If cooperativeMemberSinceSeasons === 0:
  cooperativeTrustScore = 0

If cooperativeMemberSinceSeasons >= 1 AND peerBenchmark is null:
  // Use cooperative-level repayment rate from Neo4j cooperative node
  cooperativeTrustScore = cooperativeRepaymentRate * 20

If peerBenchmark is not null AND peerBenchmark.sufficientData:
  // Use peer-level repayment rate (more precise than cooperative average)
  cooperativeTrustScore = peerBenchmark.repaymentRate * 20
```

### Social score formula
```
socialRawScore =
  cooperativeTenureScore(cooperativeMemberSinceSeasons) +
  (hasStableOfftaker ? 20 : 0) +
  offtakerTenureScore(offtakerSeasons) +
  cooperativeTrustScore +
  peerBenchmarkScore
```

---

## Dimension 5: Record Completeness (Default Weight: 0.10)

### Design note
Record Completeness is a **confidence multiplier**, not a standalone score. It produces a multiplier (0.5–1.0) that is applied to the weighted scores of all other dimensions.

A farmer with a score of 70 but only 50% profile completeness will see their adjusted total reduced. The lender view shows both the raw and adjusted score.

### Completeness percentage calculation

Each field has a completeness weight. Total = 100.

| Field | Weight | Satisfied when |
|---|---|---|
| `name` | 5 | Not empty |
| `location` (GPS) | 15 | `gpsConfirmed = true` |
| `primaryCrop` | 5 | Not empty |
| `farmSizeAcres` | 5 | > 0 |
| `mobileMoneyRegularity` | 10 | Not 'none' (or explicitly 'none' with savingsGroupMember=true) |
| `savingsGroupMember` | 5 | Provided |
| `cooperativeId` | 10 | Not null |
| `yieldLastSeason` | 10 | Not null |
| `usesImprovedSeeds` | 5 | Provided |
| `hasIrrigationAccess` | 5 | Provided |
| `usesDroughtTolerantVarieties` | 5 | Provided |
| `practisesSoilConservation` | 5 | Provided |
| `consentGrantedAt` | 10 | Not null |
| **Total** | **100** | |

### Completeness multiplier curve

```
completenessPercentage → multiplier
0-40%    → 0.50
41-60%   → 0.65
61-75%   → 0.80
76-90%   → 0.92
91-100%  → 1.00
```

### Record Completeness dimension score (for Dimension 5 display)
The dimension score shown to the farmer is simply `completenessPercentage` (0-100), not the multiplier. The multiplier is applied internally.

---

## Composite Score Formula

```
Step 1: Calculate raw scores for dimensions 1-4 (0-100 each)
Step 2: Calculate completeness percentage and multiplier
Step 3: Apply weights and completeness multiplier

For each dimension d in [financial, productivity, climate, social]:
  weightedScore[d] = rawScore[d] * weights[d]
  adjustedScore[d] = weightedScore[d] * completenessMultiplier

totalScore = sum(adjustedScore[d] for d in [financial, productivity, climate, social])
           + (completenessRawScore * weights.record_completeness)
           // completeness dimension itself is NOT multiplied by the multiplier

totalScore = round(totalScore, 1)  // One decimal place
tier = determineTier(totalScore)
```

### Tier determination
```
0-39   → 'seedling'
40-59  → 'growing'
60-79  → 'established'
80-100 → 'trusted'
```

---

## Score Impact Estimation (for Action List)

The LLM explanation engine uses these pre-computed score-impact values when generating the action list.

| Action | Target Dimension | Estimated Score Impact | Conditions |
|---|---|---|---|
| Confirm GPS farm boundary | Farm Productivity | +8 pts typical | gpsConfirmed = false |
| Join a savings group | Financial Behaviour | +15 pts | savingsGroupMember = false |
| Contribute regularly to existing savings group | Financial Behaviour | +6 pts | savingsGroupContributionRegularity = 'irregular' |
| Complete mobile money profile | Financial Behaviour | +10 pts | mobileMoneyRegularity = 'none' |
| Use M-Pesa for regular transactions | Financial Behaviour | +10 pts | mobileMoneyRegularity = 'irregular' |
| Use drought-tolerant varieties | Climate Resilience | +8 pts | usesDroughtTolerantVarieties = false |
| Practise soil conservation | Climate Resilience | +6 pts | practisesSoilConservation = false |
| Install post-harvest storage | Climate Resilience | +5 pts | hasPostHarvestStorage = false |
| Complete Shambapro profile | Record Completeness | +5-15 pts | Varies by missing fields |
| Join a cooperative | Social Capital | +10 pts | cooperativeId = null |
| Complete first input credit cycle | Financial Behaviour | +12 pts | priorInputCreditCycles = 0 |
| Maintain on-time repayment | Financial Behaviour | +25 pts | priorRepaymentOutcomes = [] |

---

## Validation Rules

The scoring engine must reject input with:
- `weights` that do not sum to 1.0 (tolerance: ±0.001)
- `farmSizeAcres` < 0 or > 100
- `priorInputCreditCycles` inconsistent with `priorRepaymentOutcomes.length`
- Any required field missing from the schema

---

*ShambaLadder · Kenya AI Challenge 2025*
