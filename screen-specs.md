# screen-specs.md — Screen Specifications
# ShambaLadder · Kenya AI Challenge 2025

## Purpose
Specifies the layout, components, data, and interaction behaviour of every screen. Written for AI coding agents. All values are exact. Reference `design-system.md` for all token names.

## Hackathon Tier Legend
- 🟢 HACKATHON CORE — Must be built. Demo fails without it.
- 🟡 HACKATHON NICE — Include if time allows.
- 🔴 POST-HACKATHON — Do not build.

---

## Screen Inventory

| Screen ID | Name | Route | Tier |
|---|---|---|---|
| DEMO-01 | Demo Landing | `/demo` | 🟢 |
| DEMO-02 | Demo Farmer View | `/demo/[farmerId]` | 🟢 |
| FARM-01 | Farmer Dashboard | `/dashboard` | 🟢 |
| FARM-02 | Action List | `/actions` | 🟢 |
| FARM-03 | Score Detail | `/score/[dimension]` | 🟡 |
| FARM-04 | Share Profile | `/share` | 🟢 |
| LEND-01 | Lender Scorecard | `/lender/scorecard/[token]` | 🟢 |
| LEND-02 | Weight Configuration | `/lender/configure` | 🟡 |
| ONB-01 | Onboarding — Basic Info | `/onboarding/1` | 🟡 |
| ONB-02 | Onboarding — Financial | `/onboarding/2` | 🟡 |
| ONB-03 | Onboarding — Productivity | `/onboarding/3` | 🟡 |
| ONB-04 | Onboarding — Climate | `/onboarding/4` | 🟡 |
| ONB-05 | Onboarding — Consent | `/onboarding/5` | 🟡 |

---

## DEMO-01 — Demo Landing

**Route:** `/demo`
**Hackathon tier:** 🟢
**Purpose:** Entry point for judges. Shows 3 demo farmer profiles. No login required.

### Layout
Full-page centered layout. No sidebar. No navigation.

Top: ShambaLadder wordmark + "Kenya AI Challenge 2025" badge.

Heading: "Meet our farmers" — `--text-display` size, `--color-text-primary`.

Subheading: "Each profile runs the live scoring engine and AI explanation system. No mock data." — `--text-body`, `--color-text-secondary`.

Three farmer profile cards arranged horizontally on desktop, vertically stacked on mobile. Each card (see Card component):
- Farmer avatar (initials circle, `--color-accent` background)
- Farmer name (`--text-heading`)
- Location and primary crop (`--text-body-sm`, `--color-text-secondary`)
- Tier badge (Seedling/Growing/Established colour-coded)
- Score number (large, `--text-display-sm`)
- One-sentence summary of their situation
- "View profile" button (primary, full-width)

Below cards: "Or enter your own farm data →" link to `/onboarding/1`.

### Interactions
- Click any farmer card or "View profile" → navigate to `/demo/[farmerId]`
- "Enter your own data" → navigate to `/onboarding/1`

### Demo Farmer Card Data

**Card 1: Wanjiku Kamau**
- Region: Kisii, Kenya
- Crop: Maize | 2.5 acres
- Tier: Growing (Tier 2)
- Score: 57
- Summary: "Strong savings record. GPS confirmation would move her to Established."

**Card 2: Joseph Omondi**
- Region: Kisii, Kenya
- Crop: Maize | 3 acres
- Tier: Established (Tier 3)
- Score: 68
- Summary: "4 seasons in Kisii Cooperative, 2 on-time credit cycles."

**Card 3: Amina Hassan**
- Region: Kisii, Kenya
- Crop: Beans | 1.5 acres
- Tier: Seedling (Tier 1)
- Score: 28
- Summary: "New entrant. Clear path to Tier 2 shown in her action list."

### Notes
The scores shown on the cards are computed by the live scoring engine at page load, not hardcoded. They should match the values above given the demo data. If they drift, something is wrong in the scoring engine.

---

## DEMO-02 — Demo Farmer View

**Route:** `/demo/[farmerId]`
**Hackathon tier:** 🟢
**Purpose:** Full farmer dashboard for a demo profile, plus toggle to lender view.

### Layout
Same as FARM-01 (Farmer Dashboard) with one addition:

