// components/scorecard/LenderDisclaimerBanner.tsx
import React from 'react';

export function LenderDisclaimerBanner() {
  return (
    <div className="sticky top-0 z-50 bg-warning-bg border-b border-warning-border py-3 px-6 shadow-sm flex items-center justify-center gap-3 w-full">
      <span className="text-base flex-shrink-0" role="img" aria-label="warning">
        ⚠️
      </span>
      <span className="text-sm font-semibold text-warning-text text-center leading-normal">
        ShambaLadder is decision support. All credit decisions remain with your institution.
      </span>
    </div>
  );
}

export default LenderDisclaimerBanner;
