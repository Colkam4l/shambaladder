# stitch-import.md — Google Stitch UI Import Guide
# ShambaLadder · Kenya AI Challenge 2025

## Purpose
Explains how the team uses Google Stitch to generate the UI foundation, then imports and adapts it into the Next.js codebase. Read this before building Sprint 4 or 5.

---

## Strategy: Stitch as a Scaffold, Not the Final Product

Google Stitch takes a detailed natural-language prompt and generates a full multi-page React app with routing, component structure, and layout. We use that output as the structural scaffold — then wire it to our TypeScript types, real API calls, and design system tokens.

**What Stitch is good for (use it for):**
- Full page layout and navigation structure in one pass
- Card grids, dashboards, form step flows
- Data tables and accordion patterns
- Overall app shell and routing

**What to override after export:**
- Colours — Stitch will use its own palette. After import, every colour reference becomes a CSS variable from `design-system.md`. You own the palette; do not let Stitch decide it.
- TypeScript types — tighten every loose prop to our interfaces in `types/index.ts`
- Data fetching — replace all mock/static data with real API calls
- Business logic — scoring, sharing, and consent logic must never come from Stitch output

---

## The Stitch Prompt

Paste this prompt into Google Stitch in one go. It describes the entire app. Stitch works best with a single comprehensive prompt rather than iterating page by page.

---

### STITCH PROMPT — COPY THIS IN FULL