A toggle bar at the very top of the page (above the dashboard content):
- Left option: "Farmer View" (active by default)
- Right option: "Lender View"

Toggle is a segmented control, not a tab. Switching to "Lender View" renders the LEND-01 content inline on the same page (same URL, different render).

Back link: "← Demo Home" at top left.

### Interactions
- "Farmer View" active: renders FARM-01 content
- "Lender View" active: renders LEND-01 content for the same farmer
- "← Demo Home": navigate to `/demo`
- All other interactions identical to FARM-01 and LEND-01

---

## FARM-01 — Farmer Dashboard

**Route:** `/dashboard` (also rendered in `/demo/[farmerId]`)
**Hackathon tier:** 🟢
**Primary device:** Mobile (360px+), responsive up to desktop

### Layout

**Header section:**
- Farmer name (`--text-heading`)
- Location string ("Kisii, Kenya") (`--text-body-sm`, `--color-text-secondary`)
- Tier badge — prominent, colour-coded (see design system tier colours)

**Score hero section:**
- Large score number (e.g. "57") — `--text-display`, `--color-text-primary`
- Label: "Credit Readiness Score" — `--text-body-sm`, `--color-text-tertiary`
- Tier progress bar: horizontal bar showing score position within current tier range and gap to next tier
  - e.g. for score 57 in "Growing" (40-59): bar fills to 85% of the Growing range
  - Next tier marker shows: "3 points to Established"
  - Bar uses `--color-tier-growing` fill

**AI explanation banner:**
- Lightly tinted card (`--color-accent-subtle` background)
- LLM-generated 2-3 sentence composite explanation
- Label: "AI explanation" in small text — `--text-body-xs`, `--color-text-tertiary`
- Disclaimer (small): "Speak to a Shambapro advisor before making finance or planting decisions."

**Five dimension score cards:**
One card per dimension, stacked vertically. Each card:
- Dimension name (`--text-subheading`)
- Weight label ("30% of score") (`--text-body-xs`, `--color-text-tertiary`)
- Score bar: horizontal, 0-100, filled to dimension rawScore
- Score number: e.g. "64/100"
- Verification badge row: small badges for each field (Verified / Self-reported / Missing)
- LLM-generated dimension explanation: 2 sentences, `--text-body-sm`
- "See details" link (🟡 — links to FARM-03)

Dimension display order: Financial Behaviour, Farm Productivity, Climate Resilience, Social Capital, Record Completeness.

**Bottom CTA section:**
- Primary button: "See my action plan" → `/actions`
- Secondary button: "Share with a lender" → `/share`

### Components used
TierBadge, ScoreHero, ProgressBar, AIExplanationBanner, DimensionCard, VerificationBadge, Button (primary, secondary)

### Data displayed
- `farmer.name`, `farmer.location`, `farmer.region`
- `compositeScore.totalScore`
- `compositeScore.tier`
- `compositeScore.dimensions[each]` — score, weight, verificationFlags
- `explanationResponse.compositeExplanation`
- `explanationResponse.dimensions[each].explanation`

### UI States

**Loading:**
- Score hero: large skeleton placeholder (80px height)
- Dimension cards: 5 skeleton cards
- AI banner: skeleton block 3 lines

**Populated:** Default state as described.

**Error (scoring failed):**
- Alert banner: "We couldn't calculate your score. Please check your connection and try again."
- Retry button

**Error (LLM explanation failed):**
- Dimension cards still render with scores
- AI explanation banner shows: "Explanation unavailable. Your score and breakdown above are accurate."
- Lender view still fully functional — this is a graceful degradation only in the farmer-facing explanation

### Responsive behaviour
**Mobile (360-767px):** Single column. Dimension cards stacked. Score hero above fold.
**Desktop (768px+):** Two-column layout. Score hero + AI banner on left. Dimension cards on right (2-column grid within the right panel).

---

## FARM-02 — Action List

**Route:** `/actions`
**Hackathon tier:** 🟢

### Layout

Header: "Your action plan" + back arrow to `/dashboard`

Subheading: "These specific steps will improve your credit score. Ranked by impact." (`--text-body`, `--color-text-secondary`)

