# Design Spec: iRacing SP — SimRacing OS Visual Overhaul

**Date:** 2026-03-16
**Scope:** Phase 1 — App Shell + Setup Wizard
**Approach:** Foundation-first (tokens → primitives → shell → wizard), vy-för-vy thereafter

---

## 1. Goals

Replace the current design system (orange/teal accent, DM Sans/JetBrains Mono, sidebar with old tokens) with the "SimRacing OS" aesthetic defined in `docs/DESIGN.md`: cyberpunk-inspired, void-dark, neon-accented, glassmorphic.

**In scope for this phase:**
- `app/globals.css` — full token replacement
- `components/ui/` — Button, Card, Badge, Input rewritten (not just reskinned)
- `components/app-shell.tsx` — sidebar redesign
- `components/wizard/series-setup.tsx` — color/token updates (layout preserved)
- `components/car-badges.tsx` — color updates

**Out of scope for this phase:**
- Dashboard/matrix, costs view, tracks/garage view (future phases)

---

## 2. Design Tokens (`globals.css`)

Replace current `@theme` block entirely. New tokens:

```css
@theme {
  /* Backgrounds */
  --color-bg-base: #050614;
  --color-bg-surface: #121332;
  --color-bg-elevated: rgba(26, 27, 59, 0.8);
  --color-bg-glass: rgba(24, 45, 52, 0.6);
  --color-bg-hover: rgba(0, 255, 255, 0.05);

  /* Accents */
  --color-accent-cyan: #00ffff;
  --color-accent-magenta: #ff00ff;
  --color-accent-orange: #ff8c00;
  --color-accent-blue: #0db9f2;

  /* Status */
  --color-status-owned: rgba(0, 255, 255, 0.15);
  --color-status-missing: rgba(255, 255, 255, 0.06);
  --color-status-free: rgba(255, 140, 0, 0.15);
  --color-status-alert: rgba(255, 0, 255, 0.15);

  /* Text */
  --color-text-primary: #ffffff;
  --color-text-secondary: rgba(255, 255, 255, 0.70);
  --color-text-muted: rgba(255, 255, 255, 0.35);

  /* Borders */
  --color-border: #2d2e5a;
  --color-border-subtle: rgba(13, 185, 242, 0.15);
  --color-border-focus: #00ffff;

  /* Fonts */
  --font-display: 'Space Grotesk', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

**Background gradient** applied on `body` or root shell element:
```css
background:
  radial-gradient(ellipse at 15% 40%, rgba(13,185,242,0.07) 0%, transparent 55%),
  radial-gradient(ellipse at 85% 15%, rgba(255,0,255,0.05) 0%, transparent 45%),
  #050614;
