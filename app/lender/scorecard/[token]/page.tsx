// app/lender/scorecard/[token]/page.tsx
'use client';

import React, { useEffect, useState, use } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { SharedProfile } from '@/types';
import { calculateComposite } from '../../../../lib/scoring';
import { TierBadge } from '@/components/ui/TierBadge';
import { VerificationBadge } from '@/components/ui/VerificationBadge';
import { Skeleton } from '@/components/ui/Skeleton';
import { PeerBenchmarkCard } from '@/components/scorecard/PeerBenchmarkCard';
import { LenderDisclaimerBanner } from '@/components/scorecard/LenderDisclaimerBanner';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default function LenderScorecard({ params }: PageProps) {
  const { token } = use(params);

  const [sharedProfile, setSharedProfile] = useState<SharedProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Accordion state
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Read search params for custom weights
  const searchParams = useSearchParams();
  const w_fin = searchParams.get('w_fin');
  const w_prod = searchParams.get('w_prod');
  const w_clim = searchParams.get('w_clim');
  const w_soc = searchParams.get('w_soc');
  const w_comp = searchParams.get('w_comp');

  useEffect(() => {
    async function loadSharedData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/share/${token}`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Profile not found. This link may have expired or been revoked by the farmer.');
          }
          throw new Error('Could not retrieve the shared credit profile.');
        }
        const data = await res.json();
        setSharedProfile(data.sharedProfile);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'An error occurred.');
      } finally {
        setLoading(false);
      }
    }
    loadSharedData();
  }, [token]);

  const toggleRow = (rowName: string) => {
    setExpandedRow(expandedRow === rowName ? null : rowName);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-page text-text-primary px-4 py-8 md:px-8 font-sans">
        <div className="max-w-[680px] mx-auto space-y-6">
          <Skeleton className="h-10 w-full rounded" />
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-[200px] w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !sharedProfile) {
    return (
      <div className="min-h-screen bg-bg-page text-text-primary flex flex-col items-center justify-center p-4 font-sans">
        <div className="bg-bg-card border border-border-default rounded-xl p-6 shadow-sm max-w-md w-full text-center space-y-4">
          <span className="text-4xl">🔒</span>
          <h2 className="text-lg font-bold">Access Restricted</h2>
          <p className="text-sm text-text-secondary">
            {error || 'The requested credit scorecard is unavailable.'}
          </p>
        </div>
      </div>
    );
  }

  const { profileSnapshot: profile, scoreSnapshot: defaultScore, explanationSnapshot: explanation } = sharedProfile;
  const peerBenchmark = profile.social.peerBenchmark || null;


  let score = defaultScore;
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
        score = calculateComposite(profile, {
          financial_behaviour: finVal / 100,
          farm_productivity: prodVal / 100,
          climate_resilience: climVal / 100,
          social_coop_capital: socVal / 100,
          record_completeness: compVal / 100,
        });
      } catch (err) {
        console.error('Error recalculating client-side score:', err);
      }
    }
  }

  return (
    <div className="min-h-screen bg-bg-page text-text-primary font-sans flex flex-col">
      {/* Lender Disclaimer Banner */}
      <LenderDisclaimerBanner />

      {/* Main Container */}
      <div className="flex-1 w-full max-w-[680px] mx-auto px-4 py-6 md:py-8 flex flex-col gap-6">
        
        {/* Header Block */}
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
              Shared by farmer on {new Date(sharedProfile.sharedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
              {sharedProfile.lenderName && ` for ${sharedProfile.lenderName}`}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <TierBadge tier={score.tier} size="md" />
            <button
              onClick={() => window.print()}
              className="px-3.5 py-1.5 border border-border-strong text-text-primary hover:bg-bg-inset font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1 select-none"
            >
              📥 Download Profile
            </button>
          </div>
        </div>

        {/* Score Card Panel */}
        <div className="bg-bg-card border border-border-default rounded-xl p-5 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left space-y-1.5 flex-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-tertiary">
              Composite Credit Score
            </h3>
            <div className="flex items-baseline justify-center md:justify-start gap-1">
              <span className="text-5xl font-black text-text-primary tracking-tight">
                {score.totalScore.toFixed(1)}
              </span>
              <span className="text-sm font-bold text-text-tertiary">/100</span>
            </div>
            <div className="text-xs font-semibold text-text-secondary flex flex-wrap gap-2 items-center justify-center md:justify-start">
              <span>Score calculated with {isCustomWeights ? 'custom' : 'default'} weights.</span>
              <Link
                href={
                  isCustomWeights
                    ? `/lender/configure?token=${token}&w_fin=${w_fin}&w_prod=${w_prod}&w_clim=${w_clim}&w_soc=${w_soc}&w_comp=${w_comp}`
                    : `/lender/configure?token=${token}`
                }
                className="text-accent hover:underline font-bold"
              >
                [Configure weights →]
              </Link>
              {isCustomWeights && (
                <Link
                  href={`/lender/scorecard/${token}`}
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
            <TierBadge tier={score.tier} size="lg" />
          </div>
        </div>

        {/* Neo4j Peer Benchmark Card */}
        <PeerBenchmarkCard
          benchmark={peerBenchmark}
          primaryCrop={profile.primaryCrop}
          farmSizeAcres={profile.farmSizeAcres}
        />

        {/* Audit Accordion Breakdown */}
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
                  <span className="text-sm font-bold text-text-primary">Financial Behaviour</span>
                  <span className="text-sm font-semibold text-text-secondary text-right">{score.dimensions.financial_behaviour.rawScore.toFixed(0)}/100</span>
                  <span className="text-[11px] font-bold text-text-tertiary text-right">wt: {(score.weights.financial_behaviour * 100).toFixed(0)}%</span>
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
                  <span className="text-sm font-bold text-text-primary">Farm Productivity</span>
                  <span className="text-sm font-semibold text-text-secondary text-right">{score.dimensions.farm_productivity.rawScore.toFixed(0)}/100</span>
                  <span className="text-[11px] font-bold text-text-tertiary text-right">wt: {(score.weights.farm_productivity * 100).toFixed(0)}%</span>
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
                  <span className="text-sm font-bold text-text-primary">Climate Resilience</span>
                  <span className="text-sm font-semibold text-text-secondary text-right">{score.dimensions.climate_resilience.rawScore.toFixed(0)}/100</span>
                  <span className="text-[11px] font-bold text-text-tertiary text-right">wt: {(score.weights.climate_resilience * 100).toFixed(0)}%</span>
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
                  <span className="text-sm font-bold text-text-primary">Social & Cooperative Capital</span>
                  <span className="text-sm font-semibold text-text-secondary text-right">{score.dimensions.social_coop_capital.rawScore.toFixed(0)}/100</span>
                  <span className="text-[11px] font-bold text-text-tertiary text-right">wt: {(score.weights.social_coop_capital * 100).toFixed(0)}%</span>
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
                  <span className="text-sm font-bold text-text-primary">Record Completeness</span>
                  <span className="text-sm font-semibold text-text-secondary text-right">{score.dimensions.record_completeness.rawScore.toFixed(0)}/100</span>
                  <span className="text-[11px] font-bold text-text-tertiary text-right">wt: {(score.weights.record_completeness * 100).toFixed(0)}%</span>
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

        {/* Climate Exposure Context */}
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
              <span className="font-bold text-text-primary">{score.dimensions.climate_resilience.rawScore.toFixed(0)}/100</span>
            </div>
            <p className="text-[11px] text-text-tertiary mt-1 italic">
              Note: A high-risk zone farmer who adapts resilient practices scores higher than a low-risk zone farmer who does not.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