```
Build a mobile-first web application called ShambaLadder — an AI-powered credit readiness scorecard for smallholder farmers in East Africa.

The app has the following pages. Build all of them with realistic placeholder data. Do not use Lorem Ipsum — use agricultural and financial content appropriate to smallholder farmers in Kenya.

---

PAGE 1: Demo Landing (/demo)

A landing page for judges and reviewers. No login required.

Layout:
- Top bar: "ShambaLadder" wordmark on the left, "Kenya AI Challenge 2025" badge on the right
- Heading: "Meet our farmers"
- Subheading: "Each profile runs the live scoring engine and AI explanation system."
- Three farmer profile cards in a horizontal row on desktop, stacked vertically on mobile

Each farmer card contains:
- A circular avatar showing the farmer's initials (e.g. "WK")
- Farmer full name (bold, large)
- Location and primary crop on one line (e.g. "Kisii, Kenya · Maize")
- A tier badge — pill-shaped label with icon: Seedling 🌱 / Growing 📈 / Established ✓ / Trusted ⭐
- Large score number (e.g. "57") with "/100" in smaller text beside it
- One sentence describing their credit situation
- A "View profile" button, full width, primary style

Below the three cards:
- A text link: "Or enter your own farm data →" that navigates to the onboarding flow

---

PAGE 2: Demo Farmer View (/demo/[farmerId])

This page shows a full farmer dashboard with a toggle at the top to switch between Farmer View and Lender View.

At the very top of the page:
- Back link: "← Demo Home"
- A segmented toggle control: "Farmer View" | "Lender View"
  - Farmer View is the default active state
  - Switching to Lender View replaces the page content with the lender scorecard (PAGE 5)

The Farmer View content below the toggle is identical to PAGE 3 (Farmer Dashboard).

---

PAGE 3: Farmer Dashboard (/dashboard)

Mobile-first single-column layout.

Section 1 — Farmer header:
- Farmer name (heading size)
- Location string (e.g. "Kisii, Kenya") in secondary text colour, smaller
- Tier badge immediately below the name

Section 2 — Score hero:
- Very large score number (e.g. "57") centered, the most prominent element on the page
- Label below it: "Credit Readiness Score" in small secondary text
- A horizontal progress bar showing position within the current tier range
- Below the bar: text like "3 points to Established" in small text

Section 3 — AI Explanation banner:
- A lightly tinted card (subtle background, not white)
- Small label: "AI explanation" in caps, tertiary colour
- 2-3 sentences of plain-language explanation, e.g.: "Wanjiku has a strong savings record and consistent mobile money use, which account for most of her Financial Behaviour score. Her biggest opportunity is confirming her GPS farm boundary, which would add 8 points to Farm Productivity and move her into the Established tier. Joining a cooperative would also unlock peer repayment benchmarks for lenders."
- Small italic disclaimer at the bottom: "Speak to a Shambapro advisor before making finance or planting decisions."

Section 4 — Five dimension score cards (stacked vertically):
Each card:
- Dimension name as card title (e.g. "Financial Behaviour")
- Weight label to the right of the title (e.g. "30% of score") in small tertiary text
- A horizontal score bar filled to the dimension score (e.g. 64%)
- Score label: "64 / 100" right-aligned below the bar
- Row of small verification badges: each field shows either "✓ Verified", "○ Self-reported", "◆ Open-Meteo", "◆ SoilGrids", "◆ Neo4j", or "! Missing"
- 2 sentences of explanation text in secondary colour

The five dimensions in order:
1. Financial Behaviour (score: 64, weight: 30%) — badges: Self-reported (mobile money), Verified (savings group), Missing (repayment history)
2. Farm Productivity (score: 55, weight: 25%) — badges: Verified (yield records), Missing (GPS boundary), SoilGrids (soil quality)
3. Climate Resilience (score: 60, weight: 20%) — badges: Open-Meteo (climate data), Self-reported (adaptive practices)
4. Social & Cooperative Capital (score: 45, weight: 15%) — badges: Verified (cooperative tenure), Neo4j (peer benchmark), Missing (off-taker relationship)
5. Record Completeness (score: 71%, weight: multiplier) — badges: App-generated

Section 5 — Bottom CTAs:
- Primary button: "See my action plan" (full width)
- Secondary button below it: "Share with a lender" (full width, outlined style)

---

PAGE 4: Action List (/actions)

Mobile-first single-column layout.

Header:
- Back arrow link to dashboard
- Page title: "Your action plan"
- Subheading: "These specific steps will improve your credit score. Ranked by impact."

Score impact summary bar:
- A highlighted banner: "Complete all actions → estimated score: 86" (shown in the next tier's colour if completing actions crosses a tier threshold)

Ranked action cards (show 4 example actions):

Action 1 (rank 1):
- Rank circle: "1"
- Title: "Confirm your GPS farm boundary"
- Dimension badge: "Farm Productivity"
- Effort badge: "Quick"
- Score impact: "+8 points" (prominent, accent colour)
- Description: "Confirming your GPS farm boundary this week adds 8 points to Farm Productivity and moves your total from 57 to 65, crossing into the Established tier."
- Checkbox on the right (unchecked)

Action 2 (rank 2):
- Rank circle: "2"
- Title: "Join a savings group or SACCO"
- Dimension badge: "Financial Behaviour"
- Effort badge: "Medium"
- Score impact: "+15 points"
- Description: "Savings group membership is one of the strongest signals of financial discipline for lenders. A SACCO in your area can be joined in one visit."
- Checkbox (unchecked)

Action 3 (rank 3):
- Rank circle: "3"
- Title: "Use drought-tolerant maize varieties next season"
- Dimension badge: "Climate Resilience"
- Effort badge: "Medium"
- Score impact: "+8 points"
- Description: "Drought-tolerant varieties show lenders you actively manage climate risk. Certified seed varieties are available through your nearest agrodealer."
- Checkbox (unchecked)

Action 4 (rank 4):
- Rank circle: "4"
- Title: "Complete your Shambapro profile"
- Dimension badge: "Record Completeness"
- Effort badge: "Quick"
- Score impact: "+5 points"
- Description: "Filling in your off-taker relationship and post-harvest storage details raises your completeness multiplier, which lifts all your other scores."
- Checkbox (unchecked)

At the bottom of the list, a section titled "Completed" — empty with a message "Your completed actions will appear here."

---

PAGE 5: Lender Scorecard (/lender/scorecard/[token])

This is the view a loan officer sees after a farmer shares their profile.

Permanent sticky banner at the very top of the page (amber/warning colour, cannot be dismissed):
"⚠️ ShambaLadder is decision support. All credit decisions remain with your institution."

Farmer summary header:
- Farmer name (bold, large)
- Location | Crop | Farm size on one line (e.g. "Kisii, Kenya | Maize | 2.5 acres")
- Tier badge
- Small text: "Shared by farmer on 15 June 2025"
- "Download profile" button (outlined, secondary style) on the right

Composite score section:
- Large score number: "57"
- Tier label: "Growing"
- Small text: "Score calculated with default weights. Configure weights →"

Neo4j Peer Benchmark card (distinct highlighted card, accent-coloured left border):
- Small label at top: "COOPERATIVE PEER CONTEXT · POWERED BY NEO4J"
- Main statement (large text): "19 of 23 similar farmers in Kisii Cooperative repaid on time."
- Sub-stats below: "Peer group: maize farmers, 1–4 acres | Average peer tier: Growing"
- A horizontal bar showing 83% filled (the repayment rate)

Dimension breakdown section — a table with 5 rows:
Columns: Dimension | Score | Weight | Weighted | Verification Status

Row 1: Financial Behaviour | 64 | 30% | 19.2 | Partial
Row 2: Farm Productivity | 55 | 25% | 13.75 | Partial
Row 3: Climate Resilience | 60 | 20% | 12.0 | Self-reported
Row 4: Social & Coop Capital | 45 | 15% | 6.75 | Partial
Row 5: Record Completeness | 71% | — | ×0.92 | App-generated

Each row is expandable (click to expand accordion). When expanded, shows a sub-list of fields with:
- Field name
- Value provided
- Verification source badge (same badge style as farmer view)
- A short note (e.g. "Yield cross-validated against SoilGrids soil quality for this GPS location")

Example expanded row for Farm Productivity:
- Yield last season: 680 kg/acre | ✓ Verified (Shambapro records) | Cross-validated against SoilGrids
- GPS boundary: Not confirmed | ! Missing | Confirming GPS would add 8 points
- Soil quality index: 72/100 | ◆ SoilGrids | Auto-fetched from SoilGrids for this location

Climate context section (separate from the dimension score):
- Label: "CLIMATE CONTEXT · NOT A SCORE INPUT"
- Climate risk level: "Medium" with an icon
- Source: "Based on Open-Meteo rainfall and drought index for this farm's GPS coordinates"
- Adaptive response score: "60/100" 
- Explanatory note: "A high-risk zone farmer who adapts scores higher than a low-risk zone farmer who does not."

---

PAGE 6: Share Profile (/share)

A two-step flow.

Step 1 — Consent review:
- Page title: "Share your credit profile"
- Subheading: "You control who sees your data."

A consent summary card with two sections:
"The lender will see:"
- ✓ Your credit score and tier
- ✓ Score breakdown across all five dimensions
- ✓ Verification status for each data field
- ✓ Peer repayment context from your cooperative

"The lender will NOT see:"
- ✗ Your mobile money account details
- ✗ Your cooperative login credentials
- ✗ Any data field you have not provided

Text input: "Lender or institution name (optional)" — placeholder: "e.g. Kisii SACCO"

Primary button: "Generate share link" (full width)

Step 2 — Link generated (shown after button click, replaces Step 1):
- Success heading: "Your profile is ready to share"
- A copyable link field showing a URL like: "shambaladder.com/lender/scorecard/abc123"
- "Copy link" button next to the field (changes to "Copied!" for 2 seconds after click)
- A QR code placeholder box (square, labelled "QR Code")
- Small text below: "This link shows a snapshot of your score as of today. You can revoke access at any time."
- Text link: "← Back to dashboard"

---

PAGE 7: Onboarding Step 1 — Basic Info (/onboarding/1)

Multi-step form. Progress bar at top showing "Step 1 of 5" with 5 segments.

Page title: "Tell us about your farm"

Form fields:
- Full name (text input)
- Country (dropdown: Kenya / Uganda / Rwanda)
- District or County (text input)
- Primary crop (dropdown: Maize / Beans / Coffee / Tea / Mixed)
- Farm size in acres (number input, min 0.5 max 100)
- Current season (text input, placeholder: "e.g. Long Rains 2025")

Bottom navigation:
- "Next →" button (primary, full width)

---

PAGE 8: Onboarding Step 2 — Financial Behaviour (/onboarding/2)

Progress bar: Step 2 of 5.

Page title: "Your financial habits"
Subheading: "This is the most important dimension for lenders. Be as accurate as you can."

Form fields:
- Mobile money usage (radio group):
  ○ I don't use mobile money
  ○ I use it occasionally
  ○ I make transactions most months
  ○ I transact weekly or more
- Approximate monthly transaction volume in KES (number input — only shown if not first option)
- Are you a member of a savings group or SACCO? (Yes / No toggle)
- How regularly do you contribute? (dropdown: Irregularly / Monthly / Weekly — shown only if savings group = Yes)
- How many input credit cycles have you completed via a cooperative? (number input, starting from 0)
- For each cycle completed (shown dynamically): dropdown — On time / Late / Default

Bottom navigation:
- "← Back" link (left)
- "Next →" button (primary, right)

---

PAGE 9: Onboarding Step 3 — Farm Productivity (/onboarding/3)

Progress bar: Step 3 of 5.

Page title: "Your farm production"

Form fields:
- Yield last season in kg per acre (number input — tooltip: "Your cooperative may have this record")
- Yield the season before that in kg/acre (number input, optional)
- How many different crops do you grow? (number input)
- Do you use improved/certified seeds? (Yes / No toggle)
- Do you use fertilizer? (Yes / No toggle)
- Has your GPS farm boundary been confirmed in Shambapro? (Yes / No toggle)

Bottom navigation:
- "← Back" link
- "Next →" button

---

PAGE 10: Onboarding Step 4 — Climate & Adaptive Practices (/onboarding/4)

Progress bar: Step 4 of 5.

Page title: "How you manage climate risk"
Subheading: "Your location's climate conditions are noted for context, but what we score is how you respond to them."

An informational banner at the top of this page showing auto-detected climate data:
"Your location's climate risk level: Medium — based on Open-Meteo rainfall and drought data for Kisii, Kenya"

Form fields (all Yes / No toggles):
- Do you have access to irrigation?
- Do you use drought-tolerant crop varieties?
- Do you practise soil conservation (e.g. terracing, cover crops)?
- Do you have post-harvest storage (silo, bag, or facility)?
- Do you have crop insurance?

Bottom navigation:
- "← Back" link
- "Next →" button

---

PAGE 11: Onboarding Step 5 — Consent (/onboarding/5)

Progress bar: Step 5 of 5.

Page title: "Review and consent"
Subheading: "We only use your data to calculate your credit readiness score. You control who sees it."

Four consent checkboxes (all must be checked to proceed):
☐ I agree to share my farm productivity data to generate my score
☐ I agree to share my financial behaviour data to generate my score
☐ I understand my cooperative may be asked to verify my membership
☐ I understand ShambaLadder is not a lender and does not make credit decisions

A final note below the checkboxes in small text:
"Your data is never shared with any lender without your explicit action. You can view, edit, or delete your data at any time."

Primary button: "Generate my score" (full width, disabled until all boxes are checked)
- When clicked: show a loading state with text "Calculating your score…" then "Generating your explanation…"
- Then navigate to the Farmer Dashboard

"← Back" link above the button.

---

DESIGN GUIDANCE FOR ALL PAGES:

- Mobile-first. Primary viewport is 360–480px wide (mid-range Android phone).
- All touch targets minimum 48px height.
- Clean, professional, data-forward. This is a financial product used in the field.
- Use a sidebar or bottom navigation only if it feels natural — keep navigation minimal.
- Every card has a subtle border and light shadow. No flat borderless layouts.
- Tier badges must be visually distinct from each other — use different background colours per tier.
- The lender disclaimer banner on PAGE 5 must be sticky and always visible — do not allow it to scroll away.
- Loading states: show skeleton placeholders for cards and score numbers while data loads.
- Error states: show a clear message with a retry button if any API call fails.
- The app name "ShambaLadder" should appear on every page header or top bar.
- Use React Router or Next.js-style routing. All navigation between pages should be client-side.
```