Score impact summary bar: "Complete all actions → estimated score: [total + sum of all impacts]" — shown in `--color-tier-[next tier]` colour if actions would push to next tier.

Action list: Ranked list, rank 1 at top.

Each action card:
- Rank number in circle (e.g. "1")
- Action title (`--text-subheading`)
- Target dimension tag (e.g. "Farm Productivity") — small badge
- Effort level: "Quick" / "Medium" / "Hard" — colour-coded badge
  - Quick = green (`--color-success-bg`, `--color-success-text`)
  - Medium = amber (`--color-warning-bg`, `--color-warning-text`)
  - Hard = blue (`--color-accent-subtle`, `--color-accent`)
- Estimated score impact: "+8 points" — displayed prominently in accent colour
- Full action description: 1-2 sentences specific to this farmer's situation
- Completion checkbox (optimistic UI — stores in localStorage)

**Completed actions:** Appear at the bottom of the list, checked, visually muted.

### Interactions
- Check action → move to "Completed" section, update local state
- "Complete all" → check all and show celebration state
- Click target dimension tag → navigate to `/score/[dimension]` (🟡)

### Data displayed
`explanationResponse.actionList` — full array, sorted by `rank`

---

## FARM-04 — Share Profile

**Route:** `/share`
**Hackathon tier:** 🟢

### Layout

**Step 1: What you're sharing**

Header: "Share your credit profile"
Subheading: "You control who sees your data."

Consent summary card:
- "The lender will see:"
- Checklist: Score and tier ✓, Dimension breakdown ✓, Verification status ✓, Peer context from your cooperative ✓
- "The lender will NOT see:"
- Checklist: Your mobile money account ✗, Your cooperative login ✗, Any data you haven't provided ✗

Input: "Lender or institution name (optional)" — text field

Button: "Generate share link" (primary)

**Step 2: Share link generated**

Success state:
- "Your profile is ready to share"
- Copyable link: `shambaladder.com/lender/scorecard/[token]`
- Copy button
- QR code (🟡 — nice for hackathon demo, use a QR library)
- "This link shows a snapshot of your score as of today. You can revoke access at any time."
- "Back to dashboard" link

### Interactions
- "Generate share link" → POST `/api/share` → returns `shareId` → display Step 2
- "Copy link" → copy to clipboard, button text changes to "Copied!" for 2s
- "Back to dashboard" → navigate to `/dashboard`

---

## LEND-01 — Lender Scorecard

**Route:** `/lender/scorecard/[token]`
**Hackathon tier:** 🟢

### Layout

**Lender disclaimer banner** (top, sticky, cannot be dismissed):
- Amber background (`--color-warning-bg`)
- Text: "ShambaLadder is decision support. All credit decisions remain with your institution."
- This banner must be visible in any screenshot/recording of the lender view.

**Farmer summary header:**
- Farmer name
- Location | Crop | Farm size
- Tier badge
- "Shared by farmer on [date]" — `--text-body-xs`, `--color-text-tertiary`
- "Download profile" button (🟡 — triggers print dialog with print-optimised styles)

**Composite score section:**
- Score number (large)
- Tier label
- Score breakdown: "Score calculated with default weights. [Configure weights →]" link

**Neo4j peer benchmark section** (shown only if `peerBenchmark.sufficientData = true`):
Card with distinct treatment (`--color-accent-subtle` background, left border `--color-accent`):
- Label: "Cooperative peer context (powered by Neo4j)" — `--text-body-xs`, `--color-text-tertiary`
- Main statement: "19 of 23 farmers with a similar profile in Kisii Cooperative repaid on time." — `--text-subheading`
- Sub-stats: "Peer group: maize farmers, 2-4 acres | Average peer tier: Growing"
- Visual: horizontal bar showing repayment rate (e.g. 83% filled)

**Peer benchmark cold-start state** (shown if `peerBenchmark.sufficientData = false`):
Same card position but:
- "Insufficient peer data"
- "Peer benchmarking is available once 10 or more farmers with a similar profile have completed a full lending cycle in this cooperative."

**Dimension breakdown table:**

