// app/demo/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { FarmerProfile, CompositeScore } from '@/types';
import { TierBadge } from '@/components/ui/TierBadge';
import { Skeleton } from '@/components/ui/Skeleton';

interface FarmerCardData {
  profile: FarmerProfile;
  score: CompositeScore | null;
  summary: string;
  avatarInitials: string;
}

const staticDetails = {
  'demo-wanjiku-001': {
    summary: 'Strong savings record. GPS confirmation would move her to Established.',
    avatar: 'WK',
  },
  'demo-joseph-001': {
    summary: '4 seasons in Kisii Cooperative, 2 on-time credit cycles.',
    avatar: 'JO',
  },
  'demo-amina-001': {
    summary: 'New entrant. Clear path to Tier 2 shown in her action list.',
    avatar: 'AH',
  },
};

export default function DemoLanding() {
  const [farmersData, setFarmersData] = useState<FarmerCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Step 1: Fetch farmers list
        const listRes = await fetch('/api/demo/farmers');
        if (!listRes.ok) throw new Error('Failed to load demo farmers.');
        const { farmers } = await listRes.json();

        // Step 2: Fetch scores for each farmer in parallel
        const dataPromises = farmers.map(async (farmer: FarmerProfile) => {
          const scoreRes = await fetch(`/api/demo/score/${farmer.farmerId}`);
          let scoreData = null;
          if (scoreRes.ok) {
            const data = await scoreRes.json();
            scoreData = data.score;
          }
          const details = staticDetails[farmer.farmerId as keyof typeof staticDetails] || {
            summary: 'Active smallholder farmer.',
            avatar: farmer.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
          };
          return {
            profile: farmer,
            score: scoreData,
            summary: details.summary,
            avatarInitials: details.avatar,
          };
        });

        const results = await Promise.all(dataPromises);
        setFarmersData(results);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'An error occurred while fetching demo data.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-bg-page text-text-primary px-4 py-8 md:px-8 font-sans">
      <div className="max-w-[1000px] mx-auto flex flex-col gap-10">
        
        {/* Top Header */}
        <header className="flex justify-between items-center border-b border-border-default pb-4">
          <div className="text-xl font-extrabold text-accent tracking-tight flex items-center gap-1">
            <span>ShambaLadder</span>
            <span className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded font-mono font-normal uppercase">v1.0</span>
          </div>
          <span className="bg-bg-inset text-[10px] text-text-secondary font-bold tracking-wider uppercase px-2.5 py-1.5 rounded-full border border-border-default">
            Kenya AI Challenge 2025
          </span>
        </header>

        {/* Hero Copy */}
        <section className="text-center max-w-2xl mx-auto flex flex-col gap-3">
          <h1 className="text-3xl md:text-4xl font-extrabold text-text-primary leading-tight tracking-tight">
            Meet our farmers
          </h1>
          <p className="text-sm md:text-base text-text-secondary leading-relaxed font-medium">
            Each profile runs the live scoring engine and AI explanation system. Select a profile to view their credit readiness scorecard.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/lender"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-accent-primary/20"
            >
              <span>🏦</span>
              <span>Lender Marketplace</span>
              <span className="text-xs opacity-70">→</span>
            </Link>
            <span className="text-xs text-text-muted">Browse & filter 50 scored farmers</span>
          </div>
        </section>


        {/* Error State */}
        {error && (
          <div className="bg-error-bg border border-error-border text-error-text p-4 rounded-xl text-center font-semibold text-sm">
            {error}
          </div>
        )}

        {/* Farmer Cards Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-bg-card border border-border-default rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-4.5 w-3/4" />
                      <Skeleton className="h-3.5 w-1/2" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <div className="space-y-2 pt-2">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
              ))
            : farmersData.map((data) => {
                const computedScore = data.score?.totalScore ?? 0;
                const computedTier = data.score?.tier ?? 'seedling';

                return (
                  <div
                    key={data.profile.farmerId}
                    className="bg-bg-card border border-border-default rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col justify-between gap-5 relative overflow-hidden group"
                  >
                    {/* Top Section: Avatar + Name + Metadata */}
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-full bg-accent/10 border border-accent/20 text-accent font-extrabold text-[15px] flex items-center justify-center select-none shadow-sm">
                          {data.avatarInitials}
                        </div>
                        <div className="flex flex-col">
                          <h2 className="text-base font-bold text-text-primary group-hover:text-accent transition-colors">
                            {data.profile.name}
                          </h2>
                          <span className="text-xs text-text-tertiary font-semibold capitalize mt-0.5">
                            {data.profile.social.cooperativeName || 'Self-Employed'}
                          </span>
                        </div>
                      </div>

                      {/* Location & Crop Info */}
                      <div className="text-[13px] text-text-secondary font-medium">
                        Region: <span className="capitalize">{data.profile.region}</span> · Crop:{' '}
                        <span className="capitalize">{data.profile.primaryCrop}</span> ({data.profile.farmSizeAcres} ac)
                      </div>

                      {/* Score Indicator */}
                      <div className="flex items-baseline gap-2 pt-2">
                        <span className="text-4xl font-extrabold text-text-primary tracking-tight">
                          {computedScore.toFixed(0)}
                        </span>
                        <span className="text-xs text-text-tertiary font-bold uppercase">/100</span>
                      </div>

                      {/* Tier Badge */}
                      <div className="self-start">
                        <TierBadge tier={computedTier} size="sm" />
                      </div>

                      {/* One Sentence Description */}
                      <p className="text-xs md:text-[13px] text-text-secondary leading-relaxed font-normal pt-1 border-t border-border-default/55">
                        {data.summary}
                      </p>
                    </div>

                    {/* Bottom CTA Button */}
                    <Link href={`/demo/${data.profile.farmerId}`} className="w-full">
                      <button className="w-full h-10 bg-accent text-white hover:bg-accent-hover active:bg-accent-active font-semibold text-sm rounded-lg transition-colors cursor-pointer select-none">
                        View profile
                      </button>
                    </Link>
                  </div>
                );
              })}
        </section>

        {/* Footer info link */}
        <footer className="text-center border-t border-border-default/60 pt-6">
          <Link href="/onboarding" className="text-sm font-semibold text-accent hover:text-accent-hover transition-colors inline-flex items-center gap-1">
            Or simulate onboarding your own farm data →
          </Link>
        </footer>

      </div>
    </div>
  );
}
