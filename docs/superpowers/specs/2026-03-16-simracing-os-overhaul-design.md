# Design Spec: iRacing SP — SimRacing OS Visual Overhaul

**Date:** 2026-03-16
**Scope:** Phase 1 — App Shell + Setup Wizard
**Approach:** Foundation-first (tokens → primitives → shell → wizard), vy-för-vy thereafter

---

## 1. Goals

Replace the current design system (orange/teal accent, DM Sans/JetBrains Mono, sidebar with old tokens) with the "SimRacing OS" aesthetic defined in `docs/DESIGN.md`: cyberpunk-inspired, void-dark, neon-accented, glassmorphic.

**In scope for this phase:**
- `app/layout.tsx` — font variable remapping
- `app/globals.css` — full token replacement
- `components/ui/button.tsx` — rewrite
- `components/ui/card.tsx` — rewrite
- `components/ui/badge.tsx` — rewrite
- `components/ui/input.tsx` — rewrite
- `components/ui/checkbox.tsx` — rewrite (native `<input>` → custom element for neon glow support)
- `components/car-badges.tsx` — color token updates
- `components/app-shell.tsx` — full sidebar redesign
- `components/wizard/series-setup.tsx` — token + `ROW_HEIGHT` updates (layout structure preserved)

**Passive impact (out of scope but visually affected):**
- `components/season-schedule-browser.tsx` imports Button, Card, Badge, Input, Table — will inherit new tokens automatically. Visual regression should be verified post-implementation but no targeted changes are made to this file in this phase.
- `components/ui/table.tsx` — not rewritten, but token references (`border-border`, `bg-bg-elevated`, etc.) will resolve to new values once `globals.css` is replaced. Verify it remains usable.

**Out of scope for this phase:**
- Dashboard/matrix, costs view, tracks/garage view (future phases)
- Landing page (`app/page.tsx`)

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

  /* Accents — solid hex so Tailwind /opacity modifiers work */
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

  /* Borders — solid hex for modifier compatibility */
  --color-border: #2d2e5a;
  --color-border-subtle: #0d294a;   /* used as border-border-subtle throughout */
  --color-border-focus: #00ffff;

  /* Fonts */
  --font-display: 'Space Grotesk', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

> **Tailwind opacity modifier constraint:** Tokens defined as `rgba(...)` values (e.g. `bg-elevated`, `bg-glass`, `status-*`) cannot use Tailwind's `/N` opacity modifier syntax — the modifier only works with solid-color tokens where channel values are available. Always use pre-alpha rgba values directly for these tokens. The `/N` modifier is safe to use on `accent-*`, `border`, `border-subtle`, and `border-focus` tokens (all solid hex).

> **Glow values:** `box-shadow` glow effects are expressed as Tailwind arbitrary values inline (e.g. `shadow-[0_0_18px_rgba(0,255,255,0.35)]`). They are not defined as `@theme` tokens because Tailwind 4 does not automatically map `--glow-*` variables to utilities. If a glow value is reused frequently, add it as `--shadow-glow-cyan` in `@theme` to get the `shadow-glow-cyan` utility.

**Background gradient** on the `.shell` root element:
```css
background:
  radial-gradient(ellipse at 15% 40%, rgba(13,185,242,0.07) 0%, transparent 55%),
  radial-gradient(ellipse at 85% 15%, rgba(255,0,255,0.05) 0%, transparent 45%),
  #050614;
```

---

## 3. Font Remapping (`app/layout.tsx`)

Current state: `JetBrains_Mono` uses `variable: '--font-display'`, `DM_Sans` uses `variable: '--font-body'`.

New state:
```ts
const spaceGrotesk = Space_Grotesk({
  variable: '--font-display',   // replaces JetBrains Mono as display font
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',      // moves from --font-display to --font-mono
  subsets: ['latin'],
  weight: ['400', '500'],
})
```

Apply both variables on `<html>`: `className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}`.
Remove `--font-body` — body text uses `font-display` (Space Grotesk) going forward.
Update `<body className="...">` to use `font-display` instead of `font-body`.

---

## 4. UI Primitives

Each primitive is **rewritten** (not reskinned). Existing prop API names (`variant`, etc.) are preserved where compatible; incompatible props are removed.

### Button
- **Primary:** `bg-accent-cyan text-bg-base font-display font-bold rounded-sm px-5 py-2.5 text-[13px]` + `shadow-[0_0_18px_rgba(0,255,255,0.35)]`
- **Secondary:** transparent bg, `border border-border text-text-secondary hover:bg-bg-hover`
- **Ghost:** no border, `text-text-secondary hover:text-text-primary hover:bg-white/[0.03]`
- Remove old `accent` / `glow` variant props — no callers in phase 1 scope need them