---

## After Stitch Export

### Step 1: Export from Stitch

Download the generated React project. Stitch exports a full project structure.

### Step 2: Place Stitch output

Copy the Stitch output into `components/ui/stitch-base/` — a holding directory. **Do not use these components directly in the app.** They are source material only.

### Step 3: Adapt each page component

For each page, create the proper implementation in `app/` (Next.js App Router convention):

1. Copy the structural JSX from the Stitch base page
2. **Replace ALL colours** — Stitch uses hardcoded values; every colour must become a CSS variable from `design-system.md`. You own the palette entirely. This is the main adaptation task.
3. Replace loose prop types with our TypeScript interfaces from `types/index.ts`
4. Replace all static/mock data with real API calls to our routes in `api-contract.md`
5. Add loading and error states per `screen-specs.md`

**Type replacement checklist:**
- Any `score: number` on a card → map to correct field in `CompositeScore`
- Any `tier: string` → `tier: CreditTier` from `types/index.ts`
- Any `actions: any[]` → `actions: ScoredAction[]`
- Any farmer data object → `FarmerProfile` from `types/index.ts`

### Step 4: Delete stitch-base

Once all pages are adapted, delete `components/ui/stitch-base/`. No raw Stitch output ships.

---

## What Stitch Cannot Generate (Build These Directly)