```

**Fonts** loaded via `next/font/google` in `app/layout.tsx`:
- Replace `JetBrains Mono` display + `DM Sans` body with `Space Grotesk` (display/body) + `JetBrains Mono` (mono)

---

## 3. UI Primitives

Each primitive is **rewritten** — not just reskinned. They adopt SimRacing OS tokens natively.

### Button
- **Primary:** `bg-[#00ffff] text-[#050614]` + `box-shadow: 0 0 18px rgba(0,255,255,0.35)`, `rounded-sm` (3px), `font-display font-bold`
- **Secondary:** transparent bg, `border-border`, text-text-secondary; hover lifts to `bg-bg-hover`
- **Ghost:** no border, subtle hover
- No variants that rely on old accent-primary/secondary tokens

### Card
- Background: `bg-bg-glass` with `backdrop-blur-md`
- Border: `border-border-subtle` (1px)
- **Top accent line** via `::before` pseudo-element — `linear-gradient(90deg, transparent, rgba(0,255,255,0.5) 35%, rgba(13,185,242,0.2) 65%, transparent)` — visible on hover and `data-selected`
- Corner radius: `rounded-lg` (8px)

### Badge
- Base: `font-mono text-[11px]` + `rounded-sm px-2 py-0.5`
- Variants map to iRacing categories and license levels:
  - `road` — cyan tint (`rgba(13,185,242,0.12)`, `#0db9f2`)
  - `oval` — orange tint (`rgba(255,140,0,0.12)`, `#ff8c00`)
  - `dirt-road` / `dirt-oval` — amber-orange
  - `rookie` → `d` → `c` → `b` → `a` → `pro` — red → orange → yellow → green → blue → purple
  - `default` — neutral (`rgba(255,255,255,0.05)`, muted text)

### Input
- Background: `rgba(255,255,255,0.04)`
- Border: `border-border` (1px `#2d2e5a`)
- Focus: border switches to `border-focus` (`#00ffff`) + subtle cyan box-shadow
- Font: `font-display text-[14px]`
- Padding: `px-4 py-[10px]`

---

## 4. App Shell (`app-shell.tsx`)

### Sidebar
- Width: **240px** fixed
- Background: `linear-gradient(180deg, #1a1b3b 0%, #121332 100%)`
- Right border: `1px solid #2d2e5a`

**Logo area** (`padding: 32px 24px 26px`, border-bottom):
- Wordmark "iRacing SP" — `font-display text-[17px] font-bold`, "SP" in `text-accent-cyan`
- Season tag below — `font-mono text-[10px] text-text-muted uppercase tracking-widest`

**Nav groups** — two sections: "Planering" (Dashboard, Setup, Seriescheman) and "Analys" (Banor, Kostnader, Inställningar):
- Section labels: `font-mono text-[9px] uppercase tracking-[0.12em] text-text-muted/50`
- Nav items: `flex items-center gap-3 px-6 py-3 text-[14px] font-medium`
- Inactive: `text-text-secondary/45`, hover: `text-text-secondary bg-white/[0.03]`
- Active: `text-white bg-accent-cyan/[0.06]` + left edge indicator (`2px linear-gradient cyan`)
- Icons: 16px Lucide, `opacity-55` inactive, `opacity-100 text-accent-cyan` active

**User footer** (`padding: 20px 24px 26px`, border-top):
- Avatar circle (34px), initials in `text-accent-cyan`
- Name `text-[13px] font-semibold` + iRating `font-mono text-[10px] text-text-muted`

### Topbar
- Height: **64px**, `px-10 border-b border-white/[0.06]`
- Left: breadcrumb (`font-mono text-[11px] text-text-muted uppercase`) + page title (`text-[16px] font-semibold`)
- Right: count badge (`font-mono text-[12px]` neutral style) + primary Button

---

## 5. Setup Wizard (`series-setup.tsx`)

**Layout is preserved exactly.** Only tokens/colors change.

### Series rows
- Height: **100px** (up from 88px for breathing room at new scale)
- Padding: `p-[14px_16px]`, gap: `gap-[14px]`, `items-start rounded-lg`
- Unselected: `border-transparent hover:border-border hover:bg-white/[0.03]`
- Selected: `border-accent-cyan/30 bg-accent-cyan/[0.07]`
- Top accent line on hover + selected (Card pattern above)
- Checkbox: 18px, selected state: `bg-accent-cyan border-accent-cyan shadow-[0_0_8px_rgba(0,255,255,0.45)]`

### Series title
- `font-display text-[15px] font-semibold text-text-primary tracking-[-0.01em] line-clamp-1`

### Badge row
- `flex flex-wrap items-center gap-1.5` — unchanged structure
- Uses new Badge component variants (see §3)

### CarIndicator
- Emblem circles: 26px, `bg-black/35 border-white/15`
- Extra count: `text-[11px] text-text-muted ml-1`
- Hover popover: `bg-bg-elevated backdrop-blur-md border-border-subtle`

### Filter / search area
- Content padding: `px-10 py-9`
- Filter grid: `grid-cols-[1fr_200px_130px] gap-3`
- Category pills: `text-[12px] px-[15px] py-[6px]`; active: cyan tint
- List meta label: `font-mono text-[11px] uppercase tracking-[0.1em] text-text-muted`

---

## 6. Car Badges (`car-badges.tsx`)

Color updates only — structure preserved:

- `CarBadge` container border: `border-border-subtle` → hover `border-accent-cyan/30`
- `BrandEmblem` SVG: gradient circle uses `bg-bg-elevated` tones, ring in `border-subtle`
- Popover background: `bg-bg-elevated backdrop-blur-md`

---

## 7. Implementation Order

1. **`app/layout.tsx`** — swap fonts (Space Grotesk + JetBrains Mono)
2. **`app/globals.css`** — replace `@theme` block, add radial nebula body bg, update scrollbar
3. **`components/ui/badge.tsx`** — rewrite variants
4. **`components/ui/button.tsx`** — rewrite with cyan primary + glow
5. **`components/ui/input.tsx`** — rewrite with new tokens
6. **`components/ui/card.tsx`** — rewrite with glass + top accent line
7. **`components/car-badges.tsx`** — color token updates
8. **`components/app-shell.tsx`** — full sidebar redesign
9. **`components/wizard/series-setup.tsx`** — token updates, row height 100px

Each file is one focused commit. No cross-file changes in a single commit.

---

## 8. Out of Scope / Future Phases

- Dashboard matrix (`components/dashboard/`)
- Costs view
- Tracks / garage view
- Season schedule browser (`components/season-schedule-browser.tsx`)
- Landing page (`app/page.tsx`)
