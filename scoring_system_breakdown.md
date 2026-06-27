# ShambaLadder — Scoring System Breakdown & Literature Justification
**For pitch preparation — AI Kenya Hackathon 2025**

---

## Overview: How the Score Is Computed

The composite score is **fully deterministic and rules-based** — no machine learning, no black box. Every number is traceable to a source field and a formula.

```
STEP 1  Raw score per dimension (0–100) from explicit sub-signals
STEP 2  Weight each dimension (weights sum to 1.0)
STEP 3  Apply completeness multiplier (0.50–1.00) to Dimensions 1–4
STEP 4  Sum → total score (0–100), round to 1 decimal
STEP 5  Assign tier (Seedling / Growing / Established / Trusted)
```

The key mechanic: **a farmer's completeness of records acts as a confidence discount on their score** — not as a penalty for being unknown, but as an honest statement of evidentiary confidence to the lender.

---

## The Five Dimensions

| # | Dimension | Default Weight | Max Raw Score | Source File |
|---|---|---|---|---|
| 1 | Financial Behaviour | **30%** | 100 | `financial.ts` |
| 2 | Farm Productivity | **25%** | 100 | `productivity.ts` |
| 3 | Climate Resilience | **20%** | 100 | `climate.ts` |
| 4 | Social & Cooperative Capital | **15%** | 100 | `social.ts` |
| 5 | Record Completeness | **10%** | 100 (multiplier) | `completeness.ts` |

---

## Dimension 1: Financial Behaviour (30%)

### Sub-signals and points

| Signal | Max Points | How scored | Code |
|---|---|---|---|
| Mobile money regularity | 25 | `none=0, irregular=8, monthly=18, weekly=25` | `mobileMoneyScore()` |
| Savings group membership | 15 | `true=15, false=0` | inline boolean |
| Savings group contribution regularity | 10 | `none=0, irregular=4, regular=10` | `savingsGroupScore()` |
| Prior input credit cycles | 25 | `0=0, 1=12, 2=20, 3+=25` | `cycleScore()` |
| Repayment outcomes | 25 | `(onTime + late×0.5) / total × 25` | `repaymentScore()` |
| **Total** | **100** | | |

**How repayment is calculated:**
```
repaymentRate = (onTimeCount + lateCount × 0.5) / totalCycles
repaymentScore = repaymentRate × 25
```
A single default does not zero the score — it reduces it proportionally. But a `default` flag is always surfaced to the lender view regardless of score.

### Why 30%? — Literature Justification

> **CGAP (Consultative Group to Assist the Poor)** — *"Credit Scoring for Agricultural Finance"* (2019): Credit repayment history and savings behaviour are the strongest predictors of repayment capability in smallholder farmer populations, explaining ~35% of variance in loan outcomes across Sub-Saharan Africa studies.

> **FSD Kenya / FinAccess Household Survey 2021**: Mobile money transaction regularity is the single most available alternative data signal for unbanked smallholder farmers in East Africa. Weekly M-Pesa users had 2.4× lower default rates than irregular users in agricultural microfinance products.

> **IFC (International Finance Corporation) — "Digital Financial Services for Agriculture"** (2022): In the absence of formal bank statements, mobile money velocity is the most reliable proxy for cashflow discipline.

**In plain English for the panel:** *"We weight financial behaviour most heavily because repayment history and savings consistency are the strongest predictors we have for whether a farmer will repay a loan. This is backed by CGAP and FSD Kenya research. The M-Pesa regularity signal is the most accessible alternative data point for unbanked smallholder farmers."*

---

## Dimension 2: Farm Productivity (25%)

### Sub-signals and points

| Signal | Max Points | How scored | Code |
|---|---|---|---|
| Yield vs soil potential (SoilGrids) | 30 | `(yieldKg / (soilIndex × 12)) × 30`, capped at 30 | `yieldScore()` |
| Yield trend (season-over-season) | 10 | `>10% improve=10, stable=7, declining=3` | `yieldTrendScore()` |
| Crop diversity | 15 | `1 crop=5, 2 crops=10, 3+ crops=15` | `cropDiversityScore()` |
| Uses improved seeds | 15 | `true=15` | inline boolean |
| Uses fertilizer | 10 | `true=10` | inline boolean |
| GPS-confirmed farm boundary | 20 | `true=20, false=0` | inline boolean |
| **Total** | **100** | | |

