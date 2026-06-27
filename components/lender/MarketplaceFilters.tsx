// components/lender/MarketplaceFilters.tsx
'use client';

import React from 'react';

export interface FilterState {
  tiers: string[];
  minScore: number;
  crop: string;
  region: string;
  minAcres: number;
  maxAcres: number;
}

interface MarketplaceFiltersProps {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  totalResults: number;
}

const TIER_OPTIONS = [
  { value: 'trusted',     label: '⭐ Trusted',     desc: '80–100' },
  { value: 'established', label: '✓ Established',  desc: '60–79'  },
  { value: 'growing',     label: '📈 Growing',      desc: '40–59'  },
  { value: 'seedling',    label: '🌱 Seedling',     desc: '20–39'  },
];

const CROP_OPTIONS = [
  { value: '',        label: 'All crops'  },
  { value: 'maize',  label: '🌽 Maize'   },
  { value: 'beans',  label: '🫘 Beans'   },
  { value: 'tomato', label: '🍅 Tomato'  },
  { value: 'coffee', label: '☕ Coffee'  },
  { value: 'tea',    label: '🍃 Tea'     },
  { value: 'sorghum',label: '🌾 Sorghum' },
];

const REGION_OPTIONS = [
  { value: '',        label: 'All regions' },
  { value: 'kenya',  label: '🇰🇪 Kenya'   },
  { value: 'uganda', label: '🇺🇬 Uganda'  },
  { value: 'rwanda', label: '🇷🇼 Rwanda'  },
];

export function MarketplaceFilters({ filters, onChange, totalResults }: MarketplaceFiltersProps) {
  const toggleTier = (tier: string) => {
    const next = filters.tiers.includes(tier)
      ? filters.tiers.filter(t => t !== tier)
      : [...filters.tiers, tier];
    onChange({ ...filters, tiers: next });
  };

  const reset = () =>
    onChange({ tiers: [], minScore: 0, crop: '', region: '', minAcres: 0, maxAcres: 100 });

  const isDirty =
    filters.tiers.length > 0 ||
    filters.minScore > 0 ||
    filters.crop !== '' ||
    filters.region !== '' ||
    filters.minAcres > 0 ||
    filters.maxAcres < 100;

  return (
    <aside className="w-full lg:w-72 flex-shrink-0 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-text-primary text-sm uppercase tracking-wide">Filters</h2>
        {isDirty && (
          <button
            onClick={reset}
            className="text-xs text-accent-primary hover:underline font-medium transition-colors"
          >
            Reset all
          </button>
        )}
      </div>

      {/* Results count */}
      <p className="text-xs text-text-muted">
        Showing <span className="font-bold text-text-primary">{totalResults}</span> farmers
      </p>

      {/* Tier filter */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Tier</p>
        <div className="space-y-1.5">
          {TIER_OPTIONS.map(t => (
            <label
              key={t.value}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <span
                onClick={() => toggleTier(t.value)}
                className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors cursor-pointer
                  ${filters.tiers.includes(t.value)
                    ? 'bg-accent-primary border-accent-primary'
                    : 'bg-transparent border-border-default group-hover:border-accent-primary/50'}`}
              >
                {filters.tiers.includes(t.value) && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
                    <path d="M1.5 5.5L4 8L8.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </span>
              <span
                onClick={() => toggleTier(t.value)}
                className="flex-1 flex items-center justify-between text-sm text-text-primary cursor-pointer"
              >
                <span>{t.label}</span>
                <span className="text-xs text-text-muted">{t.desc}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Min score slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Min Score</p>
          <span className="text-sm font-bold text-accent-primary">{filters.minScore}</span>
        </div>
        <input
          type="range"
          min={0}
          max={90}
          step={5}
          value={filters.minScore}
          onChange={e => onChange({ ...filters, minScore: Number(e.target.value) })}
          className="w-full accent-accent-primary cursor-pointer h-1.5"
        />
        <div className="flex justify-between text-[10px] text-text-muted">
          <span>0</span>
          <span>90</span>
        </div>
      </div>

      {/* Crop filter */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Crop</p>
        <select
          value={filters.crop}
          onChange={e => onChange({ ...filters, crop: e.target.value })}
          className="w-full bg-bg-page border border-border-default rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/40 transition cursor-pointer"
        >
          {CROP_OPTIONS.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Region filter */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Region</p>
        <select
          value={filters.region}
          onChange={e => onChange({ ...filters, region: e.target.value })}
          className="w-full bg-bg-page border border-border-default rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/40 transition cursor-pointer"
        >
          {REGION_OPTIONS.map(r => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

      {/* Farm size range */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Farm Size (acres)</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={filters.maxAcres}
            value={filters.minAcres}
            onChange={e => onChange({ ...filters, minAcres: Number(e.target.value) })}
            className="w-full bg-bg-page border border-border-default rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/40 transition"
            placeholder="Min"
          />
          <span className="text-text-muted text-xs flex-shrink-0">to</span>
          <input
            type="number"
            min={filters.minAcres}
            max={100}
            value={filters.maxAcres}
            onChange={e => onChange({ ...filters, maxAcres: Number(e.target.value) })}
            className="w-full bg-bg-page border border-border-default rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/40 transition"
            placeholder="Max"
          />
        </div>
      </div>
    </aside>
  );
}
