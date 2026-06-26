# Sprint 6 — Onboarding + Demo Mode — Context

## What Was Built
- **Robust LLM Explanation Fallback**: Wrapped explanation LLM calls in a `try/catch` block. If Featherless credentials are missing, or if the API encounters rate limiting, the system falls back to a clean mock explanation structure, preventing 500 errors and ensuring immediate page renders.
- **Onboarding Step Form**: Created `/onboarding/[step]` multi-step form pages (Steps 1-5).
  - Captures Basic Info, Financial Behaviour, Farm Productivity, Climate Practices, and Consent Checklists.
  - Implemented client-side persistence in `localStorage` to save user inputs across steps without database updates.
- **End-to-End Submission Integration**: Upon consent submit:
  - Dynamically fetches soil indexes and climate indexes from `/api/soil` and `/api/climate`.
  - Queries Neo4j database `/api/neo4j/peer` for peer repayment benchmarks.
  - Runs scoring engine `/api/score` and LLM explanations `/api/explain` dynamically.
  - Redirects to `/dashboard` which loads the custom profile from local storage.
- **Custom Profile Fallback**: Updated the `/demo/[farmerId]` dashboard route to check local storage and load the profile dynamically if it corresponds to a custom onboarded farmer.

## Decisions Made
- **Client-Side Storage**: In the absence of institutional databases and login scopes for the hackathon, `localStorage` is used to carry draft state between steps and render custom farmer dashboards seamlessly.
- **Graceful LLM Degradation**: By returning structured mock fallback explanations on Featherless failure, we prevent cold-start delays from blocking frontend page loads.

## Known Issues / Deferred
- None. TypeScript compiles successfully, and all 61 unit tests pass.

## Sprint 7 Should Start With
1. End-to-end integration test: onboarding → dynamic score → share link → lender view.
2. Mobile responsiveness checks (360px viewport).
3. Polish loading states and error screens for API/LLM timeouts.