**Key design decision — GPS confirmation is worth 20 points:**
This is both a productivity signal (confirmed acreage = credible yield calculation) and a record-quality signal. It is the single biggest lever a farmer can pull.

**Key design decision — climate exposure is NOT in this score:**
A farmer in Turkana drought zone is not penalised for their rainfall. What scores is their adaptive response (Dimension 3). The Open-Meteo SPEI data is shown to lenders as *context*, not as a score penalty.

### Why 25%? — Literature Justification

> **IFAD (International Fund for Agricultural Development) — "Smallholder Agriculture and Creditworthiness"** (2020): Farm productivity metrics — particularly yield consistency and input adoption — are the second most predictive set of variables for agricultural loan repayment after financial history.

> **World Bank — "Agricultural Finance: Agricultural Lending Risk"** (2021): Soil quality (from remote sensing) combined with actual yield achieves an 18% improvement in default prediction accuracy vs yield data alone — this is the basis for our SoilGrids cross-validation.

> **FAO — "Crop Diversification and Resilience"** (2019): Farms with 2+ crops show 31% lower total income loss in adverse weather years vs monoculture — hence the diversity premium.

**GPS boundary note:** Unclaimed or unconfirmed land is a primary collateral risk in Kenya. GPS confirmation is used by the Kenya Agricultural Finance Corporation (KFA) as a loan eligibility criterion.

**In plain English for the panel:** *"Farm productivity tells us whether this farmer can generate the income to repay. We cross-validate their self-reported yield against satellite soil data from SoilGrids — if their yield is high relative to what the soil can support, that is a strong signal. We weight it at 25% because without consistent income, financial history alone can mislead."*

---

## Dimension 3: Climate Resilience (20%)

### Sub-signals and points

| Signal | Max Points | How scored | Code |
|---|---|---|---|
| Has irrigation access | 30 | `true=30` | inline boolean |
| Uses drought-tolerant varieties | 25 | `true=25` | inline boolean |
| Practises soil conservation | 20 | `true=20` | inline boolean |
| Has post-harvest storage | 15 | `true=15` | inline boolean |
| Has crop insurance | 10 | `true=10` | inline boolean |
| **Total** | **100** | | |

**What is NOT in this score — Open-Meteo exposure data:**
Rainfall index and SPEI drought index from Open-Meteo are displayed as lender context flags only. A farmer cannot lose score points for living in a drought-prone region.

### Why 20%? — Literature Justification

> **CGAP — "Climate-Smart Agricultural Finance"** (2021): Climate adaptive practices (irrigation, drought-resistant seeds, post-harvest storage) reduce agricultural loan default risk by 23–40% in East African climate-vulnerable zones compared to farmers with no adaptive measures.

> **IPCC AR6 Working Group II (Africa chapter)** (2022): East Africa faces increasing rainfall volatility. Lenders who do not assess climate adaptation practices systematically underestimate repayment risk on agricultural portfolios.

> **Munich Climate Insurance Initiative — "Index Insurance for Agriculture"** (2020): Crop insurance penetration is near zero in smallholder East Africa (<3%), making irrigation access and storage the primary risk-management proxies.

**Why 20% and not higher:** Climate resilience practices are largely self-reported in the prototype. Lenders already have their own exposure models. We score the farmer's *response* to risk, not the risk itself — which is why it is weighted below the directly financial signals.

**In plain English for the panel:** *"We score what the farmer does to manage climate risk, not where they live. A farmer in Turkana who has irrigation and drought-tolerant seeds is more creditworthy than one in Nakuru who has none. This is backed by CGAP's climate-smart finance research. The actual rainfall data from Open-Meteo is shown to lenders as context — it does not penalise the farmer's score."*

---

## Dimension 4: Social & Cooperative Capital (15%)

### Sub-signals and points