### Card
- Base: `relative bg-bg-glass backdrop-blur-md border border-border-subtle rounded-lg overflow-hidden`
- **Top accent line** via Tailwind `before:` utilities:
  ```
  before:absolute before:top-0 before:inset-x-0 before:h-px before:content-['']
  before:bg-[linear-gradient(90deg,transparent_0%,rgba(0,255,255,0.5)_35%,rgba(13,185,242,0.2)_65%,transparent_100%)]
  before:opacity-0 before:transition-opacity
  hover:before:opacity-100
  ```
  The `relative` class on Card is required for `before:absolute` to work — add it to base classes.
- `data-selected` prop: adds `border-accent-cyan/30 bg-accent-cyan/[0.07] before:opacity-100`
- **Remove** existing `accent` (`owned | missing | free | eligible`) and `glow` props — not used by any in-scope component in phase 1. `season-schedule-browser.tsx` should be audited post-phase to check if it uses these props before a later phase removes them.

### Badge
- Base: `font-mono text-[11px] font-medium rounded-sm px-2 py-0.5 border whitespace-nowrap`
- Variants (replace existing):

| Variant | Background | Text | Border |
|---------|-----------|------|--------|
| `default` | `rgba(255,255,255,0.05)` | `text-text-muted` | `border-border` |
| `road` | `rgba(13,185,242,0.12)` | `#0db9f2` | `rgba(13,185,242,0.25)` |
| `oval` | `rgba(255,140,0,0.12)` | `#ff8c00` | `rgba(255,140,0,0.25)` |
| `dirt-road` | `rgba(255,100,0,0.10)` | `#ff7020` | `rgba(255,100,0,0.20)` |
| `dirt-oval` | `rgba(255,100,0,0.10)` | `#ff7020` | `rgba(255,100,0,0.20)` |
| `rookie` | `rgba(255,60,60,0.12)` | `#ff5050` | `rgba(255,60,60,0.25)` |
| `d` | `rgba(255,80,0,0.12)` | `#ff6020` | `rgba(255,80,0,0.25)` |
| `c` | `rgba(255,180,0,0.12)` | `#e8a800` | `rgba(255,180,0,0.25)` |
| `b` | `rgba(80,200,80,0.12)` | `#44cc44` | `rgba(80,200,80,0.25)` |
| `a` | `rgba(0,160,255,0.12)` | `#0090ff` | `rgba(0,160,255,0.25)` |
| `pro` | `rgba(200,80,255,0.12)` | `#cc44ff` | `rgba(200,80,255,0.25)` |

### Input
- `bg-white/[0.04] border border-border rounded-sm px-4 py-[10px] font-display text-[14px] text-text-secondary`
- Focus: `border-border-focus shadow-[0_0_5px_rgba(0,255,255,0.3)] outline-none`

### Checkbox (`components/ui/checkbox.tsx`)
Replace native `<input type="checkbox">` with a custom element — native inputs cannot produce the neon `box-shadow` glow on selection.

Implementation: a `<button role="checkbox">` (or Radix UI `Checkbox`) styled as:
- Unchecked: `w-[18px] h-[18px] rounded-sm border border-white/20 bg-transparent`
- Checked: `bg-accent-cyan border-accent-cyan shadow-[0_0_8px_rgba(0,255,255,0.45)]` + white checkmark icon
- Keep existing `onChange` / `checked` prop API (native `InputHTMLAttributes` pattern) — `series-setup.tsx` uses `checked` + `readOnly` with `onClick` on the surrounding button; no logic changes needed

---

## 5. App Shell (`app-shell.tsx`)

### Collapse toggle and focus mode
- **Collapse toggle is preserved** — the sidebar retains the ability to collapse to icon-only mode (`w-14`)
- Default expanded width changes from `w-[220px]` to `w-[240px]`
- **Focus mode is preserved** — `focusModeActive` logic and opacity dimming of secondary nav items remains

### Sidebar (expanded state)
- Background: `linear-gradient(180deg, #1a1b3b 0%, #121332 100%)`
- Right border: `border-r border-border`
- Width: `w-[240px]` (expanded), `w-14` (collapsed) — unchanged behavior

**Logo area** (`px-6 pt-8 pb-6 border-b border-white/[0.06]`):
- Wordmark "iRacing SP" — `font-display text-[17px] font-bold`, "SP" in `text-accent-cyan`
- Season tag — `font-mono text-[10px] text-text-muted uppercase tracking-widest mt-1.5`
- Hide season tag when collapsed

**Nav groups** — "Planering" (Dashboard, Setup, Seriescheman) and "Analys" (Banor, Kostnader, Inställningar):
- Group labels: `font-mono text-[9px] uppercase tracking-[0.12em] text-white/20 px-6 pt-4 pb-2`
- Nav items: `flex items-center gap-3 px-6 py-3 text-[14px] font-medium transition-colors`
- Inactive: `text-white/45 hover:text-white/80 hover:bg-white/[0.03]`
- Active: `text-white bg-accent-cyan/[0.06]` + left edge `::before` (2px `linear-gradient(180deg, transparent, #00ffff 40%, #00ffff 60%, transparent)`)
- Icons: 16px Lucide, `opacity-55` inactive → `opacity-100 text-accent-cyan` active
- Collapsed state: show icon only (existing behavior), retain active indicator

