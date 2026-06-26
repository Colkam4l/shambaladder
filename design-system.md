# design-system.md — Design System
# ShambaLadder · Kenya AI Challenge 2025

## Purpose
The visual specification for ShambaLadder. Every colour, typographic value, and component specification is defined here. Written for AI coding agents — all values are exact.

## Design Identity
ShambaLadder is designed for trust and clarity. A farmer seeing their credit score for the first time needs to feel informed, not judged. A loan officer needs to feel that the data is credible and professionally presented.

**Visual direction:** Clean, data-forward, warm. Agricultural greens anchor the palette but do not dominate — the product is financial, not agrarian. The signature element is the tier progression ladder: a visual metaphor that makes the farmer's journey concrete and achievable.

---

## 1. Colour Tokens

All colours are CSS custom properties on `:root`. No hardcoded hex values in component code.

### 1.1 Surface Colours

```css
:root {
  --color-bg-page:     #F5F7F2;  /* Warm off-white page background */
  --color-bg-card:     #FFFFFF;  /* Cards, panels */
  --color-bg-inset:    #EEF0EB;  /* Input backgrounds, inset sections */
  --color-bg-sidebar:  #1A2410;  /* Dark green sidebar */
}
```

### 1.2 Border Colours

```css
:root {
  --color-border-default: #DDE0D9;
  --color-border-strong:  #BCC2B5;
  --color-border-sidebar: rgba(255, 255, 255, 0.08);
}
```

### 1.3 Typography Colours

```css
:root {
  --color-text-primary:         #111B0A;  /* Near-black with green tint */
  --color-text-secondary:       #4A5542;
  --color-text-tertiary:        #8A9483;
  --color-text-sidebar:         rgba(255, 255, 255, 0.55);
  --color-text-sidebar-active:  #FFFFFF;
}
```

### 1.4 Brand Accent

```css
:root {
  --color-accent:         #2D7A22;  /* Forest green — primary actions */
  --color-accent-hover:   #236019;
  --color-accent-active:  #1A4A12;
  --color-accent-subtle:  #EAF3E8;  /* Green tint backgrounds */
  --color-accent-muted:   #5BA551;  /* Muted green for icons */
}
```

### 1.5 Semantic Colours

```css
:root {
  --color-success-bg:     #E6F4E8;
  --color-success-text:   #166534;
  --color-success-dot:    #16A34A;
  --color-success-border: #86EFAC;

  --color-warning-bg:     #FFF8E1;
  --color-warning-text:   #92600A;
  --color-warning-dot:    #F59E0B;
  --color-warning-border: #FCD34D;

  --color-error-bg:       #FEE2E2;
  --color-error-text:     #991B1B;
  --color-error-dot:      #DC2626;
  --color-error-border:   #FCA5A5;

  --color-info-bg:        #EAF2FF;
  --color-info-text:      #1E3A8A;
  --color-info-dot:       #2563EB;
  --color-info-border:    #93C5FD;
}
```

### 1.6 Credit Tier Colours

Each tier has a colour family for badges, progress bars, and tier-specific UI.

```css
:root {
  /* Seedling — warm amber */
  --color-tier-seedling:       #D97706;
  --color-tier-seedling-bg:    #FEF3C7;
  --color-tier-seedling-text:  #92400E;

  /* Growing — sky blue */
  --color-tier-growing:        #0284C7;
  --color-tier-growing-bg:     #E0F2FE;
  --color-tier-growing-text:   #0C4A6E;

  /* Established — forest green */
  --color-tier-established:    #16A34A;
  --color-tier-established-bg: #DCFCE7;
  --color-tier-established-text: #14532D;

  /* Trusted — rich purple */
  --color-tier-trusted:        #7C3AED;
  --color-tier-trusted-bg:     #EDE9FE;
  --color-tier-trusted-text:   #4C1D95;
}
```

### 1.7 Verification Badge Colours

```css
:root {
  --color-verified-bg:       #DCFCE7;
  --color-verified-text:     #166534;
  --color-self-reported-bg:  #FFF8E1;
  --color-self-reported-text: #92600A;
  --color-missing-bg:        #FEE2E2;
  --color-missing-text:      #991B1B;
  --color-third-party-bg:    #E0F2FE;
  --color-third-party-text:  #0C4A6E;
}
```

---

## 2. Typography

Font stack: `'Inter', system-ui, -apple-system, sans-serif`
Import from Google Fonts: `Inter` weights 400, 500, 600, 700.