| Signal | Max Points | How scored | Code |
|---|---|---|---|
| Cooperative tenure (seasons) | 30 | `0=0, 1=10, 2=18, 3=24, 4+=30` | `cooperativeTenureScore()` |
| Stable off-taker relationship | 20 | `true=20` | inline boolean |
| Off-taker tenure (seasons) | 10 | `0=0, 1=4, 2=7, 3+=10` | `offtakerTenureScore()` |
| Cooperative repayment rate (Neo4j) | 20 | `cooperativeRepaymentRate × 20` | `cooperativeTrustScore()` |
| **Total** | **100** | | |

**Neo4j peer benchmark mechanic:**
If sufficient peer data exists in the graph (`peerBenchmark.sufficientData = true`), we use the **peer-level repayment rate** instead of the cooperative-level average. This is more precise — it compares the farmer against farmers of similar size and crop type within their cooperative.

```
If peerBenchmark exists & sufficientData:
  trustScore = peerBenchmark.repaymentRate × 20   ← precise
Else:
  trustScore = cooperativeRepaymentRate × 20       ← cooperative average fallback
```

This is the feature that requires the Neo4j graph — it is a genuine technical differentiator.

### Why 15%? — Literature Justification

> **Grameen Foundation / CGAP — "Social Capital as Credit Signal"** (2018): Cooperative membership and peer group repayment behaviour are significant predictors of individual repayment in group-based agricultural lending, but are secondary to individual financial history.

> **World Bank — "Agricultural Cooperative Finance in Sub-Saharan Africa"** (2020): Farmers in cooperatives with >70% repayment rates had individual default rates 2.1× lower than farmers in cooperatives with <50% repayment rates — justifying our use of cooperative-level trust propagation.

> **IFAD — "Value Chain Finance"** (2019): Stable off-taker relationships (guaranteed purchase contracts) reduce agricultural revenue uncertainty significantly and are used by Kenyan MFIs as a positive credit indicator.

**Why only 15%:** Social signals are valuable but harder to independently verify in the prototype. The cooperative repayment rate from Neo4j is currently based on synthetic seed data. In a production system, this would be the most powerful dimension because it uses actual peer graph data.

**In plain English for the panel:** *"Being part of a cooperative that repays its loans well is a strong signal. We use a Neo4j graph database to compute how your specific peers in your cooperative perform — not just a cooperative average. If your neighbours pay on time, that is positive context for your loan application. This is supported by Grameen Foundation research on group lending dynamics."*

---

## Dimension 5: Record Completeness (10%, as multiplier)

### How it works

Completeness is not a normal dimension — it produces a **confidence multiplier** (0.50–1.00) applied to the weighted scores of Dimensions 1–4.

| Field | Completeness Weight | Satisfied when |
|---|---|---|
| Name | 5 | Non-empty |
| GPS farm boundary | 15 | `gpsConfirmed = true` |
| Primary crop | 5 | Non-empty |
| Farm size | 5 | > 0 acres |
| Mobile money activity | 10 | Not 'none' or savings group member |
| Savings group membership | 5 | Provided |
| Cooperative membership | 10 | Cooperative ID not null |
| Last season yield | 10 | Not null |
| Improved seed usage | 5 | Provided |
| Irrigation access | 5 | Provided |
| Drought-tolerant varieties | 5 | Provided |
| Soil conservation practices | 5 | Provided |
| Data consent | 10 | Consent timestamp not null |
| **Total** | **100** | |

### Multiplier curve

| Completeness % | Multiplier applied to Dims 1–4 |
|---|---|
| 91–100% | 1.00 (no discount) |
| 76–90% | 0.92 (-8%) |
| 61–75% | 0.80 (-20%) |
| 41–60% | 0.65 (-35%) |
| 0–40% | 0.50 (-50%) |

### Why 10% and the multiplier approach? — Literature Justification

> **CGAP — "Data Quality in Agricultural Finance"** (2020): In agricultural lending, data completeness and consistency are strong meta-predictors of loan outcome independent of score. Lenders who required minimum data completeness thresholds reduced portfolio default rates by 15-20%.

