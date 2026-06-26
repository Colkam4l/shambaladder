// app/actions/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FarmerProfile, CompositeScore, ExplanationResponse, ScoredAction, CreditTier } from '@/types';
import { determineTier } from '@/lib/scoring/tiers';
import { TierBadge } from '@/components/ui/TierBadge';

export default function ActionList() {
  const router = useRouter();

  const [profile, setProfile] = useState<FarmerProfile | null>(null);
  const [score, setScore] = useState<CompositeScore | null>(null);
  const [explanation, setExplanation] = useState<ExplanationResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Checked state for actions, keyed by action rank or text
  const [completedRanks, setCompletedRanks] = useState<number[]>([]);

  useEffect(() => {
    const farmerId = localStorage.getItem('activeFarmerId');
    const profileJson = localStorage.getItem('activeProfile');
    const scoreJson = localStorage.getItem('activeScore');
    const explanationJson = localStorage.getItem('activeExplanation');

    if (!farmerId || !profileJson || !scoreJson || !explanationJson) {
      router.replace('/demo');
      return;
    }

    const loadedProfile = JSON.parse(profileJson);
    const loadedScore = JSON.parse(scoreJson);
    const loadedExplanation = JSON.parse(explanationJson);

    setProfile(loadedProfile);
    setScore(loadedScore);
    setExplanation(loadedExplanation);

    // Load completed actions from localStorage
    const savedCompleted = localStorage.getItem(`completedActions_${farmerId}`);
    if (savedCompleted) {
      setCompletedRanks(JSON.parse(savedCompleted));
    }

    setLoading(false);
  }, [router]);

  if (loading || !profile || !score || !explanation) {
    return (
      <div className="min-h-screen bg-bg-page flex items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
          <p className="text-sm text-text-secondary font-medium">Loading action plan...</p>
        </div>
      </div>
    );
  }

  const actions = explanation.actionList || [];

  const handleToggleAction = (rank: number) => {
    let newCompleted: number[];
    if (completedRanks.includes(rank)) {
      newCompleted = completedRanks.filter((r) => r !== rank);
    } else {
      newCompleted = [...completedRanks, rank];
    }
    setCompletedRanks(newCompleted);
    localStorage.setItem(`completedActions_${profile.farmerId}`, JSON.stringify(newCompleted));
  };

  const handleCompleteAll = () => {
    const allRanks = actions.map((a) => a.rank);
    setCompletedRanks(allRanks);
    localStorage.setItem(`completedActions_${profile.farmerId}`, JSON.stringify(allRanks));
  };

  const handleReset = () => {
    setCompletedRanks([]);
    localStorage.removeItem(`completedActions_${profile.farmerId}`);
  };

  // Calculations for dynamic score progression
  const baseScore = score.totalScore;
  const completedImpactSum = actions
    .filter((a) => completedRanks.includes(a.rank))
    .reduce((sum, a) => sum + a.estimatedScoreImpact, 0);

  const totalImpactSum = actions.reduce((sum, a) => sum + a.estimatedScoreImpact, 0);

  const projectedScore = Math.min(100, baseScore + completedImpactSum);
  const maxProjectedScore = Math.min(100, baseScore + totalImpactSum);

  const projectedTier = determineTier(projectedScore);
  const maxProjectedTier = determineTier(maxProjectedScore);

  const sortedActions = [...actions].sort((a, b) => {
    const aComp = completedRanks.includes(a.rank);
    const bComp = completedRanks.includes(b.rank);
    // Uncompleted first, then sort by rank
    if (aComp === bComp) return a.rank - b.rank;
    return aComp ? 1 : -1;
  });

  const getDimensionLabel = (dim: string) => {
    switch (dim) {
      case 'financial_behaviour': return 'Financial Behaviour';
      case 'farm_productivity': return 'Farm Productivity';
      case 'climate_resilience': return 'Climate Resilience';
      case 'social_coop_capital': return 'Social Capital';
      case 'record_completeness': return 'Record Completeness';
      default: return dim;
    }
  };

  const effortColors = {
    quick: 'bg-success-bg text-success-text border-success-border/30',
    medium: 'bg-warning-bg text-warning-text border-warning-border/30',
    hard: 'bg-info-bg text-info-text border-info-border/30',
  };

  return (
    <div className="min-h-screen bg-bg-page text-text-primary font-sans px-4 py-8 md:px-8">
      <div className="max-w-[680px] mx-auto flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-border-default/45 pb-4">
          <Link href={`/demo/${profile.farmerId}`} className="text-sm font-semibold text-accent hover:text-accent-hover transition-colors flex items-center gap-1">
            ← Dashboard
          </Link>
          <div className="h-4 w-px bg-border-default"></div>
          <div>
            <h1 className="text-lg md:text-xl font-extrabold text-text-primary">
              Your action plan
            </h1>
            <span className="text-xs text-text-secondary font-medium">
              Prepared for {profile.name}
            </span>
          </div>
        </div>

        {/* Subheading text */}
        <p className="text-sm text-text-secondary leading-relaxed font-medium -mt-2">
          These specific steps will improve your credit readiness. Completing actions gives immediate feedback on your score projection.
        </p>

        {/* Projected Score Progress Indicator */}
        <div className={`bg-bg-card border border-border-default rounded-xl p-5 shadow-sm space-y-4`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-tertiary">
                Projected Score Progression
              </h3>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-text-primary tracking-tight">
                  {projectedScore.toFixed(1)}
                </span>
                <span className="text-xs font-semibold text-text-secondary">
                  (base: {baseScore.toFixed(1)} + {completedImpactSum.toFixed(0)} pts completed)
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-text-secondary uppercase">Projected Tier:</span>
              <TierBadge tier={projectedTier} size="sm" />
            </div>
          </div>

          {/* Progress bar to max potential */}
          <div className="space-y-1.5">
            <div className="h-2.5 w-full bg-bg-inset rounded-full overflow-hidden relative">
              {/* Max potential marker */}
              <div
                className="absolute top-0 bottom-0 bg-accent-muted/20 border-r border-accent/25"
                style={{ width: `${maxProjectedScore}%` }}
              />
              {/* Current projected fill */}
              <div
                className="h-full bg-accent transition-all duration-500 ease-out absolute left-0 top-0"
                style={{ width: `${projectedScore}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-bold text-text-tertiary uppercase tracking-wider">
              <span>Current Score ({baseScore.toFixed(0)})</span>
              <span>Potential Score ({maxProjectedScore.toFixed(0)})</span>
            </div>
          </div>

          <div className="flex gap-3 justify-between items-center pt-2 border-t border-border-default/45 text-xs">
            <span className="text-text-secondary font-medium">
              Complete all actions to reach <span className="font-bold text-text-primary capitalize">{maxProjectedTier} tier</span>.
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleCompleteAll}
                className="text-xs text-accent hover:text-accent-hover font-bold transition-colors cursor-pointer"
              >
                Complete All
              </button>
              <span className="text-text-tertiary">|</span>
              <button
                onClick={handleReset}
                className="text-xs text-text-tertiary hover:text-text-secondary font-bold transition-colors cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Actions List */}
        <div className="flex flex-col gap-4">
          {sortedActions.length === 0 ? (
            <div className="bg-bg-card border border-border-default rounded-xl p-8 text-center text-text-tertiary text-sm">
              No recommendations generated. Check your profile inputs.
            </div>
          ) : (
            sortedActions.map((act) => {
              const isChecked = completedRanks.includes(act.rank);
              const effortStyle = effortColors[act.effort as keyof typeof effortColors] || '';

              return (
                <div
                  key={act.rank}
                  className={`bg-bg-card border border-border-default rounded-xl p-5 shadow-sm flex items-start gap-4 transition-all duration-300 ${
                    isChecked ? 'opacity-55 border-border-default/50 bg-bg-inset/30' : ''
                  }`}
                >
                  {/* Left rank circle */}
                  <div
                    onClick={() => handleToggleAction(act.rank)}
                    className={`h-7 w-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold transition-all duration-200 select-none cursor-pointer ${
                      isChecked
                        ? 'bg-accent text-white border border-accent shadow-sm'
                        : 'bg-bg-inset text-text-secondary border border-border-strong hover:border-accent hover:text-accent'
                    }`}
                  >
                    {isChecked ? '✓' : act.rank}
                  </div>

                  {/* Middle content */}
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
                      <h3
                        onClick={() => handleToggleAction(act.rank)}
                        className={`text-sm font-bold text-text-primary leading-snug cursor-pointer select-none ${
                          isChecked ? 'line-through text-text-tertiary' : ''
                        }`}
                      >
                        {act.action.split('by')[0] /* fallback parsing to shorten title if long */}
                        {act.action.length > 50 ? act.action.substring(0, 50) + '...' : act.action}
                      </h3>
                    </div>

                    {/* Metadata Badges */}
                    <div className="flex flex-wrap gap-2">
                      <span className="text-[10px] font-bold text-text-tertiary bg-bg-inset px-2 py-0.5 rounded border border-border-default/60 uppercase">
                        {getDimensionLabel(act.targetDimension)}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${effortStyle}`}>
                        {act.effort} Effort
                      </span>
                    </div>

                    <p className="text-xs md:text-sm text-text-secondary leading-relaxed font-normal pt-1">
                      {act.action}
                    </p>
                  </div>

                  {/* Right impact indicator & Checkbox */}
                  <div className="flex flex-col items-end justify-between self-stretch flex-shrink-0">
                    <span className="text-sm font-black text-accent leading-none">
                      +{act.estimatedScoreImpact} pts
                    </span>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleAction(act.rank)}
                      className="h-4.5 w-4.5 rounded border-border-strong text-accent focus:ring-accent accent-accent cursor-pointer"
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
