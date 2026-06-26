// components/scorecard/PeerBenchmarkCard.tsx
import React from 'react';
import { PeerBenchmarkResult } from '@/types';

interface PeerBenchmarkCardProps {
  benchmark: PeerBenchmarkResult | null;
  primaryCrop?: string;
  farmSizeAcres?: number;
}

export function PeerBenchmarkCard({
  benchmark,
  primaryCrop = 'maize',
  farmSizeAcres = 2.5,
}: PeerBenchmarkCardProps) {
  // Helper to map numeric avgPeerTier to string
  const getAverageTierName = (avgTier: number) => {
    if (avgTier >= 3.5 || avgTier >= 3.0) return 'Established'; // In our data-model 2.78 is labeled Growing or Established
    if (avgTier >= 2.5) return 'Established';
    if (avgTier >= 1.5) return 'Growing';
    return 'Seedling';
  };

  const getFarmSizeRangeString = (size: number) => {
    const min = Math.max(0.5, size - 1.0);
    const max = size + 1.5;
    return `${min.toFixed(1)}–${max.toFixed(1)}`;
  };

  return (
    <div className="bg-accent-subtle border-l-3 border-accent rounded-xl p-4 shadow-sm flex flex-col gap-2">
      <div className="text-[11px] font-bold tracking-wider uppercase text-text-tertiary">
        Cooperative Peer Context (powered by Neo4j)
      </div>

      {benchmark && benchmark.sufficientData ? (
        <>
          {/* Main Statement */}
          <h4 className="text-base font-semibold text-text-primary leading-snug">
            {benchmark.displayString ||
              `${benchmark.onTimeCount} of ${benchmark.peerCount} similar farmers in this cooperative repaid on time`}
          </h4>

          {/* Sub Stats */}
          <div className="text-xs text-text-secondary font-medium">
            Peer group: <span className="capitalize">{primaryCrop}</span> farmers, {getFarmSizeRangeString(farmSizeAcres)} acres | Average peer tier: {getAverageTierName(benchmark.avgPeerTier)}
          </div>

          {/* Repayment Rate Bar */}
          <div className="w-full mt-1.5">
            <div className="h-1.5 w-full bg-bg-inset rounded-full overflow-hidden">
              <div
                className="h-full bg-tier-established"
                style={{ width: `${(benchmark.repaymentRate || 0) * 100}%` }}
              />
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Cold Start State */}
          <h4 className="text-base font-semibold text-text-tertiary leading-snug">
            Insufficient peer data
          </h4>
          <p className="text-xs text-text-secondary leading-relaxed">
            Peer benchmarking will be available once 10 or more farmers with a similar profile have completed a full lending cycle in {benchmark?.cooperativeName || 'your cooperative'}.
          </p>
        </>
      )}
    </div>
  );
}

export default PeerBenchmarkCard;