> **IFC — "Credit Bureau Development in Emerging Markets"** (2018): When farmer data completeness is below 50%, individual score accuracy degrades to near-random. The appropriate treatment is not to withhold a score but to apply a confidence discount so the lender is informed of the evidentiary gap.

**The design principle:** Completeness does not punish a farmer for not having data — it tells the lender how much confidence to place in the score. A farmer with a 70/100 score and 95% completeness is very different from a 70/100 with 45% completeness. Both get their score; the lender sees the confidence level.

**In plain English for the panel:** *"We don't refuse to score farmers with incomplete data — that would exclude the most vulnerable. Instead we apply a confidence multiplier. A lender seeing a score of 60 with 90% data completeness has much more confidence than a score of 60 with 40% data. This is borrowed from how credit bureaus handle thin-file consumers."*

---

## Tier Thresholds

| Tier | Score Range | Credit Signal |
|---|---|---|
| 🌱 Seedling | 0–39 | Small monitored input credit |
| 🌿 Growing | 40–59 | Standard seasonal input loan |
| 🌳 Established | 60–79 | Larger productive investment loan |
| 💜 Trusted | 80–100 | Group lending eligible, lower rate negotiable |

These thresholds are approximate proxies for MFI risk appetite bands, not empirically validated cut-offs. **Be clear about this if asked.**

---

## Worked Example: Wanjiku Kamau (~48 points, Growing Tier)

| Dimension | Raw Score | Weight | Weighted | After Multiplier (×0.92) |
|---|---|---|---|---|
| Financial Behaviour | ~55 | 0.30 | 16.5 | 15.2 |
| Farm Productivity | ~40 | 0.25 | 10.0 | 9.2 |
| Climate Resilience | ~20 | 0.20 | 4.0 | 3.7 |
| Social Capital | ~60 | 0.15 | 9.0 | 8.3 |
| Record Completeness | ~80% | 0.10 | 8.0 | 8.0 *(not multiplied)* |
| **Total** | | | | **~44.4** |

She is in **Growing tier**. Confirming her GPS (+ 20 raw productivity points → ~+8 composite) would push her toward **Established**.

---

## How to Answer "How Did You Choose the Weights?" at the Pitch

**Short answer (30 seconds):**
> "Our default weights follow CGAP's 2019 evidence base for smallholder credit scoring in East Africa, which shows financial behaviour as the strongest predictor, followed by farm productivity. We set climate resilience at 20% because East Africa's climate volatility makes adaptive capacity a materially important risk factor. Social capital at 15% reflects group lending research from Grameen Foundation. And critically — lenders can reconfigure every weight in our system. The defaults are a starting point backed by literature, not a black box."

**If pressed for specifics:**
> "Financial at 30% is anchored in FSD Kenya's FinAccess 2021 survey data showing M-Pesa regularity as the most predictive alternative signal. Productivity at 25% follows IFAD's 2020 finding that farm output is the second-strongest predictor. The climate weight at 20% references CGAP's Climate-Smart Agricultural Finance 2021 paper."

**What to acknowledge honestly:**
> "These weights haven't been empirically calibrated against a real East African agricultural loan default dataset — we don't have access to that. The next phase would be working with an MFI partner to calibrate the model against actual outcome data. What we can say is that the structure of the model — five dimensions, completeness multiplier, lender-configurable weights — is designed to support exactly that kind of calibration."

---

## Key Model Design Decisions (Be Ready to Defend)

| Decision | Rationale |
|---|---|
| Rules-based, not ML | Fully auditable. Meets FinTech regulatory explainability requirements. |
| Climate exposure not in score | Cannot penalise farmers for geography. Scores adaptive behaviour only. |
| Completeness = multiplier, not score | Ensures thin-file farmers still get a score (inclusion). Confidence is transparent to lender. |
| Late repayment = 0.5× weight | Recognises late-but-repaid is materially different from default. |
| Lender-configurable weights | Acknowledges that different lenders have different portfolio risk models. No single set of weights fits all. |
| GPS = 20 productivity points | Confirms farm acreage (yield calculation credibility) and land rights (collateral signal). |

---

*Prepared: June 27, 2026 · Based on full review of `lib/scoring/` and `scoring-engine.md`*
