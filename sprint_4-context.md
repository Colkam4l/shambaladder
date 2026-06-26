# Sprint 4 — Farmer View UI — Context

## What Was Built
- **Design Tokens Integration**: Integrated all color, typography, radius, and shadow tokens from `design-system.md` into `app/globals.css` using Tailwind CSS v4 `@theme`.
- **Reusable Scorecard Components**: Built `TierBadge`, `VerificationBadge`, `Skeleton`, `ScoreHero`, `AIExplanationBanner`, `DimensionCard`, `PeerBenchmarkCard`, and `LenderDisclaimerBanner`.
- **Demo Hub & View Toggle**: Built `/demo/[farmerId]` which dynamically loads pre-computed scores and supports a tabbed switch between the Farmer View dashboard and the Lender Scorecard.
- **Projected Score Action Plan**: Built `/actions` where checked items dynamically update the projected score and tier progression in real-time, saving completion states to `localStorage`.
- **Sharing API & Snapshot View**: Built `/api/share` and `/api/share/[shareId]` endpoints alongside `/share` consent flow and `/lender/scorecard/[token]` snapshot scorecard.
- **Judge Landing View**: Built `/demo` showing the three demo farmers (Wanjiku, Joseph, Amina) with computed score summaries.

## Current System State
- **Active Pages**:
  - `/demo` (Landing)
  - `/demo/[farmerId]` (Dashboard & Scorecard toggle)
  - `/dashboard` (Fallback redirect)
  - `/actions` (Action List)
  - `/share` (Sharing panel)
  - `/lender/scorecard/[token]` (Lender snapshot)
- **Active Endpoints**:
  - `POST /api/share` (Save snapshot)
  - `GET /api/share/[shareId]` (Get snapshot)
  - `GET /api/demo/farmers` (Get demo list)
  - `GET /api/demo/score/[farmerId]` (Compute & Cache scorecard data)

## Decisions Made
- **Server Cache for Demo Scores**: Running parallel LLM generations on Wanjiku's score takes ~2-3s. To ensure judges get instant page loads and avoid excessive API hits, the first fetch of a demo farmer's score computes and caches the result globally in-memory for the session.
- **Combined LEND-01 Render**: Built LEND-01 core layout alongside FARM-01 in Sprint 4 to enable end-to-end testing of the toggle switch.

## Known Issues / Deferred
- None. TypeScript compiles with zero errors, and all 61 Jest tests pass.

## Sprint 5 Should Start With
1. Implement the **Weight Configuration Panel** (`/lender/configure`) with five sliders allowing lenders to recalculate scores with custom weights.
2. Review print stylesheet layout overrides to ensure "Download profile" prints beautifully to PDF via `window.print()`.
