# Sprint 5 — Lender View UI — Context

## What Was Built
- **Print Optimization**: Added `@media print` print-to-PDF styles in `app/globals.css` that format scorecards for physical or PDF output, hiding buttons, back links, and checkboxes.
- **Dynamic Weight Integration**: Modified `/lender/scorecard/[token]` and `/demo/[farmerId]` to parse custom scoring weights from search queries and dynamically run the scoring engine client-side.
- **Weight Configuration Panel**: Built `/lender/configure` page supporting five 0-50% sliders, live running totals, real-time score preview calculations, and redirection back on apply.

## Current System State
- **Active Pages**:
  - `/demo` (Landing)
  - `/demo/[farmerId]` (Dashboard & Scorecard toggle)
  - `/dashboard` (Fallback redirect)
  - `/actions` (Action List)
  - `/share` (Sharing panel)
  - `/lender/scorecard/[token]` (Lender snapshot)
  - `/lender/configure` (Weight configuration sliders)
- **Active Endpoints**:
  - `POST /api/share` (Save snapshot)
  - `GET /api/share/[shareId]` (Get snapshot)
  - `GET /api/demo/farmers` (Get demo list)
  - `GET /api/demo/score/[farmerId]` (Compute & Cache scorecard data)

## Decisions Made
- **Client-Side Live Recalculation**: Rather than hitting an API endpoint (`/api/score`) every time a slider is moved on the weight configuration page, the pure scoring engine code (`calculateComposite`) is executed client-side. This yields instant, lag-free UI updates as the user moves sliders.

## Known Issues / Deferred
- None. TypeScript compiles with zero errors, and all 61 Jest tests pass.

## Sprint 6 Should Start With
1. Implement **Demo Mode** landing elements to easily toggle farmer perspectives.
2. Implement the multi-step **Onboarding Form** at `/onboarding` (Steps 1 to 5) collecting basic, financial, productivity, and climate details, and capturing consent on completion.