```css
:root {
  /* Display — score numbers, hero headings */
  --text-display:         700 56px/1.1 'Inter', sans-serif;
  --text-display-sm:      700 40px/1.1 'Inter', sans-serif;

  /* Headings */
  --text-heading:         600 24px/1.3 'Inter', sans-serif;
  --text-subheading:      600 18px/1.4 'Inter', sans-serif;

  /* Body */
  --text-body:            400 16px/1.6 'Inter', sans-serif;
  --text-body-sm:         400 14px/1.5 'Inter', sans-serif;
  --text-body-xs:         400 12px/1.4 'Inter', sans-serif;

  /* Labels */
  --text-label:           500 13px/1.3 'Inter', sans-serif;
  --text-label-caps:      500 11px/1.3 uppercase letter-spacing: 0.08em 'Inter', sans-serif;
}
```

---

## 3. Spacing Scale

```css
:root {
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
}
```

---

## 4. Border Radius

```css
:root {
  --radius-sm:   4px;
  --radius-md:   8px;
  --radius-lg:   12px;
  --radius-xl:   16px;
  --radius-full: 9999px;
}
```

---

## 5. Shadows

```css
:root {
  --shadow-sm:  0 1px 2px rgba(0, 0, 0, 0.06);
  --shadow-md:  0 4px 12px rgba(0, 0, 0, 0.08);
  --shadow-lg:  0 8px 24px rgba(0, 0, 0, 0.10);
}
```

---

## 6. Component Specifications

### 6.1 TierBadge

Displays the current credit tier with colour-coded styling.

```
Props: tier: CreditTier, size?: 'sm' | 'md' | 'lg'

sm:  height 20px, padding 4px 8px, text-body-xs, radius-full
md:  height 26px, padding 6px 12px, text-label, radius-full
lg:  height 32px, padding 8px 16px, text-body-sm, radius-full

Background: --color-tier-[tier]-bg
Text: --color-tier-[tier]-text

Icons:
  seedling    → 🌱 (or SVG seedling icon)
  growing     → 📈 (or SVG growth icon)
  established → ✓ (or SVG checkmark)
  trusted     → ⭐ (or SVG star)
```

### 6.2 ScoreHero

The large score number with tier progress bar.

```
Props: score: number, tier: CreditTier, nextTier: CreditTier | null, gapToNextTier: number | null

Layout:
  - Score number: --text-display, --color-text-primary, centered
  - Label below: "Credit Readiness Score", --text-body-sm, --color-text-tertiary
  - Progress bar: 8px height, --radius-full
    - Background: --color-bg-inset
    - Fill: --color-tier-[current tier]
    - Width: percentage of the current tier range (not 0-100 overall)
  - Next tier text: "X points to [Next Tier]", --text-body-xs, --color-text-secondary
    - Null if tier is 'trusted'
```

### 6.3 DimensionCard

Displays one scoring dimension on the farmer dashboard.

```
Props:
  dimension: DimensionName
  label: string              // Human-readable: "Financial Behaviour"
  weight: number             // 0-100 percentage
  rawScore: number           // 0-100
  explanation: string        // From LLM
  verificationFlags: VerificationFlag[]
  onViewDetails?: () => void // 🟡 optional

Card: background --color-bg-card, border --color-border-default, radius --radius-lg, padding --space-4, shadow --shadow-sm

Layout (vertical):
  Row 1: dimension label (--text-subheading) | weight badge ("30% of score", --text-body-xs, --color-text-tertiary)
  Row 2: score bar (6px height, full width, fill to rawScore%)
          Fill colour: matches tier colour for the dimension score:
            0-39: --color-tier-seedling
            40-59: --color-tier-growing
            60-79: --color-tier-established
            80+: --color-tier-trusted
  Row 3: score label "[score]/100" right-aligned, --text-body-sm, 500 weight
  Row 4: verification badge row (small badges, wrap if needed)
  Row 5: LLM explanation text (--text-body-sm, --color-text-secondary, 2 sentence max)
  Row 6 (🟡): "See details →" link if onViewDetails provided
```

### 6.4 VerificationBadge

Small badge showing data verification status.

```
Props: status: VerificationStatus, fieldName?: string

Shape: inline-flex, height 18px, padding 2px 6px, radius --radius-full, --text-body-xs

verified:      background --color-verified-bg,      text --color-verified-text,      "✓ Verified"
self_reported: background --color-self-reported-bg,  text --color-self-reported-text, "○ Self-reported"
third_party:   background --color-third-party-bg,   text --color-third-party-text,   "◆ Open-Meteo" / "◆ SoilGrids"
graph_derived: background --color-info-bg,           text --color-info-text,          "◆ Neo4j"
missing:       background --color-missing-bg,        text --color-missing-text,       "! Missing"
```