Do not attempt to generate these in Stitch — build them directly from spec:

- **All API routes** (`app/api/*`) — Stitch only generates frontend. All API routes are hand-written.
- **Scoring engine** (`lib/scoring/`) — Pure TypeScript functions from `scoring-engine.md`. Never from a UI tool.
- **Neo4j client** (`lib/neo4j/`) — Server-side only, hand-written from `neo4j-queries.md`.
- **Featherless client** (`lib/featherless/`) — Server-side only, hand-written from `llm-integration.md`.
- **VerificationBadge component** — Too specific to our data model; build directly from `design-system.md`.
- **PeerBenchmarkCard component** — Too specific to Neo4j output shape; build directly from spec.
- **LenderDisclaimerBanner** — One-liner, build directly.
- **Onboarding consent logic** — Intertwined with the consent model; hand-written.

---

## Time Budget

- **20 min:** Run the Stitch prompt, review output, export
- **40 min:** Colour replacement across all pages (the main work — you own the palette)
- **30 min:** Type tightening and wiring to real API calls
- **20 min:** Loading/error states for pages that call live APIs

**Total: ~110 minutes for full UI scaffold adapted and wired.**

If colour replacement is taking too long, apply a single CSS variable override at the root level first (`--color-accent: [your value]` etc.) and refine page-by-page after the demo is working.

---

## Priority Order If Stitch Output Needs Rework

If the Stitch output for any page needs significant rework, drop it and build that page directly from `screen-specs.md`. Priority order:

1. **DEMO-01** (Demo Landing, `/demo`) — judges' first impression
2. **LEND-01** (Lender Scorecard, `/lender/scorecard/[token]`) — most technically distinctive; Neo4j peer card is the showpiece
3. **FARM-01** (Farmer Dashboard, `/dashboard`) — deepest content, LLM explanations visible
4. **FARM-02** (Action List, `/actions`)
5. **FARM-04** (Share Profile, `/share`)

---

*ShambaLadder · Kenya AI Challenge 2025*
