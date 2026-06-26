// app/demo/[farmerId]/page.tsx
'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FarmerProfile, CompositeScore, ExplanationResponse, PeerBenchmarkResult } from '@/types';
import { calculateComposite } from '../../../lib/scoring';
import { TierBadge } from '@/components/ui/TierBadge';
import { VerificationBadge } from '@/components/ui/VerificationBadge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ScoreHero } from '@/components/scorecard/ScoreHero';
import { AIExplanationBanner } from '@/components/scorecard/AIExplanationBanner';
import { DimensionCard } from '@/components/scorecard/DimensionCard';
import { PeerBenchmarkCard } from '@/components/scorecard/PeerBenchmarkCard';
import { LenderDisclaimerBanner } from '@/components/scorecard/LenderDisclaimerBanner';

interface PageProps {
  params: Promise<{ farmerId: string }>;
}

export default function DemoFarmerHub({ params }: PageProps) {
  const router = useRouter();
  const { farmerId } = use(params);

  const [activeTab, setActiveTab] = useState<'farmer' | 'lender'>('farmer');
  const [profile, setProfile] = useState<FarmerProfile | null>(null);
  const [score, setScore] = useState<CompositeScore | null>(null);
  const [explanation, setExplanation] = useState<ExplanationResponse | null>(null);
  const [peerBenchmark, setPeerBenchmark] = useState<PeerBenchmarkResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Accordion state for lender view table
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Read search params for custom weights
  const searchParams = useSearchParams();
  const viewParam = searchParams.get('view');
  const w_fin = searchParams.get('w_fin');
  const w_prod = searchParams.get('w_prod');
  const w_clim = searchParams.get('w_clim');
  const w_soc = searchParams.get('w_soc');
  const w_comp = searchParams.get('w_comp');

  useEffect(() => {
    if (viewParam === 'lender' || w_fin) {
      setActiveTab('lender');
    }
  }, [viewParam, w_fin]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // Check if it's a custom/onboarded profile stored in localStorage
        const localFarmerId = localStorage.getItem('activeFarmerId');
        if (localFarmerId === farmerId && !farmerId.startsWith('demo-')) {
          const localProfileJson = localStorage.getItem('activeProfile');
          const localScoreJson = localStorage.getItem('activeScore');
          const localExplanationJson = localStorage.getItem('activeExplanation');
          const localPeerBenchmarkJson = localStorage.getItem('activePeerBenchmark');

          if (localProfileJson && localScoreJson && localExplanationJson) {
            setProfile(JSON.parse(localProfileJson));
            setScore(JSON.parse(localScoreJson));
            setExplanation(JSON.parse(localExplanationJson));
            setPeerBenchmark(localPeerBenchmarkJson ? JSON.parse(localPeerBenchmarkJson) : null);
            setLoading(false);
            return;
          }
        }

        const res = await fetch(`/api/demo/score/${farmerId}`);
        if (!res.ok) {
          throw new Error('Failed to fetch demo scorecard data.');
        }
        const data = await res.json();
        setProfile(data.profile);
        setScore(data.score);
        setExplanation(data.explanation);
        setPeerBenchmark(data.peerBenchmark);

        // Store active info in localStorage for other client views (/actions, /share)
        localStorage.setItem('activeFarmerId', farmerId);
        localStorage.setItem('activeProfile', JSON.stringify(data.profile));
        localStorage.setItem('activeScore', JSON.stringify(data.score));
        localStorage.setItem('activeExplanation', JSON.stringify(data.explanation));
        localStorage.setItem('activePeerBenchmark', JSON.stringify(data.peerBenchmark));
      } catch (err: unknown) {
        console.error(err);
        const errMsg = err instanceof Error ? err.message : 'An error occurred while loading farmer data.';
        setError(errMsg);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [farmerId]);

  const handleNavigateToActions = () => {
    router.push('/actions');
  };

  const handleNavigateToShare = () => {
    router.push('/share');
  };

  const toggleRow = (rowName: string) => {
    setExpandedRow(expandedRow === rowName ? null : rowName);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-page text-text-primary px-4 py-8 md:px-8 font-sans">
        <div className="max-w-[680px] mx-auto space-y-6">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-6.5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-[180px] w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile || !score) {
    return (
      <div className="min-h-screen bg-bg-page text-text-primary flex flex-col items-center justify-center p-4">
        <div className="bg-bg-card border border-border-default rounded-xl p-6 shadow-sm max-w-md w-full text-center space-y-4">
          <span className="text-4xl">❌</span>
          <h2 className="text-lg font-bold">Failed to load scorecard</h2>
          <p className="text-sm text-text-secondary">{error || 'Unknown error'}</p>
          <Link href="/demo" className="inline-block mt-2">
            <button className="px-4 py-2 bg-accent text-white font-semibold text-sm rounded-lg hover:bg-accent-hover cursor-pointer">
              Return to Demo Home
            </button>
          </Link>
        </div>
      </div>
    );
  }


  let finalScore = score;
  let isCustomWeights = false;

  if (w_fin && w_prod && w_clim && w_soc && w_comp) {
    const finVal = Number(w_fin);
    const prodVal = Number(w_prod);
    const climVal = Number(w_clim);
    const socVal = Number(w_soc);
    const compVal = Number(w_comp);

    if (Math.abs((finVal + prodVal + climVal + socVal + compVal) - 100) < 0.1) {
      isCustomWeights = true;
      try {
        finalScore = calculateComposite(profile, {
          financial_behaviour: finVal / 100,
          farm_productivity: prodVal / 100,
          climate_resilience: climVal / 100,
          social_coop_capital: socVal / 100,
          record_completeness: compVal / 100,
        });
      } catch (err) {
        console.error('Error recalculating client-side score in demo page:', err);
      }
    }
  }

  return (
    <div className="min-h-screen bg-bg-page text-text-primary font-sans flex flex-col">
      {/* Lender Disclaimer (Only visible when Lender View is active) */}
      {activeTab === 'lender' && <LenderDisclaimerBanner />}

      {/* Main Content Area */}
      <div className="flex-1 w-full max-w-[680px] mx-auto px-4 py-6 md:py-8 flex flex-col gap-6">
        
        {/* Navigation & Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-b border-border-default/45 pb-4">
          <Link href="/demo" className="text-sm font-semibold text-accent hover:text-accent-hover transition-colors flex items-center gap-1 self-start">
            ← Demo Home
          </Link>
          
          {/* Segmented Toggle Control */}
          <div className="flex bg-bg-inset p-1 rounded-lg border border-border-default max-w-[280px] w-full">
            <button
              onClick={() => setActiveTab('farmer')}
              className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === 'farmer'
                  ? 'bg-bg-card text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Farmer View
            </button>
            <button
              onClick={() => setActiveTab('lender')}
              className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === 'lender'
                  ? 'bg-bg-card text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Lender View
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: Farmer View */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'farmer' && (
          <div className="flex flex-col gap-6">
            
            {/* Farmer Header */}
            <div className="flex justify-between items-start gap-4">
              <div>
                <h1 className="text-xl md:text-2xl font-extrabold text-text-primary tracking-tight">
                  {profile.name}
                </h1>
                <span className="text-xs md:text-sm text-text-secondary font-medium mt-1 inline-block capitalize">
                  {profile.region === 'kenya' ? 'Kisii, Kenya' : profile.region === 'uganda' ? 'Mbale, Uganda' : 'Kigali, Rwanda'}
                </span>
              </div>
              <TierBadge tier={finalScore.tier} size="md" />
            </div>

            {/* Score Hero Section */}
            <ScoreHero score={finalScore.totalScore} tier={finalScore.tier} />

            {/* AI Explanation Banner */}
            <AIExplanationBanner explanation={explanation?.compositeExplanation} />

            {/* Dimension Breakdown Cards */}
            <div className="flex flex-col gap-4">
              <h2 className="text-sm font-bold tracking-wider uppercase text-text-tertiary">
                Score Breakdown
              </h2>

              <DimensionCard
                dimension="financial_behaviour"
                label="Financial Behaviour"
                weight={finalScore.weights.financial_behaviour}
                rawScore={finalScore.dimensions.financial_behaviour.rawScore}
                explanation={explanation?.dimensions.financial_behaviour.explanation}
                verificationFlags={finalScore.dimensions.financial_behaviour.verificationFlags}
              />

              <DimensionCard
                dimension="farm_productivity"
                label="Farm Productivity"
                weight={finalScore.weights.farm_productivity}
                rawScore={finalScore.dimensions.farm_productivity.rawScore}
                explanation={explanation?.dimensions.farm_productivity.explanation}
                verificationFlags={finalScore.dimensions.farm_productivity.verificationFlags}
              />

              <DimensionCard
                dimension="climate_resilience"
                label="Climate Resilience"
                weight={finalScore.weights.climate_resilience}
                rawScore={finalScore.dimensions.climate_resilience.rawScore}
                explanation={explanation?.dimensions.climate_resilience.explanation}
                verificationFlags={finalScore.dimensions.climate_resilience.verificationFlags}
              />

              <DimensionCard
                dimension="social_coop_capital"
                label="Social & Cooperative Capital"
                weight={finalScore.weights.social_coop_capital}
                rawScore={finalScore.dimensions.social_coop_capital.rawScore}
                explanation={explanation?.dimensions.social_coop_capital.explanation}
                verificationFlags={finalScore.dimensions.social_coop_capital.verificationFlags}
              />

              <DimensionCard
                dimension="record_completeness"
                label="Record Completeness"
                weight={finalScore.weights.record_completeness}
                rawScore={finalScore.dimensions.record_completeness.rawScore}
                explanation={explanation?.dimensions.record_completeness.explanation}
                verificationFlags={finalScore.dimensions.record_completeness.verificationFlags}
              />
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border-default/45">
              <button
                onClick={handleNavigateToActions}
                className="flex-1 h-11 bg-accent text-white hover:bg-accent-hover active:bg-accent-active font-semibold text-sm rounded-lg transition-colors cursor-pointer"
              >
                See my action plan
              </button>
              <button
                onClick={handleNavigateToShare}
                className="flex-1 h-11 border border-border-strong text-text-primary hover:bg-bg-inset font-semibold text-sm rounded-lg transition-colors cursor-pointer"
              >
                Share with a lender
              </button>
            </div>

          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: Lender View */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'lender' && (
          <div className="flex flex-col gap-6 print:p-0">
            
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-default/50 pb-4">
              <div className="space-y-1">
                <h1 className="text-xl md:text-2xl font-extrabold text-text-primary">
                  {profile.name}
                </h1>
                <p className="text-xs md:text-sm text-text-secondary font-semibold">
                  <span className="capitalize">{profile.region === 'kenya' ? 'Kisii, Kenya' : profile.region}</span> |{' '}
                  <span className="capitalize">{profile.primaryCrop}</span> | {profile.farmSizeAcres} acres
                </p>
                <div className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider mt-0.5">
                  Shared by farmer on {new Date(profile.lastUpdatedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <TierBadge tier={finalScore.tier} size="md" />
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 border border-border-strong text-text-primary hover:bg-bg-inset font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1 select-none"
                >
                  📥 Download Profile
                </button>
              </div>
            </div>

            {/* Score Overview */}
            <div className="bg-bg-card border border-border-default rounded-xl p-5 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="text-center md:text-left space-y-1.5 flex-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-tertiary">
                  Composite Credit Score
                </h3>
                <div className="flex items-baseline justify-center md:justify-start gap-1">
                  <span className="text-5xl font-black text-text-primary tracking-tight">
                    {finalScore.totalScore.toFixed(1)}
                  </span>
                  <span className="text-sm font-bold text-text-tertiary">/100</span>
                </div>
                <div className="text-xs font-semibold text-text-secondary flex flex-wrap gap-2 items-center justify-center md:justify-start">
                  <span>Score calculated with {isCustomWeights ? 'custom' : 'default'} weights.</span>
                  <Link
                    href={
                      isCustomWeights
                        ? `/lender/configure?farmerId=${profile.farmerId}&w_fin=${w_fin}&w_prod=${w_prod}&w_clim=${w_clim}&w_soc=${w_soc}&w_comp=${w_comp}`
                        : `/lender/configure?farmerId=${profile.farmerId}`
                    }
                    className="text-accent hover:underline font-bold"
                  >
                    [Configure weights →]
                  </Link>
                  {isCustomWeights && (
                    <Link
                      href={`/demo/${profile.farmerId}?view=lender`}
                      className="text-text-tertiary hover:text-text-secondary underline"
                    >
                      Reset
                    </Link>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-center gap-1 border-t md:border-t-0 md:border-l border-border-default/60 pt-4 md:pt-0 md:pl-6">
                <span className="text-xs font-bold uppercase tracking-wider text-text-tertiary">
                  Assessed Tier
                </span>
                <TierBadge tier={finalScore.tier} size="lg" />
              </div>
            </div>

            {/* Peer Benchmark Card (Neo4j) */}
            <PeerBenchmarkCard
              benchmark={peerBenchmark}
              primaryCrop={profile.primaryCrop}
              farmSizeAcres={profile.farmSizeAcres}
            />

            {/* Dimension Breakdown Accordion Table */}
            <div className="bg-bg-card border border-border-default rounded-xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 bg-bg-inset border-b border-border-default">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                  Audit Breakdown & Verification Flags
                </h3>
              </div>
              
              <div className="divide-y divide-border-default">
                {/* 1. Financial Behaviour */}
                <div>
                  <button
                    onClick={() => toggleRow('financial')}
                    className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-bg-page/40 transition-colors cursor-pointer"
                  >
                    <div className="flex-1 grid grid-cols-3 gap-2 items-center">
                      <span className="text-sm font-bold text-text-primary col-span-1.5">Financial Behaviour</span>
                      <span className="text-sm font-semibold text-text-secondary text-right">{finalScore.dimensions.financial_behaviour.rawScore.toFixed(0)}/100</span>
                      <span className="text-[11px] font-bold text-text-tertiary text-right">wt: {(finalScore.weights.financial_behaviour * 100).toFixed(0)}%</span>
                    </div>
                    <span className="text-text-tertiary text-xs ml-3">{expandedRow === 'financial' ? '▲' : '▼'}</span>
                  </button>
                  {expandedRow === 'financial' && (
                    <div className="px-4 pb-4 pt-1 bg-bg-page/20 space-y-3">
                      <div className="text-xs text-text-secondary space-y-2 border-t border-border-default/40 pt-2.5">
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <span className="font-bold text-text-primary block">Mobile Money Regularity</span>
                            <span className="capitalize">{profile.financial.mobileMoneyRegularity} usage ({profile.financial.mobileMoneyMonthlyVolume ? `${profile.financial.mobileMoneyMonthlyVolume} KES/mo` : '0 KES'})</span>
                          </div>
                          <VerificationBadge status={profile.financial.verificationStatus.mobileMoneyRegularity} />
                        </div>
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <span className="font-bold text-text-primary block">Savings Group Membership</span>
                            <span>{profile.financial.savingsGroupMember ? `Yes (${profile.financial.savingsGroupContributionRegularity || 'no'} contributions)` : 'No'}</span>
                          </div>
                          <VerificationBadge status={profile.financial.verificationStatus.savingsGroupMember} />
                        </div>
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <span className="font-bold text-text-primary block">Cooperative Loan History</span>
                            <span>{profile.financial.priorInputCreditCycles} cycles: {profile.financial.priorRepaymentOutcomes.join(', ') || 'No previous loans'}</span>
                          </div>
                          <VerificationBadge status={profile.financial.verificationStatus.priorRepaymentOutcomes} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Farm Productivity */}
                <div>
                  <button
                    onClick={() => toggleRow('productivity')}
                    className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-bg-page/40 transition-colors cursor-pointer"
                  >
                    <div className="flex-1 grid grid-cols-3 gap-2 items-center">
                      <span className="text-sm font-bold text-text-primary col-span-1.5">Farm Productivity</span>
                      <span className="text-sm font-semibold text-text-secondary text-right">{finalScore.dimensions.farm_productivity.rawScore.toFixed(0)}/100</span>
                      <span className="text-[11px] font-bold text-text-tertiary text-right">wt: {(finalScore.weights.farm_productivity * 100).toFixed(0)}%</span>
                    </div>
                    <span className="text-text-tertiary text-xs ml-3">{expandedRow === 'productivity' ? '▲' : '▼'}</span>
                  </button>
                  {expandedRow === 'productivity' && (
                    <div className="px-4 pb-4 pt-1 bg-bg-page/20 space-y-3">
                      <div className="text-xs text-text-secondary space-y-2 border-t border-border-default/40 pt-2.5">
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <span className="font-bold text-text-primary block">Yield Last Season</span>
                            <span>{profile.productivity.yieldLastSeason ? `${profile.productivity.yieldLastSeason} kg/acre` : 'Missing yield records'}</span>
                          </div>
                          <VerificationBadge status={profile.productivity.verificationStatus.yieldLastSeason} />
                        </div>
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <span className="font-bold text-text-primary block">GPS Boundary Confirmation</span>
                            <span>{profile.productivity.gpsConfirmed ? 'Confirmed coordinates' : 'No confirmed boundary'}</span>
                          </div>
                          <VerificationBadge status={profile.productivity.verificationStatus.gpsConfirmed} />
                        </div>
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <span className="font-bold text-text-primary block">Soil Quality Index (derived)</span>
                            <span>{profile.productivity.soilQualityIndex ? `${profile.productivity.soilQualityIndex}/100 Index` : 'Pending SoilGrids'}</span>
                          </div>
                          <VerificationBadge status={profile.productivity.verificationStatus.soilQualityIndex} fieldName="soilQualityIndex" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Climate Resilience */}
                <div>
                  <button
                    onClick={() => toggleRow('climate')}
                    className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-bg-page/40 transition-colors cursor-pointer"
                  >
                    <div className="flex-1 grid grid-cols-3 gap-2 items-center">
                      <span className="text-sm font-bold text-text-primary col-span-1.5">Climate Resilience</span>
                      <span className="text-sm font-semibold text-text-secondary text-right">{finalScore.dimensions.climate_resilience.rawScore.toFixed(0)}/100</span>
                      <span className="text-[11px] font-bold text-text-tertiary text-right">wt: {(finalScore.weights.climate_resilience * 100).toFixed(0)}%</span>
                    </div>
                    <span className="text-text-tertiary text-xs ml-3">{expandedRow === 'climate' ? '▲' : '▼'}</span>
                  </button>
                  {expandedRow === 'climate' && (
                    <div className="px-4 pb-4 pt-1 bg-bg-page/20 space-y-3">
                      <div className="text-xs text-text-secondary space-y-2 border-t border-border-default/40 pt-2.5">
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <span className="font-bold text-text-primary block">Historical Precipitation index</span>
                            <span>SPEI: {profile.climate.droughtIndexLastSeason?.toFixed(1) || '0'}, Rainfall: {profile.climate.rainfallIndexLastSeason || 0} mm</span>
                          </div>
                          <VerificationBadge status={profile.climate.verificationStatus.rainfallIndexLastSeason} fieldName="rainfallIndexLastSeason" />
                        </div>
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <span className="font-bold text-text-primary block">Climate Adaptive Toggles</span>
                            <span>
                              Irrigation: {profile.climate.hasIrrigationAccess ? 'Yes' : 'No'}, Drought Seeds:{' '}
                              {profile.climate.usesDroughtTolerantVarieties ? 'Yes' : 'No'}, Soil Conservation:{' '}
                              {profile.climate.practisesSoilConservation ? 'Yes' : 'No'}
                            </span>
                          </div>
                          <VerificationBadge status={profile.climate.verificationStatus.adaptivePractices} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Social & Cooperative Capital */}
                <div>
                  <button
                    onClick={() => toggleRow('social')}
                    className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-bg-page/40 transition-colors cursor-pointer"
                  >
                    <div className="flex-1 grid grid-cols-3 gap-2 items-center">
                      <span className="text-sm font-bold text-text-primary col-span-1.5">Social & Cooperative Capital</span>
                      <span className="text-sm font-semibold text-text-secondary text-right">{finalScore.dimensions.social_coop_capital.rawScore.toFixed(0)}/100</span>
                      <span className="text-[11px] font-bold text-text-tertiary text-right">wt: {(finalScore.weights.social_coop_capital * 100).toFixed(0)}%</span>
                    </div>
                    <span className="text-text-tertiary text-xs ml-3">{expandedRow === 'social' ? '▲' : '▼'}</span>
                  </button>
                  {expandedRow === 'social' && (
                    <div className="px-4 pb-4 pt-1 bg-bg-page/20 space-y-3">
                      <div className="text-xs text-text-secondary space-y-2 border-t border-border-default/40 pt-2.5">
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <span className="font-bold text-text-primary block">Cooperative Membership</span>
                            <span>{profile.social.cooperativeName ? `${profile.social.cooperativeName} (${profile.social.cooperativeMemberSinceSeasons} seasons)` : 'No cooperative membership'}</span>
                          </div>
                          <VerificationBadge status={profile.social.verificationStatus.cooperativeMembership} />
                        </div>
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <span className="font-bold text-text-primary block">Stable Buyer/Off-taker Agreement</span>
                            <span>{profile.social.hasStableOfftaker ? `Yes (${profile.social.offtakerSeasons} seasons)` : 'None'}</span>
                          </div>
                          <VerificationBadge status={profile.social.verificationStatus.offtakerRelationship} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. Record Completeness */}
                <div>
                  <button
                    onClick={() => toggleRow('completeness')}
                    className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-bg-page/40 transition-colors cursor-pointer"
                  >
                    <div className="flex-1 grid grid-cols-3 gap-2 items-center">
                      <span className="text-sm font-bold text-text-primary col-span-1.5">Record Completeness</span>
                      <span className="text-sm font-semibold text-text-secondary text-right">{finalScore.dimensions.record_completeness.rawScore.toFixed(0)}/100</span>
                      <span className="text-[11px] font-bold text-text-tertiary text-right">wt: {(finalScore.weights.record_completeness * 100).toFixed(0)}%</span>
                    </div>
                    <span className="text-text-tertiary text-xs ml-3">{expandedRow === 'completeness' ? '▲' : '▼'}</span>
                  </button>
                  {expandedRow === 'completeness' && (
                    <div className="px-4 pb-4 pt-1 bg-bg-page/20 space-y-3">
                      <div className="text-xs text-text-secondary space-y-2 border-t border-border-default/40 pt-2.5">
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <span className="font-bold text-text-primary block">Profile Completion Percentage</span>
                            <span>{profile.completeness.completenessPercentage}% fields provided</span>
                          </div>
                          <VerificationBadge status="verified" />
                        </div>
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <span className="font-bold text-text-primary block">Score Multiplier Impact</span>
                            <span>Completeness Multiplier: ×{(score.dimensions.record_completeness.completenessMultiplier || 1).toFixed(2)} applied to weighted total</span>
                          </div>
                          <VerificationBadge status="verified" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Climate Exposure Context (Lender Only) */}
            <div className="bg-bg-card border border-border-default rounded-xl p-5 shadow-sm flex flex-col gap-3">
              <div className="text-[11px] font-bold tracking-wider uppercase text-text-tertiary">
                Climate Context (not a score input)
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl" role="img" aria-label="sun">🌦️</span>
                <div>
                  <div className="text-sm font-bold text-text-primary">
                    Climate Risk Exposure: <span className="capitalize">{profile.climate.climateRiskLevel || 'Medium'}</span>
                  </div>
                  <div className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                    Based on Open-Meteo rainfall and SPEI drought history for coordinates ({profile.location.latitude.toFixed(4)}, {profile.location.longitude.toFixed(4)}).
                  </div>
                </div>
              </div>
              <div className="border-t border-border-default/45 pt-3 mt-1 flex flex-col gap-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-text-secondary font-medium">Farmer&apos;s Adaptive Practices Score:</span>
                  <span className="font-bold text-text-primary">{finalScore.dimensions.climate_resilience.rawScore.toFixed(0)}/100</span>
                </div>
                <p className="text-[11px] text-text-tertiary mt-1 italic">
                  Note: A high-risk zone farmer who adopts resilient practices scores higher than a low-risk zone farmer who does not.
                </p>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