### 6.5 PeerBenchmarkCard

Neo4j peer comparison, lender view only.

```
Props: benchmark: PeerBenchmarkResult | null

Sufficient data state:
  Container: background --color-accent-subtle, border-left 3px --color-accent, radius --radius-lg, padding --space-4
  Label: "Cooperative peer context" — --text-label-caps, --color-text-tertiary
  Main text: benchmark.displayString — --text-subheading, --color-text-primary
  Sub stats: "Peer group: [crop], [size range] acres" | "Avg tier: [tier]" — --text-body-sm, --color-text-secondary
  Bar: repaymentRate * 100%, --color-tier-established fill, 6px height

Cold start state:
  Same container
  Label: "Cooperative peer context"
  Main text: "Insufficient peer data" — --text-subheading, --color-text-tertiary
  Sub text: "Peer benchmarking available after 10+ similar farmers complete a full lending cycle." — --text-body-sm
```

### 6.6 LenderDisclaimerBanner

Permanent, non-dismissable. Always at top of lender view.

```
Background: --color-warning-bg
Border-bottom: 1px --color-warning-border
Padding: --space-3 --space-6
Text: "ShambaLadder is decision support. All credit decisions remain with your institution." — --text-body-sm, --color-warning-text
Icon: ⚠️ or SVG warning icon, left of text
Position: sticky top-0, z-index 50
```

### 6.7 Button

```
Props: variant: 'primary' | 'secondary' | 'ghost', size?: 'sm' | 'md' | 'lg', disabled?: boolean

Primary:
  background: --color-accent
  text: white
  hover: --color-accent-hover
  active: --color-accent-active
  radius: --radius-md
  padding: 10px 20px (md), 8px 16px (sm), 14px 28px (lg)
  font: --text-label, 500

Secondary:
  background: transparent
  border: 1.5px --color-border-strong
  text: --color-text-primary
  hover: background --color-bg-inset

Ghost:
  background: transparent
  text: --color-accent
  hover: background --color-accent-subtle
  No border
```

### 6.8 ActionCard

Ranked action in the action list.

```
Props: action: ScoredAction, completed: boolean, onComplete: () => void

Container: background --color-bg-card, border --color-border-default, radius --radius-lg, padding --space-4

Layout (horizontal):
  Left: rank circle (28px, background --color-bg-inset, --text-label)
  Center (flex-1):
    Row 1: action title (--text-subheading)
    Row 2: dimension badge + effort badge (inline)
    Row 3: action description (--text-body-sm, --color-text-secondary)
  Right: "+[N] pts" (--text-subheading, --color-accent) + checkbox

Effort badge colours:
  quick:  --color-success-bg, --color-success-text
  medium: --color-warning-bg, --color-warning-text
  hard:   --color-info-bg, --color-info-text

Completed state:
  Opacity: 0.6
  Title: line-through
  Rank circle: checkmark icon, --color-accent background
```

### 6.9 AIExplanationBanner

Farmer-facing overall explanation from the LLM.

```
Props: explanation: string, loading?: boolean, failed?: boolean

Container: background --color-accent-subtle, border 1px --color-border-default, radius --radius-lg, padding --space-4

Loading: skeleton 3 lines
Failed: "Explanation unavailable. Your score and breakdown above are accurate." — --text-body-sm, --color-text-tertiary

Populated:
  Label: "AI explanation" — --text-label-caps, --color-text-tertiary
  Explanation text: --text-body-sm, --color-text-secondary
  Disclaimer: "Speak to a Shambapro advisor before making finance or planting decisions." — --text-body-xs, --color-text-tertiary, italic
```

---

## 7. Layout

### Page Layout

```
Max content width: 680px (mobile-first, centered on desktop)
Page padding: --space-4 (mobile), --space-6 (desktop)
Background: --color-bg-page
```

### Demo Landing Layout

```
Max width: 1000px
Three-column grid on desktop (≥ 768px)
Single column on mobile
Grid gap: --space-6
```

---

## 8. Tailwind Configuration

All tokens above must be added to `tailwind.config.ts` under `theme.extend`. Use consistent naming:

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        'tier-seedling': 'var(--color-tier-seedling)',
        'tier-growing': 'var(--color-tier-growing)',
        'tier-established': 'var(--color-tier-established)',
        'tier-trusted': 'var(--color-tier-trusted)',
        'accent': 'var(--color-accent)',
        // ... all tokens
      },
    },
  },
};
```

---

*ShambaLadder · Kenya AI Challenge 2025*