| Dimension | Score | Weight | Weighted | Verification |
|---|---|---|---|---|
| Financial Behaviour | 64 | 30% | 19.2 | Partial |
| Farm Productivity | 55 | 25% | 13.75 | Partial |
| Climate Resilience | 60 | 20% | 12.0 | Self-reported |
| Social Capital | 45 | 15% | 6.75 | Partial |
| Record Completeness | 71% | — | ×0.92 | App-generated |

Each dimension row expands (accordion) to show per-field verification status:
- Field name
- Value provided
- Verification source badge (colour-coded)
- Note (e.g. "Yield cross-validated against SoilGrids soil quality for this GPS location")

**Climate context section** (lender-only):
Separate from the dimension score — this is exposure, not farmer performance.
- Climate risk level: Low / Medium / High (with icon)
- "Based on Open-Meteo rainfall and drought index for this farm's GPS coordinates"
- Adaptive response score: X/100 (this is Dimension 3's score)
- Note: "A high-risk zone farmer who adapts scores higher than a low-risk zone farmer who does not."

### Components used
LenderDisclaimerBanner, FarmerSummaryHeader, CompositeScoreDisplay, PeerBenchmarkCard, DimensionTable, DimensionAccordionRow, VerificationBadge, ClimateContextCard, Button

### UI States

**Loading:** Skeleton for entire scorecard.

**Invalid token:**
- "Profile not found"
- "This link may have expired or been revoked by the farmer."
- No partial data ever shown for an invalid token.

**Populated:** Default state as described.

---

## LEND-02 — Weight Configuration (🟡)

**Route:** `/lender/configure`
**Hackathon tier:** 🟡

### Layout

Header: "Configure scoring weights"
Subheading: "Adjust how each dimension contributes to the total score. Weights must add up to 100%."

Five sliders, one per dimension:
- Dimension name
- Slider: 0-50%, step 1%
- Current value display: "30%"

Running total: "Total: [N]%" — red if ≠ 100%, green if = 100%

"Recalculate" button (primary, disabled if total ≠ 100%) → calls `/api/score` with new weights, updates displayed score

"Reset to defaults" link

"Apply and view scorecard" button → return to lender scorecard with new weights in URL params

---

## Onboarding Screens (🟡 ONB-01 through ONB-05)

Build these as a multi-step form at `/onboarding/[step]`.

**Shared onboarding layout:**
- Progress bar at top: Step X of 5
- Step title
- Step description
- Form fields
- "Next" button (primary) — validates current step before proceeding
- "Back" link (not a button — lower visual weight)

### ONB-01 — Basic Info
Fields: Full name, Country (Kenya/Uganda/Rwanda), District/County, Primary crop (select), Farm size in acres (number), Current season (text)

### ONB-02 — Financial Behaviour
Fields:
- Mobile money usage (radio: None / Occasionally / Monthly / Weekly)
- Monthly transaction volume (number, KES — shown only if not 'None')
- Savings group member (yes/no toggle)
- Contribution regularity (select — shown if savings group = yes)
- Prior input credit cycles (number, 0+)
- Repayment outcomes (dynamic — one select per cycle, shown if cycles > 0)

### ONB-03 — Farm Productivity
Fields:
- Yield last season (number, kg/acre) — with tooltip "Your cooperative may have this record"
- Yield previous season (number, kg/acre, optional)
- Crop diversity (number)
- Uses improved seeds (yes/no)
- Uses fertilizer (yes/no)
- GPS confirmation (yes/no — for hackathon, 'yes' uses Kisii default coordinates)

### ONB-04 — Climate & Adaptive Practices
Fields: Irrigation access, drought-tolerant varieties, soil conservation, post-harvest storage, crop insurance — all yes/no toggles.

At the top of this screen: "Your location's climate risk level: [Medium]" — auto-populated from Open-Meteo using the district from ONB-01. This is displayed information, not a score input.

### ONB-05 — Consent
Per-category consent checkboxes:
- "I agree to share my farm productivity data to generate my score"
- "I agree to share my financial behaviour data to generate my score"
- "I understand my cooperative may be asked to verify my membership"
- "I understand ShambaLadder is not a lender and does not make credit decisions"

"Generate my score" button → calls `/api/score` + `/api/explain` → redirects to `/dashboard`

---

*ShambaLadder · Kenya AI Challenge 2025*
