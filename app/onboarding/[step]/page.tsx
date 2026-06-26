// app/onboarding/[step]/page.tsx
'use client';

import React, { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ step: string }>;
}

interface DraftProfile {
  name: string;
  country: string;
  district: string;
  primaryCrop: string;
  farmSizeAcres: number;
  currentSeason: string;
  mobileMoneyRegularity: 'none' | 'irregular' | 'monthly' | 'weekly';
  mobileMoneyMonthlyVolume: number;
  savingsGroupMember: boolean;
  savingsGroupContributionRegularity: 'none' | 'irregular' | 'regular';
  priorInputCreditCycles: number;
  priorRepaymentOutcomes: ('on_time' | 'late' | 'default')[];
  yieldLastSeason: number;
  yieldPreviousSeason: number;
  cropDiversity: number;
  usesImprovedSeeds: boolean;
  usesFertilizer: boolean;
  usesAgrochemicals: boolean;
  gpsConfirmed: boolean;
  hasIrrigationAccess: boolean;
  usesDroughtTolerantVarieties: boolean;
  practisesSoilConservation: boolean;
  hasPostHarvestStorage: boolean;
  hasCropInsurance: boolean;
}

const DEFAULT_DRAFT: DraftProfile = {
  name: '',
  country: 'Kenya',
  district: '',
  primaryCrop: 'maize',
  farmSizeAcres: 2.0,
  currentSeason: 'Long Rains 2026',
  mobileMoneyRegularity: 'none',
  mobileMoneyMonthlyVolume: 0,
  savingsGroupMember: false,
  savingsGroupContributionRegularity: 'none',
  priorInputCreditCycles: 0,
  priorRepaymentOutcomes: [],
  yieldLastSeason: 500,
  yieldPreviousSeason: 450,
  cropDiversity: 1,
  usesImprovedSeeds: false,
  usesFertilizer: false,
  usesAgrochemicals: false,
  gpsConfirmed: false,
  hasIrrigationAccess: false,
  usesDroughtTolerantVarieties: false,
  practisesSoilConservation: false,
  hasPostHarvestStorage: false,
  hasCropInsurance: false,
};

