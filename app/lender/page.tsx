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
  }, [filters, buildQuery]);

  const tierCounts = farmers.reduce<Record<string, number>>((acc, f) => {
    acc[f.tier] = (acc[f.tier] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-bg-page text-text-primary font-sans">
      {/* ── Top bar ── */}
      <header className="border-b border-border-default bg-bg-card/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">🪜</span>
            <span className="font-bold text-text-primary text-base">ShambaLadder</span>
            <span className="hidden sm:block text-text-muted text-xs border border-border-default rounded-full px-2 py-0.5">
              Lender Marketplace
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <span className="hidden md:block">Powered by</span>
            <span className="font-semibold text-[#0085C3]">Neo4j</span>
            <span className="hidden md:block text-border-default">|</span>
            <span className="hidden md:block">Featherless AI</span>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <div className="bg-gradient-to-b from-accent-primary/8 to-transparent border-b border-border-default/50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-10 space-y-3">
          <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary leading-tight">
            Farmer Credit Marketplace
          </h1>
          <p className="text-sm md:text-base text-text-secondary max-w-2xl leading-relaxed">
            Browse pre-scored, cooperative-verified farmers across Kenya, Uganda, and Rwanda.
            Every score is rules-based and auditable. Every peer signal is live from the Neo4j cooperative graph.
          </p>

          {/* Stat strip */}
          {!loading && (
            <div className="flex flex-wrap gap-3 pt-2">
              {[
                { label: 'Total farmers', value: String(farmers.length || 50) },
                { label: '⭐ Trusted',      value: String(tierCounts['trusted'] ?? 0) },
                { label: '✓ Established',  value: String(tierCounts['established'] ?? 0) },
                { label: '📈 Growing',      value: String(tierCounts['growing'] ?? 0) },
                { label: '🌱 Seedling',     value: String(tierCounts['seedling'] ?? 0) },
              ].map(s => (
                <div key={s.label} className="bg-bg-card border border-border-default rounded-xl px-4 py-2 text-center">
                  <p className="text-lg font-extrabold text-text-primary leading-none">{s.value}</p>
                  <p className="text-[11px] text-text-muted mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Disclaimer ── */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 md:px-8 py-2.5">
        <p className="max-w-7xl mx-auto text-xs text-amber-400 leading-snug">
          ⚠️ ShambaLadder scores are decision-support tools only. Credit decisions remain with your institution. Farmer contact details are released only after the farmer confirms an introduction request.
        </p>
      </div>

      {/* ── Main layout ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8">
        {/* Mobile filter toggle */}
        <button
          className="lg:hidden mb-4 flex items-center gap-2 text-sm font-medium text-accent-primary border border-accent-primary/30 rounded-xl px-4 py-2 hover:bg-accent-primary/5 transition-colors"
          onClick={() => setFiltersOpen(p => !p)}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16"><path d="M2 4h12M5 8h6M7 12h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          {filtersOpen ? 'Hide' : 'Show'} filters
        </button>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filter sidebar */}
          <div className={`${filtersOpen ? 'block' : 'hidden'} lg:block`}>
            <MarketplaceFilters
              filters={filters}
              onChange={setFilters}
              totalResults={farmers.length}
            />
          </div>

          {/* Grid */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 9 }).map((_, i) => (
                  <Skeleton key={i} className="h-64 w-full rounded-2xl" />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-20 space-y-3">
                <p className="text-4xl">⚠️</p>
                <p className="text-text-secondary text-sm">{error}</p>
              </div>
            ) : farmers.length === 0 ? (
              <div className="text-center py-20 space-y-3">
                <p className="text-4xl">🔍</p>
                <p className="font-semibold text-text-primary">No farmers match your filters</p>
                <p className="text-sm text-text-muted">Try adjusting the tier, crop, or score range.</p>
                <button
                  onClick={() => setFilters(DEFAULT_FILTERS)}
                  className="mt-2 text-sm text-accent-primary hover:underline font-medium"
                >
                  Reset filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {farmers.map(farmer => (
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

      {/* Neo4j attribution footer */}
      <footer className="border-t border-border-default mt-12 py-6 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-muted">
          <span>🪜 ShambaLadder · Kenya AI Challenge 2025 · AgriFin Track</span>
          <div className="flex items-center gap-3">
            <span>Graph intelligence by <strong className="text-[#0085C3]">Neo4j Aura</strong></span>
            <span>·</span>
            <span>AI explanations by <strong className="text-text-secondary">Featherless / Mistral-7B</strong></span>
          </div>
        </div>
      </footer>

      {/* Lead capture modal */}
      {modalFarmer && (
        <LeadCaptureModal
          farmer={modalFarmer}
          onClose={() => setModalFarmer(null)}
        />
      )}
    </div>
  );
}
