// app/lender/configure/page.tsx
'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FarmerProfile, CompositeScore, DEFAULT_WEIGHTS } from '@/types';
import { calculateComposite } from '../../../lib/scoring';
import { TierBadge } from '@/components/ui/TierBadge';
import { Skeleton } from '@/components/ui/Skeleton';

function ConfigureContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const token = searchParams.get('token');
  const farmerId = searchParams.get('farmerId');

  const [profile, setProfile] = useState<FarmerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sliders state (in integer percentage: 0-100)
  const [wFin, setWFin] = useState(30);
  const [wProd, setWProd] = useState(25);
  const [wClim, setWClim] = useState(20);
  const [wSoc, setWSoc] = useState(15);
  const [wComp, setWComp] = useState(10);

  // Load profile data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        if (token) {
          const res = await fetch(`/api/share/${token}`);
          if (!res.ok) throw new Error('Shared profile not found.');
          const data = await res.json();
          setProfile(data.sharedProfile.profileSnapshot);
        } else if (farmerId) {
          const res = await fetch(`/api/demo/score/${farmerId}`);
          if (!res.ok) throw new Error('Demo farmer profile not found.');
          const data = await res.json();
          setProfile(data.profile);
        } else {
          throw new Error('Missing parameter. Please provide either a shared token or farmerId.');
        }

        // Initialize sliders from URL params if present
        const pFin = searchParams.get('w_fin');
        const pProd = searchParams.get('w_prod');
        const pClim = searchParams.get('w_clim');
        const pSoc = searchParams.get('w_soc');
        const pComp = searchParams.get('w_comp');

        if (pFin && pProd && pClim && pSoc && pComp) {
          setWFin(Number(pFin));
          setWProd(Number(pProd));
          setWClim(Number(pClim));
          setWSoc(Number(pSoc));
          setWComp(Number(pComp));
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'An error occurred while loading profile.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [token, farmerId, searchParams]);

  // Calculations
  const runningTotal = wFin + wProd + wClim + wSoc + wComp;
  const isTotalValid = runningTotal === 100;

  // Live composite score preview
  let previewScore: CompositeScore | null = null;
  if (profile) {
    try {
      // Calculate score on the client side using pure calculateComposite
      previewScore = calculateComposite(profile, {
        financial_behaviour: wFin / 100,
        farm_productivity: wProd / 100,
        climate_resilience: wClim / 100,
        social_coop_capital: wSoc / 100,
        record_completeness: wComp / 100,
      });
    } catch (err) {
      console.error('Scoring preview calculation failed:', err);
    }
  }

  const handleReset = () => {
    setWFin(30);
    setWProd(25);
    setWClim(20);
    setWSoc(15);
    setWComp(10);
  };

  const handleApply = () => {
    if (!isTotalValid) return;

    const query = `w_fin=${wFin}&w_prod=${wProd}&w_clim=${wClim}&w_soc=${wSoc}&w_comp=${wComp}`;

    if (token) {
      router.push(`/lender/scorecard/${token}?${query}`);
    } else if (farmerId) {
      router.push(`/demo/${farmerId}?view=lender&${query}`);
    }
  };

  const getBackUrl = () => {
    if (token) return `/lender/scorecard/${token}`;
    if (farmerId) return `/demo/${farmerId}?view=lender`;
    return '/demo';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-page text-text-primary px-4 py-8 md:px-8 font-sans">
        <div className="max-w-[540px] mx-auto space-y-6">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <div className="space-y-4 pt-4">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-bg-page text-text-primary flex flex-col items-center justify-center p-4 font-sans">
        <div className="bg-bg-card border border-border-default rounded-xl p-6 shadow-sm max-w-md w-full text-center space-y-4">
          <span className="text-4xl">⚠️</span>
          <h2 className="text-lg font-bold">Configuration Error</h2>
          <p className="text-sm text-text-secondary">{error}</p>
          <Link href="/demo" className="inline-block mt-2">
            <button className="px-4 py-2 bg-accent text-white font-semibold text-sm rounded-lg hover:bg-accent-hover cursor-pointer">
              Go to Demo Landing
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-page text-text-primary font-sans px-4 py-8 md:px-8">
      <div className="max-w-[540px] mx-auto flex flex-col gap-6">
        
        {/* Back navigation */}
        <Link href={getBackUrl()} className="text-sm font-semibold text-accent hover:text-accent-hover transition-colors flex items-center gap-1 self-start">
          ← Back to Scorecard
        </Link>

        {/* Header Block */}
        <div className="space-y-2 border-b border-border-default/45 pb-4">
          <h1 className="text-xl md:text-2xl font-extrabold text-text-primary tracking-tight">
            Configure scoring weights
          </h1>
          <p className="text-sm text-text-secondary leading-relaxed font-medium">
            Adjust how each dimension contributes to {profile.name}&apos;s total score. Custom weights must sum to exactly 100%.
          </p>
        </div>

        {/* Live Scorecard Preview Card */}
        {previewScore && (
          <div className="bg-accent-subtle border border-accent/20 rounded-xl p-5 shadow-sm flex items-center justify-between gap-6">
            <div className="space-y-1">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                Dynamic Score Preview
              </h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-text-primary tracking-tight">
                  {previewScore.totalScore.toFixed(1)}
                </span>
                <span className="text-xs font-bold text-text-tertiary">/100</span>
              </div>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[9px] font-bold uppercase tracking-wider text-text-tertiary">
                Projected Tier
              </span>
              <TierBadge tier={previewScore.tier} size="sm" />
            </div>
          </div>
        )}

        {/* Sliders Container */}
        <div className="bg-bg-card border border-border-default rounded-xl p-5 shadow-sm space-y-5">
          
          {/* Slider 1: Financial */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-text-primary">Financial Behaviour</span>
              <span className="text-accent">{wFin}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="1"
              value={wFin}
              onChange={(e) => setWFin(Number(e.target.value))}
              className="w-full h-1.5 bg-bg-inset rounded-lg appearance-none cursor-pointer accent-accent"
            />
          </div>

          {/* Slider 2: Productivity */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-text-primary">Farm Productivity</span>
              <span className="text-accent">{wProd}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="1"
              value={wProd}
              onChange={(e) => setWProd(Number(e.target.value))}
              className="w-full h-1.5 bg-bg-inset rounded-lg appearance-none cursor-pointer accent-accent"
            />
          </div>

          {/* Slider 3: Climate */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-text-primary">Climate Resilience</span>
              <span className="text-accent">{wClim}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="1"
              value={wClim}
              onChange={(e) => setWClim(Number(e.target.value))}
              className="w-full h-1.5 bg-bg-inset rounded-lg appearance-none cursor-pointer accent-accent"
            />
          </div>

          {/* Slider 4: Social */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-text-primary">Social & Cooperative Capital</span>
              <span className="text-accent">{wSoc}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="1"
              value={wSoc}
              onChange={(e) => setWSoc(Number(e.target.value))}
              className="w-full h-1.5 bg-bg-inset rounded-lg appearance-none cursor-pointer accent-accent"
            />
          </div>

          {/* Slider 5: Completeness */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-text-primary">Record Completeness</span>
              <span className="text-accent">{wComp}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="1"
              value={wComp}
              onChange={(e) => setWComp(Number(e.target.value))}
              className="w-full h-1.5 bg-bg-inset rounded-lg appearance-none cursor-pointer accent-accent"
            />
          </div>

          {/* Running Total indicator */}
          <div className="flex justify-between items-center pt-3 border-t border-border-default/45 text-sm">
            <div className="font-semibold text-text-secondary">
              Running Total:
            </div>
            <div
              className={`font-black text-base px-2.5 py-0.5 rounded-full border ${
                isTotalValid
                  ? 'bg-success-bg text-success-text border-success-border/20'
                  : 'bg-error-bg text-error-text border-error-border/20'
              }`}
            >
              {runningTotal}%
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <button
            onClick={handleApply}
            disabled={!isTotalValid}
            className="w-full sm:flex-1 h-11 bg-accent hover:bg-accent-hover active:bg-accent-active disabled:bg-accent/40 text-white font-semibold text-sm rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed shadow-sm"
          >
            Apply and view scorecard
          </button>
          
          <button
            onClick={handleReset}
            className="w-full sm:w-auto px-6 h-11 border border-border-strong text-text-primary hover:bg-bg-inset font-semibold text-sm rounded-lg transition-colors cursor-pointer select-none"
          >
            Reset to defaults
          </button>
        </div>

      </div>
    </div>
  );
}

export default function ConfigureWeights() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg-page flex items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
          <p className="text-sm text-text-secondary font-medium">Loading configuration...</p>
        </div>
      </div>
    }>
      <ConfigureContent />
    </Suspense>
  );
}