**User footer** (`px-6 py-5 border-t border-white/[0.06]`):
- Avatar (34px circle): initials from `userId`, `bg-bg-elevated border border-accent-cyan/20 text-accent-cyan`
- Name: `text-[13px] font-semibold text-white/80` — display `userId` (no iRating data in this phase; iRating display is a future enhancement when user profile data is available)
- Hide name/meta when collapsed

### Topbar
- Height: `h-16` (64px), `px-10 border-b border-white/[0.06]`
- Left: breadcrumb `font-mono text-[11px] text-text-muted uppercase tracking-[0.06em]` + page title `text-[16px] font-semibold`
- Right: count badge (`font-mono text-[12px]` neutral pill) + primary Button

---

## 6. Setup Wizard (`series-setup.tsx`)

**Structure is preserved exactly.** Token + constant updates only.

### `ROW_HEIGHT` constant
Update from `96` to `100`. This must be done **simultaneously** with the CSS height change — the constant drives `totalHeight`, `visibleStartIndex`, `visibleEndIndex`, and the `top` inline style. A mismatch causes rows to overlap or leave gaps.

### Series rows
- Height: `h-[100px]` (up from `h-[88px]`)
- Padding: `p-[14px_16px]`, gap: `gap-[14px]` (`gap-3` → `gap-3.5`)
- `items-start rounded-lg` — unchanged
- Unselected: `border-transparent hover:border-border hover:bg-white/[0.03]`
- Selected: `border-accent-cyan/30 bg-accent-cyan/[0.07]`
- Top accent line: use Card's `before:` pattern (add as a shared utility class or repeat inline on the button element)
- Checkbox: delegates to new `Checkbox` component — no logic change needed

### Series title
- `font-display text-[15px] font-semibold text-text-primary tracking-[-0.01em] line-clamp-1`

### Badge row
- `flex flex-wrap items-center gap-1.5` — unchanged
- Badge variants updated via new Badge component

### CarIndicator
- Emblem circles: `h-[26px] w-[26px] bg-black/35 border border-white/15`
- Extra count: `text-[11px] text-text-muted ml-1`
- Popover: `bg-bg-elevated backdrop-blur-md border border-border-subtle`

### Filter / content area
- Content padding: `px-10 pt-9`
- Filter grid: `grid-cols-[1fr_200px_130px] gap-3`
- Category pills: `text-[12px] px-[15px] py-1.5`; active: cyan tint
- List meta: `font-mono text-[11px] uppercase tracking-[0.1em] text-text-muted`

---

## 7. Car Badges (`car-badges.tsx`)

Color token updates only — SVG structure and layout preserved:
- `CarBadge` container: `border-border-subtle hover:border-accent-cyan/30`
- `BrandEmblem` gradient circle: uses `bg-bg-elevated` tones, ring `border-border`
- Popover: `bg-bg-elevated backdrop-blur-md border border-border-subtle rounded-xl`

---

## 8. Implementation Order

One focused commit per file. Do not combine multiple files in a single commit.

1. **`app/layout.tsx`** — swap fonts, remap CSS variables (`--font-display` → Space Grotesk, `--font-mono` → JetBrains Mono, remove `--font-body`)
2. **`app/globals.css`** — replace `@theme` block, add radial nebula shell background, update custom scrollbar to cyan
3. **`components/ui/badge.tsx`** — rewrite variants
4. **`components/ui/button.tsx`** — rewrite (primary/secondary/ghost)
5. **`components/ui/input.tsx`** — rewrite
6. **`components/ui/checkbox.tsx`** — rewrite as custom element
7. **`components/ui/card.tsx`** — rewrite with glass + `before:` top accent line + `relative` base class
8. **`components/car-badges.tsx`** — color token updates
9. **`components/app-shell.tsx`** — full sidebar redesign (preserve collapse + focus mode)
10. **`components/wizard/series-setup.tsx`** — token updates + `ROW_HEIGHT = 100` + `h-[100px]`

After step 10: visually verify `components/season-schedule-browser.tsx` and `components/ui/table.tsx` for regressions from passively inherited token changes.

---

## 9. Out of Scope / Future Phases

- Dashboard matrix, costs view, tracks/garage view (visual overhaul)
- `season-schedule-browser.tsx` (targeted redesign)
- iRating display in sidebar footer (requires user profile data)
- nuqs migration for `series-setup.tsx` URL state (pre-existing pattern, separate task)
- Landing page (`app/page.tsx`)
