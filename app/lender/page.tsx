// app/lender/page.tsx — Lender Marketplace (default lender landing)
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { CreditTier } from '@/types';
import { MarketplaceFilters, FilterState } from '@/components/lender/MarketplaceFilters';
import { FarmerMarketplaceCard } from '@/components/lender/FarmerMarketplaceCard';
import { LeadCaptureModal } from '@/components/lender/LeadCaptureModal';
import { Skeleton } from '@/components/ui/Skeleton';

interface FarmerListing {
  farmerId: string;
  name: string;
  region: string;
  primaryCrop: string;
  farmSizeAcres: number;
  cooperativeName: string | null;
  totalScore: number;
  tier: CreditTier;
  completeness: number;
  topStrength: string;
  topGap: string;
  peerBenchmark: string | null;
}

const DEFAULT_FILTERS: FilterState = {
  tiers: [],
  minScore: 0,
  crop: '',
  region: '',
  minAcres: 0,
  maxAcres: 100,
};

export default function LenderMarketplace() {
  const [farmers, setFarmers]     = useState<FarmerListing[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [filters, setFilters]     = useState<FilterState>(DEFAULT_FILTERS);
  const [modalFarmer, setModalFarmer] = useState<FarmerListing | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  
  // Ingestion and Search states
  const [ingesting, setIngesting] = useState(false);
  const [ingestSuccess, setIngestSuccess] = useState<string | null>(null);
  const [ingestError, setIngestError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const buildQuery = useCallback((f: FilterState) => {
    const p = new URLSearchParams();
    if (f.minScore > 0)  p.set('minScore', String(f.minScore));
    if (f.crop)          p.set('crop', f.crop);
    if (f.region)        p.set('region', f.region);
    if (f.minAcres > 0)  p.set('minAcres', String(f.minAcres));
    if (f.maxAcres < 100) p.set('maxAcres', String(f.maxAcres));
    f.tiers.forEach(t => p.append('tier', t));
    return p.toString();
  }, []);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const qs = buildQuery(filters);
        const res = await fetch(`/api/lender/farmers${qs ? `?${qs}` : ''}`);
        if (!res.ok) throw new Error('Failed to load farmers.');
        const data = await res.json();
        setFarmers(data.farmers);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [filters, buildQuery, refreshTrigger]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIngesting(true);
    setIngestSuccess(null);
    setIngestError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/lender/ingest', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Ingestion failed');
      }

      setIngestSuccess(`Successfully ingested "${file.name}". Farmer "${data.farmer.name}" (${data.farmer.primaryCrop}) added to Neo4j!`);
      setRefreshTrigger(prev => prev + 1); // trigger reload from graph
    } catch (err: any) {
      console.error(err);
      setIngestError(err.message || 'Error uploading file.');
    } finally {
      setIngesting(false);
    }
  };

  // Client-side text search filter
  const displayedFarmers = farmers.filter(f =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tierCounts = displayedFarmers.reduce<Record<string, number>>((acc, f) => {
    acc[f.tier] = (acc[f.tier] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-bg-page text-text-primary font-sans antialiased">
      {/* Top Navigation Header */}
      <header className="border-b border-border-default bg-bg-card/90 backdrop-blur sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-text-primary text-lg tracking-tight">ShambaLadder</span>
            <span className="text-text-muted text-xs border border-border-default rounded-md px-2 py-0.5 font-semibold">
              Lender Portal
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <span>Powered by</span>
            <span className="font-semibold text-[#0085C3]">Neo4j Aura</span>
            <span className="text-border-default">|</span>
            <span>Featherless AI</span>
          </div>
        </div>
      </header>

      {/* Hero Landing Section */}
      <div className="bg-gradient-to-b from-accent-primary/5 to-transparent border-b border-border-default/50 pb-8 pt-6">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* Left Column: Context, Tagline & Ingest */}
            <div className="space-y-5 flex flex-col justify-center">
              <div className="space-y-2">
                <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary tracking-tight">
                  Agricultural Lead Generation Marketplace
                </h1>
                <p className="text-sm text-text-secondary leading-relaxed max-w-2xl">
                  Evaluate agricultural credit risk using our standardized, rules-based scoring engine. Browse verified smallholders or ingest new records from farm management APIs.
                </p>
              </div>

              {/* Explainer Box */}
              <div className="bg-bg-card border border-border-default rounded-xl p-4 text-xs text-text-secondary leading-relaxed space-y-2 max-w-3xl">
                <p className="font-semibold text-text-primary uppercase tracking-wider text-[10px]">Portal Overview</p>
                <p>
                  ShambaLadder matches financial institutions with credit-worthy smallholder farmers by aggregating seasonal yield metrics, mobile money behaviors, and regional cooperative data. contact details are protected under platform consent rules and released only upon bilateral agreement.
                </p>
              </div>

              {/* Live Ingest Widget */}
              <div className="bg-bg-card border border-border-default rounded-xl p-4 max-w-3xl flex flex-col sm:flex-row sm:items-center gap-4 shadow-sm">
                <div className="flex-1 space-y-0.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-accent-primary">Live Data Ingest Pipeline</h3>
                  <p className="text-xs text-text-muted">
                    Upload a Shambapro export to parse soil, weather, and yield records directly into Neo4j Aura.
                  </p>
                </div>
                <label className="relative flex-shrink-0 flex items-center justify-center border border-dashed border-border-default hover:border-accent-primary/40 hover:bg-bg-page rounded-xl px-5 py-2.5 cursor-pointer group transition-colors">
                  <input
                    type="file"
                    accept=".pdf,.txt"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={ingesting}
                  />
                  <span className="text-xs font-bold text-text-secondary group-hover:text-accent-primary flex items-center gap-2">
                    {ingesting ? (
                      <>
                        <span className="inline-block w-3.5 h-3.5 border-2 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin" />
                        Ingesting...
                      </>
                    ) : (
                      <>
                        <span>Upload Farm Report</span>
                      </>
                    )}
                  </span>
                </label>
              </div>

              {/* Alerts */}
              {ingestSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl p-3 text-xs max-w-3xl flex items-center gap-2">
                  <span>Success:</span>
                  <span>{ingestSuccess}</span>
                </div>
              )}
              {ingestError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 text-xs max-w-3xl flex items-center gap-2">
                  <span>Error:</span>
                  <span>{ingestError}</span>
                </div>
              )}
            </div>

            {/* Right Column: Hero Visual Asset */}
            <div className="hidden lg:block relative rounded-2xl overflow-hidden border border-border-default shadow-sm min-h-[340px]">
              <img
                src="/hero-image.jpg"
                alt="Smallholder Crop Farm Profile"
                className="absolute inset-0 w-full h-full object-cover grayscale-[10%] contrast-[105%]"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm px-4 py-2.5 text-center">
                <p className="text-[10px] text-white/80 font-medium">
                  Standard smallholder crop profiling under active evaluation
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Warning Gating Banner */}
      <div className="bg-amber-500/5 border-b border-amber-500/15 px-4 md:px-8 py-2">
        <p className="max-w-7xl mx-auto text-[11px] text-amber-500 font-medium">
          Warning: ShambaLadder scores are decision-support tools. Credit decisions remain with your institution.
        </p>
      </div>

      {/* Main Layout Area */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Mobile Filter Toggle */}
        <button
          className="lg:hidden mb-4 flex items-center gap-2 text-xs font-bold text-accent-primary border border-accent-primary/20 rounded-xl px-4 py-2 hover:bg-accent-primary/5 transition-colors"
          onClick={() => setFiltersOpen(p => !p)}
        >
          {filtersOpen ? 'Hide Filters' : 'Show Filters'}
        </button>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className={`${filtersOpen ? 'block' : 'hidden'} lg:block`}>
            <MarketplaceFilters
              filters={filters}
              onChange={setFilters}
              totalResults={displayedFarmers.length}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />
          </div>

          {/* Farmer Grid Area */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 9 }).map((_, i) => (
                  <Skeleton key={i} className="h-56 w-full rounded-xl" />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-20 bg-bg-card border border-border-default rounded-2xl">
                <p className="text-xs font-semibold text-text-secondary">{error}</p>
              </div>
            ) : displayedFarmers.length === 0 ? (
              <div className="text-center py-20 bg-bg-card border border-border-default rounded-2xl space-y-2">
                <p className="font-semibold text-text-primary text-sm">No profiles match the filter criteria</p>
                <button
                  onClick={() => { setFilters(DEFAULT_FILTERS); setSearchTerm(''); }}
                  className="text-xs text-accent-primary hover:underline font-bold"
                >
                  Reset all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {displayedFarmers.map(farmer => (
                  <FarmerMarketplaceCard
                    key={farmer.farmerId}
                    farmer={farmer}
                    onRequestContact={f => setModalFarmer(f)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border-default/60 mt-16 py-8 px-4 md:px-8 bg-bg-card/30">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-text-muted">
          <span>ShambaLadder · Kenya AI Challenge 2025</span>
          <div className="flex items-center gap-3">
            <span>Graph intelligence: <strong className="text-[#0085C3]">Neo4j Aura</strong></span>
            <span>·</span>
            <span>AI explanation: <strong>Featherless / Mistral-7B</strong></span>
          </div>
        </div>
      </footer>

      {/* Lead Modal */}
      {modalFarmer && (
        <LeadCaptureModal
          farmer={modalFarmer}
          onClose={() => setModalFarmer(null)}
        />
      )}
    </div>
  );
}