export default function OnboardingStepForm({ params }: PageProps) {
  const router = useRouter();
  const { step: stepStr } = use(params);
  const currentStep = parseInt(stepStr) || 1;

  const [draft, setDraft] = useState<DraftProfile>(DEFAULT_DRAFT);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Climate Risk display value (fetched dynamically in Step 4)
  const [climateRisk, setClimateRisk] = useState<string>('Loading...');

  // Step 5 Consent checklist
  const [consentProductivity, setConsentProductivity] = useState(false);
  const [consentFinancial, setConsentFinancial] = useState(false);
  const [consentCoop, setConsentCoop] = useState(false);
  const [consentDisclaimer, setConsentDisclaimer] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    async function loadSavedDraft() {
      try {
        const stored = localStorage.getItem('onboarding_draft');
        if (stored) {
          const parsed = JSON.parse(stored);
          setDraft({ ...DEFAULT_DRAFT, ...parsed });
        }
      } catch (err) {
        console.error('Failed to load onboarding draft:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSavedDraft();
  }, []);

  // Save state to localStorage whenever draft changes
  const saveDraft = (updated: DraftProfile) => {
    setDraft(updated);
    try {
      localStorage.setItem('onboarding_draft', JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save onboarding draft:', err);
    }
  };

  // Fetch Climate Risk Level on Step 4
  useEffect(() => {
    if (currentStep === 4) {
      async function fetchClimateRisk() {
        try {
          const res = await fetch('/api/climate?latitude=-0.6698&longitude=37.2655');
          if (res.ok) {
            const data = await res.json();
            setClimateRisk(data.climateRiskLevel || 'Medium');
          } else {
            setClimateRisk('Medium');
          }
        } catch {
          setClimateRisk('Medium');
        }
      }
      fetchClimateRisk();
    }
  }, [currentStep]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-page flex items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
          <p className="text-sm text-text-secondary font-medium">Loading form...</p>
        </div>
      </div>
    );
  }

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (currentStep === 1) {
      if (!draft.name.trim()) {
        setError('Please enter your full name.');
        return;
      }
      if (!draft.district.trim()) {
        setError('Please enter your District or County.');
        return;
      }
      if (draft.farmSizeAcres <= 0) {
        setError('Farm size must be greater than 0.');
        return;
      }
    } else if (currentStep === 2) {
      if (draft.mobileMoneyRegularity !== 'none' && draft.mobileMoneyMonthlyVolume <= 0) {
        setError('Please enter a valid monthly transaction volume.');
        return;
      }
      if (draft.priorInputCreditCycles > 0 && draft.priorRepaymentOutcomes.length < draft.priorInputCreditCycles) {
        setError('Please specify repayment outcomes for all credit cycles.');
        return;
      }
    } else if (currentStep === 3) {
      if (draft.yieldLastSeason <= 0) {
        setError('Please enter a valid yield for last season.');
        return;
      }
      if (draft.cropDiversity <= 0) {
        setError('Crop diversity must be at least 1.');
        return;
      }
    }

    // Go to next step
    router.push(`/onboarding/${currentStep + 1}`);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      router.push(`/onboarding/${currentStep - 1}`);
    } else {
      router.push('/demo');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentProductivity || !consentFinancial || !consentCoop || !consentDisclaimer) {
      setError('Please agree to all consent statements to generate your score.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const farmerId = `custom-${Math.random().toString(36).substring(2, 9)}`;

      // 1. Fetch Soil Data
      let soilQualityIndex = 70;
      try {
        const soilRes = await fetch('/api/soil?latitude=-0.6698&longitude=37.2655');
        if (soilRes.ok) {
          const soilData = await soilRes.json();
          soilQualityIndex = soilData.soilQualityIndex || 70;
        }
      } catch (err) {
        console.warn('Soil API fallback used:', err);
      }

      // 2. Fetch Climate Data
      let rainfallIndex = 800;
      let droughtIndex = -0.1;
      let riskLevel = 'medium';
      try {
        const climRes = await fetch('/api/climate?latitude=-0.6698&longitude=37.2655');
        if (climRes.ok) {
          const climData = await climRes.json();
          rainfallIndex = climData.rainfallIndexLastSeason || 800;
          droughtIndex = climData.droughtIndexLastSeason || -0.1;
          riskLevel = climData.climateRiskLevel || 'medium';
        }
      } catch (err) {
        console.warn('Climate API fallback used:', err);
      }

      // 3. Construct Farmer Profile object
      const profilePayload = {
        farmerId,
        name: draft.name,
        location: { latitude: -0.6698, longitude: 37.2655 },
        region: draft.country.toLowerCase() as 'kenya' | 'uganda' | 'rwanda',
        primaryCrop: draft.primaryCrop.toLowerCase(),
        farmSizeAcres: Number(draft.farmSizeAcres),
        currentSeason: draft.currentSeason,
        financial: {
          mobileMoneyRegularity: draft.mobileMoneyRegularity,
          mobileMoneyMonthlyVolume: draft.mobileMoneyRegularity === 'none' ? null : Number(draft.mobileMoneyMonthlyVolume),
          savingsGroupMember: draft.savingsGroupMember,
          savingsGroupContributionRegularity: draft.savingsGroupMember ? draft.savingsGroupContributionRegularity : 'none',
          priorInputCreditCycles: Number(draft.priorInputCreditCycles),
          priorRepaymentOutcomes: draft.priorRepaymentOutcomes.slice(0, draft.priorInputCreditCycles),
          verificationStatus: {
            mobileMoneyRegularity: 'self_reported',
            savingsGroupMember: 'self_reported',
            priorRepaymentOutcomes: draft.priorInputCreditCycles > 0 ? 'self_reported' : 'missing',
          },
        },
        productivity: {
          yieldLastSeason: Number(draft.yieldLastSeason),
          yieldPreviousSeason: draft.yieldPreviousSeason ? Number(draft.yieldPreviousSeason) : null,
          cropDiversity: Number(draft.cropDiversity),
          usesImprovedSeeds: draft.usesImprovedSeeds,
          usesFertilizer: draft.usesFertilizer,
          usesAgrochemicals: draft.usesAgrochemicals,
          gpsConfirmed: draft.gpsConfirmed,
          farmBoundaryCoordinates: draft.gpsConfirmed ? [{ latitude: -0.6698, longitude: 37.2655 }] : null,
          soilQualityIndex,
          soilDataSource: 'soilgrids',
          verificationStatus: {
            yieldLastSeason: 'self_reported',
            gpsConfirmed: draft.gpsConfirmed ? 'self_reported' : 'missing',
            soilQualityIndex: 'third_party',
          },
        },
        climate: {
          rainfallIndexLastSeason: rainfallIndex,
          droughtIndexLastSeason: droughtIndex,
          climateRiskLevel: riskLevel,
          hasIrrigationAccess: draft.hasIrrigationAccess,
          usesDroughtTolerantVarieties: draft.usesDroughtTolerantVarieties,
          practisesSoilConservation: draft.practisesSoilConservation,
          hasPostHarvestStorage: draft.hasPostHarvestStorage,
          hasCropInsurance: draft.hasCropInsurance,
          verificationStatus: {
            rainfallIndexLastSeason: 'third_party',
            adaptivePractices: 'self_reported',
          },
        },
        social: {
          cooperativeId: 'coop-kisii-001',
          cooperativeName: 'Kisii Maize Cooperative',
          cooperativeMemberSinceSeasons: 2,
          hasStableOfftaker: false,
          offtakerSeasons: 0,
          peerBenchmark: null,
          cooperativeRepaymentRate: 0.70,
          verificationStatus: {
            cooperativeMembership: 'self_reported',
            offtakerRelationship: 'missing',
            peerBenchmark: 'graph_derived',
          },
        },
        completeness: {
          shamboproProfileComplete: true,
          gpsConfirmed: draft.gpsConfirmed,
          entryConsistencyScore: 0.95,
          internalConsistencyScore: 0.90,
          completenessPercentage: 90,
        },
        createdAt: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
        consentGrantedAt: new Date().toISOString(),
        sharedProfiles: [],
      };

      // 4. Fetch Peer Benchmark from Neo4j API
      let peerBenchmark = null;
      try {
        const peerRes = await fetch(
          `/api/neo4j/peer?farmerId=${farmerId}&cooperativeId=coop-kisii-001&primaryCrop=${draft.primaryCrop.toLowerCase()}&farmSizeAcres=${draft.farmSizeAcres}`
        );
        if (peerRes.ok) {
          const peerData = await peerRes.json();
          peerBenchmark = peerData.benchmark || null;
          profilePayload.social.peerBenchmark = peerBenchmark;
        }
      } catch (err) {
        console.warn('Neo4j Peer API fallback used:', err);
      }

      // 5. Call Live Scoring Engine API
      const scoreRes = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: profilePayload }),
      });
      if (!scoreRes.ok) throw new Error('Scoring engine failed to compute your score.');
      const { score } = await scoreRes.json();

      // 6. Call LLM Explanation API
      const explainRes = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: profilePayload, score, peerBenchmark }),
      });
      if (!explainRes.ok) throw new Error('Explanation engine failed to generate dashboard context.');
      const explanation = await explainRes.json();

      // 7. Persist complete custom farmer workspace to client storage
      localStorage.setItem('activeFarmerId', farmerId);
      localStorage.setItem('activeProfile', JSON.stringify(profilePayload));
      localStorage.setItem('activeScore', JSON.stringify(score));
      localStorage.setItem('activeExplanation', JSON.stringify(explanation));
      localStorage.setItem('activePeerBenchmark', JSON.stringify(peerBenchmark));

      // 8. Reset draft data and redirect to dashboard
      localStorage.removeItem('onboarding_draft');
      router.replace('/dashboard');
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : 'An error occurred during score generation.';
      setError(errMsg);
      setSubmitting(false);
    }
  };

  const updateRepaymentOutcome = (index: number, outcome: 'on_time' | 'late' | 'default') => {
    const outcomes = [...draft.priorRepaymentOutcomes];
    outcomes[index] = outcome;
    saveDraft({ ...draft, priorRepaymentOutcomes: outcomes });
  };

  return (
    <div className="min-h-screen bg-bg-page text-text-primary font-sans px-4 py-10 md:px-8">
      <div className="max-w-[540px] mx-auto flex flex-col gap-6">
        
        {/* Top Header */}
        <header className="flex justify-between items-center border-b border-border-default/45 pb-4">
          <div className="text-xl font-extrabold text-accent tracking-tight flex items-center gap-1">
            <span>ShambaLadder</span>
            <span className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded font-mono font-normal uppercase">Onboarding</span>
          </div>
          <button 
            onClick={handleBack}
            className="text-xs font-bold text-text-secondary hover:text-text-primary cursor-pointer select-none"
          >
            ← Exit
          </button>
        </header>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold text-text-secondary">
            <span>Step {currentStep} of 5</span>
            <span>{Math.round((currentStep / 5) * 100)}% Complete</span>
          </div>
          <div className="h-2 bg-bg-inset border border-border-default rounded-full overflow-hidden">
            <div 
              className="h-full bg-accent transition-all duration-300"
              style={{ width: `${(currentStep / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="bg-error-bg border border-error-border text-error-text p-4 rounded-xl text-center font-semibold text-sm">
            {error}
          </div>
        )}

        {/* Dynamic step rendering */}
        <form onSubmit={currentStep === 5 ? handleSubmit : handleNext} className="bg-bg-card border border-border-default rounded-xl p-6 shadow-sm space-y-6">
          
          {/* STEP 1: BASIC INFO */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-lg font-extrabold text-text-primary tracking-tight">Basic Farm Information</h2>
                <p className="text-xs text-text-secondary">Let&apos;s start with your location and primary crops.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider block">Full Name</label>
                <input 
                  type="text" 
                  value={draft.name}
                  onChange={(e) => saveDraft({ ...draft, name: e.target.value })}
                  placeholder="e.g. Jane Doe"
                  className="w-full h-11 px-3.5 bg-bg-inset border border-border-default focus:border-accent rounded-lg text-sm outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider block">Country</label>
                  <select
                    value={draft.country}
                    onChange={(e) => saveDraft({ ...draft, country: e.target.value })}
                    className="w-full h-11 px-3 bg-bg-inset border border-border-default focus:border-accent rounded-lg text-sm outline-none font-medium text-text-primary"
                  >
                    <option>Kenya</option>
                    <option>Uganda</option>
                    <option>Rwanda</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider block">District / County</label>
                  <input 
                    type="text" 
                    value={draft.district}
                    onChange={(e) => saveDraft({ ...draft, district: e.target.value })}
                    placeholder="e.g. Kisii"
                    className="w-full h-11 px-3.5 bg-bg-inset border border-border-default focus:border-accent rounded-lg text-sm outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider block">Primary Crop</label>
                  <select
                    value={draft.primaryCrop}
                    onChange={(e) => saveDraft({ ...draft, primaryCrop: e.target.value })}
                    className="w-full h-11 px-3 bg-bg-inset border border-border-default focus:border-accent rounded-lg text-sm outline-none font-medium text-text-primary capitalize"
                  >
                    <option value="maize">Maize</option>
                    <option value="beans">Beans</option>
                    <option value="coffee">Coffee</option>
                    <option value="tea">Tea</option>
                    <option value="potatoes">Potatoes</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider block">Farm Size (Acres)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    min="0.1"
                    value={draft.farmSizeAcres}
                    onChange={(e) => saveDraft({ ...draft, farmSizeAcres: Number(e.target.value) })}
                    className="w-full h-11 px-3.5 bg-bg-inset border border-border-default focus:border-accent rounded-lg text-sm outline-none font-semibold text-text-primary"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider block">Current Season</label>
                <input 
                  type="text" 
                  value={draft.currentSeason}
                  onChange={(e) => saveDraft({ ...draft, currentSeason: e.target.value })}
                  placeholder="e.g. Long Rains 2026"
                  className="w-full h-11 px-3.5 bg-bg-inset border border-border-default focus:border-accent rounded-lg text-sm outline-none"
                  required
                />
              </div>
            </div>
          )}

          {/* STEP 2: FINANCIAL BEHAVIOUR */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-lg font-extrabold text-text-primary tracking-tight">Financial Profile</h2>
                <p className="text-xs text-text-secondary">Provide details regarding your credit, mobile money, and cooperative memberships.</p>
              </div>

              {/* Mobile Money */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider block">Mobile Money Usage Regularity</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['none', 'irregular', 'monthly', 'weekly'] as const).map((mode) => (
                    <label key={mode} className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-bold cursor-pointer transition-all ${
                      draft.mobileMoneyRegularity === mode 
                        ? 'bg-accent/10 border-accent text-accent' 
                        : 'bg-bg-inset border-border-default hover:border-border-strong text-text-secondary'
                    }`}>
                      <input 
                        type="radio" 
                        name="mmRegularity"
                        checked={draft.mobileMoneyRegularity === mode}
                        onChange={() => saveDraft({ ...draft, mobileMoneyRegularity: mode })}
                        className="hidden"
                      />
                      <span className="capitalize">{mode === 'none' ? 'No Usage' : mode}</span>
                    </label>
                  ))}
                </div>
              </div>

              {draft.mobileMoneyRegularity !== 'none' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider block">Average Monthly Mobile Money Volume (KES)</label>
                  <input 
                    type="number" 
                    value={draft.mobileMoneyMonthlyVolume || ''}
                    onChange={(e) => saveDraft({ ...draft, mobileMoneyMonthlyVolume: Number(e.target.value) })}
                    placeholder="e.g. 5000"
                    className="w-full h-11 px-3.5 bg-bg-inset border border-border-default focus:border-accent rounded-lg text-sm outline-none font-semibold"
                    required
                  />
                </div>
              )}

              {/* Savings Group */}
              <div className="flex justify-between items-center p-3 bg-bg-inset rounded-xl border border-border-default">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-text-primary block">Savings Group Member (Chama)</span>
                  <span className="text-[10px] text-text-secondary font-medium">Do you contribute to a local savings group?</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={draft.savingsGroupMember}
                    onChange={(e) => saveDraft({ ...draft, savingsGroupMember: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-border-strong peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border-default after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent" />
                </label>
              </div>

              {draft.savingsGroupMember && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider block">Contribution Regularity</label>
                  <select
                    value={draft.savingsGroupContributionRegularity}
                    onChange={(e) => saveDraft({ ...draft, savingsGroupContributionRegularity: e.target.value as 'none' | 'irregular' | 'regular' })}
                    className="w-full h-11 px-3 bg-bg-inset border border-border-default focus:border-accent rounded-lg text-sm outline-none font-semibold text-text-primary capitalize"
                  >
                    <option value="none">No contributions</option>
                    <option value="irregular">Irregular contributions</option>
                    <option value="regular">Regular contributions</option>
                  </select>
                </div>
              )}

              {/* Credit Cycles */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider block">Prior Input Credit Cycles (last 3 seasons)</label>
                <input 
                  type="number" 
                  min="0"
                  max="3"
                  value={draft.priorInputCreditCycles}
                  onChange={(e) => {
                    const val = Math.min(3, Number(e.target.value));
                    const outcomes = [...draft.priorRepaymentOutcomes];
                    while (outcomes.length < val) outcomes.push('on_time');
                    saveDraft({ ...draft, priorInputCreditCycles: val, priorRepaymentOutcomes: outcomes });
                  }}
                  className="w-full h-11 px-3.5 bg-bg-inset border border-border-default focus:border-accent rounded-lg text-sm outline-none font-semibold"
                />
              </div>

              {draft.priorInputCreditCycles > 0 && (
                <div className="space-y-3.5 pt-2 border-t border-border-default/45">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-tertiary">Specify Repayment Outcomes</h4>
                  {Array.from({ length: draft.priorInputCreditCycles }).map((_, i) => (
                    <div key={i} className="flex justify-between items-center gap-4">
                      <span className="text-xs font-semibold text-text-secondary">Cycle {i + 1} Outcome:</span>
                      <select
                        value={draft.priorRepaymentOutcomes[i] || 'on_time'}
                        onChange={(e) => updateRepaymentOutcome(i, e.target.value as 'on_time' | 'late' | 'default')}
                        className="h-9 px-2 bg-bg-inset border border-border-default focus:border-accent rounded-lg text-xs font-bold text-text-primary"
                      >
                        <option value="on_time">Paid On Time</option>
                        <option value="late">Paid Late</option>
                        <option value="default">Defaulted</option>
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: FARM PRODUCTIVITY */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-lg font-extrabold text-text-primary tracking-tight">Agricultural Productivity</h2>
                <p className="text-xs text-text-secondary">Provide details regarding your crop yields, varieties, and spatial details.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider block">Yield Last Season (kg/acre)</label>
                  <input 
                    type="number" 
                    value={draft.yieldLastSeason || ''}
                    onChange={(e) => saveDraft({ ...draft, yieldLastSeason: Number(e.target.value) })}
                    className="w-full h-11 px-3.5 bg-bg-inset border border-border-default focus:border-accent rounded-lg text-sm outline-none font-semibold text-text-primary"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider block">Yield Previous Season (kg/acre)</label>
                  <input 
                    type="number" 
                    value={draft.yieldPreviousSeason || ''}
                    onChange={(e) => saveDraft({ ...draft, yieldPreviousSeason: Number(e.target.value) })}
                    className="w-full h-11 px-3.5 bg-bg-inset border border-border-default focus:border-accent rounded-lg text-sm outline-none font-semibold text-text-primary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider block">Crop Diversity (Number of crops grown)</label>
                <input 
                  type="number" 
                  min="1"
                  value={draft.cropDiversity}
                  onChange={(e) => saveDraft({ ...draft, cropDiversity: Number(e.target.value) })}
                  className="w-full h-11 px-3.5 bg-bg-inset border border-border-default focus:border-accent rounded-lg text-sm outline-none font-semibold text-text-primary"
                  required
                />
              </div>

              <div className="space-y-3.5 pt-2 border-t border-border-default/45">
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-tertiary">Agronomic Practices</h4>

                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-text-secondary">Uses Improved Seeds</span>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={draft.usesImprovedSeeds}
                      onChange={(e) => saveDraft({ ...draft, usesImprovedSeeds: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-border-strong peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border-default after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent" />
                  </label>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-text-secondary">Uses Fertilizers</span>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={draft.usesFertilizer}
                      onChange={(e) => saveDraft({ ...draft, usesFertilizer: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-border-strong peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border-default after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent" />
                  </label>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-text-secondary">Uses Agrochemicals</span>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={draft.usesAgrochemicals}
                      onChange={(e) => saveDraft({ ...draft, usesAgrochemicals: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-border-strong peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border-default after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent" />
                  </label>
                </div>

                <div className="flex justify-between items-center p-3 bg-bg-inset rounded-xl border border-border-default mt-2">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-text-primary block">Confirm GPS Coordinates</span>
                    <span className="text-[10px] text-text-secondary font-medium">Verify your farm coordinates on the map.</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={draft.gpsConfirmed}
                      onChange={(e) => saveDraft({ ...draft, gpsConfirmed: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-border-strong peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border-default after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent" />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: CLIMATE & ADAPTIVE PRACTICES */}
          {currentStep === 4 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-lg font-extrabold text-text-primary tracking-tight">Climate & Adaptive Resilience</h2>
                <p className="text-xs text-text-secondary">Verify adaptive methods to hedge against droughts and irregular seasons.</p>
              </div>

              {/* Climate Risk Display lookup */}
              <div className="bg-accent-subtle border border-accent/20 rounded-xl p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Regional Climate Risk Exposure</span>
                  <span className="text-xs font-bold text-text-primary block">{draft.district || 'Your region'} ({draft.country})</span>
                </div>
                <div className="bg-white dark:bg-black px-3 py-1 rounded-full border border-border-default text-xs font-black text-accent capitalize select-none">
                  {climateRisk} Risk
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-tertiary">Adaptive Protections</h4>

                <div className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-text-secondary block">Irrigation Infrastructure</span>
                    <span className="text-[10px] text-text-tertiary">Do you have water storage or drip irrigation?</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={draft.hasIrrigationAccess}
                      onChange={(e) => saveDraft({ ...draft, hasIrrigationAccess: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-border-strong peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border-default after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent" />
                  </label>
                </div>

                <div className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-text-secondary block">Drought-Tolerant Varieties</span>
                    <span className="text-[10px] text-text-tertiary">Do you use certified drought-resistant seed options?</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={draft.usesDroughtTolerantVarieties}
                      onChange={(e) => saveDraft({ ...draft, usesDroughtTolerantVarieties: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-border-strong peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border-default after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent" />
                  </label>
                </div>

                <div className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-text-secondary block">Soil Conservation Practices</span>
                    <span className="text-[10px] text-text-tertiary">Do you practice mulching, terracing, or zero-till?</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={draft.practisesSoilConservation}
                      onChange={(e) => saveDraft({ ...draft, practisesSoilConservation: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-border-strong peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border-default after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent" />
                  </label>
                </div>

                <div className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-text-secondary block">Post-Harvest Storage Solutions</span>
                    <span className="text-[10px] text-text-tertiary">Hermetic bags or silos to prevent storage yields loss.</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={draft.hasPostHarvestStorage}
                      onChange={(e) => saveDraft({ ...draft, hasPostHarvestStorage: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-border-strong peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border-default after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent" />
                  </label>
                </div>

                <div className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-text-secondary block">Crop Insurance Coverage</span>
                    <span className="text-[10px] text-text-tertiary">Do you have index-based agricultural insurance?</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={draft.hasCropInsurance}
                      onChange={(e) => saveDraft({ ...draft, hasCropInsurance: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-border-strong peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border-default after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent" />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: CONSENT */}
          {currentStep === 5 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-lg font-extrabold text-text-primary tracking-tight">Consent and Verification</h2>
                <p className="text-xs text-text-secondary">Authorize data check to construct your live ShambaLadder profile.</p>
              </div>

              {/* Consent Checklist */}
              <div className="space-y-4">
                <label className="flex items-start gap-3 p-3.5 bg-bg-inset border border-border-default rounded-xl cursor-pointer hover:border-border-strong transition-all select-none">
                  <input 
                    type="checkbox" 
                    checked={consentProductivity}
                    onChange={(e) => setConsentProductivity(e.target.checked)}
                    className="h-4.5 w-4.5 rounded border-border-default text-accent focus:ring-accent mt-0.5"
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-text-primary block">Share Productivity Data</span>
                    <span className="text-[10.5px] text-text-secondary leading-relaxed block">I agree to submit my agricultural yields, practices, and coordinates to verify my capacity.</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3.5 bg-bg-inset border border-border-default rounded-xl cursor-pointer hover:border-border-strong transition-all select-none">
                  <input 
                    type="checkbox" 
                    checked={consentFinancial}
                    onChange={(e) => setConsentFinancial(e.target.checked)}
                    className="h-4.5 w-4.5 rounded border-border-default text-accent focus:ring-accent mt-0.5"
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-text-primary block">Share Financial Activity Profile</span>
                    <span className="text-[10.5px] text-text-secondary leading-relaxed block">I authorize the compilation of my savings activity and past loan cycles to check credit readiness.</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3.5 bg-bg-inset border border-border-default rounded-xl cursor-pointer hover:border-border-strong transition-all select-none">
                  <input 
                    type="checkbox" 
                    checked={consentCoop}
                    onChange={(e) => setConsentCoop(e.target.checked)}
                    className="h-4.5 w-4.5 rounded border-border-default text-accent focus:ring-accent mt-0.5"
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-text-primary block">Authorize Cooperative Verification</span>
                    <span className="text-[10.5px] text-text-secondary leading-relaxed block">I understand my cooperative or cooperative union may be requested to authenticate my records.</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3.5 bg-bg-inset border border-border-default rounded-xl cursor-pointer hover:border-border-strong transition-all select-none">
                  <input 
                    type="checkbox" 
                    checked={consentDisclaimer}
                    onChange={(e) => setConsentDisclaimer(e.target.checked)}
                    className="h-4.5 w-4.5 rounded border-border-default text-accent focus:ring-accent mt-0.5"
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-text-primary block">Disclaimer Acknowledgement</span>
                    <span className="text-[10.5px] text-text-secondary leading-relaxed block">I acknowledge that ShambaLadder is a credit readiness benchmarking service and does not guarantee loans.</span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 items-center pt-3 border-t border-border-default/45">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 h-11 border border-border-strong text-text-primary hover:bg-bg-inset font-semibold text-sm rounded-lg transition-colors cursor-pointer select-none text-center"
              >
                Back
              </button>
            )}
            
            <button
              type="submit"
              disabled={submitting}
              className={`h-11 bg-accent hover:bg-accent-hover active:bg-accent-active disabled:bg-accent/40 text-white font-semibold text-sm rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed shadow-sm text-center flex-1`}
            >
              {currentStep === 5 
                ? (submitting ? 'Generating Score...' : 'Generate my score') 
                : 'Next step'}
            </button>
          </div>
        </form>

        {/* Back Link on Step 1 */}
        {currentStep === 1 && (
          <Link href="/demo" className="text-sm font-semibold text-accent hover:text-accent-hover transition-colors text-center block">
            Return to meet our farmers
          </Link>
        )}

      </div>
    </div>
  );
}
