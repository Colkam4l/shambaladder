// lib/share-store.ts
import { SharedProfile, CompositeScore, ExplanationResponse, PeerBenchmarkResult } from '../types';

const globalForShares = global as unknown as {
  shareStore?: Map<string, SharedProfile>;
  demoScoreCache?: Map<string, {
    score: CompositeScore;
    explanation: ExplanationResponse;
    peerBenchmark: PeerBenchmarkResult | null;
  }>;
};

export const shareStore = globalForShares.shareStore ?? new Map<string, SharedProfile>();
export const demoScoreCache = globalForShares.demoScoreCache ?? new Map<string, any>();

if (process.env.NODE_ENV !== 'production') {
  globalForShares.shareStore = shareStore;
  globalForShares.demoScoreCache = demoScoreCache;
}
