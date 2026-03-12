# Design System

Desktop-first MVP. "Team strategy room" aesthetic — precision, data-density, control. Not gamer/esports.

## Theme Tokens

Define in `app/globals.css` using Tailwind 4 `@theme`:

```css
@theme {
  --color-bg-base: #0F0F14;
  --color-bg-surface: #1A1A2E;
  --color-bg-elevated: #252540;
  --color-bg-hover: #2A2A4A;

  --color-accent-primary: #E94560;    /* racing red — CTAs, active states */
  --color-accent-secondary: #0F3460;  /* deep blue — headers, sidebar */
  --color-accent-muted: #16213E;

  --color-status-owned: #2ECC71;      /* green — track owned */
  --color-status-missing: #E94560;    /* red — track not owned */
  --color-status-free: #F39C12;       /* amber — free with subscription */
  --color-status-eligible: #3498DB;   /* blue — participation credits met */

  --color-text-primary: #E8E8E8;
  --color-text-secondary: #A0A0A0;
  --color-text-muted: #666666;

  --color-border: #2A2A4A;
  --color-border-subtle: #1F1F35;
}
```

## Typography

```css
@theme {
  --font-display: 'JetBrains Mono', monospace;  /* headings, data */
  --font-body: 'Satoshi', sans-serif;            /* body text, UI labels */
}
```

Load via `next/font/google` or `next/font/local`. Never use system fonts or Inter/Roboto.

| Use | Font | Size | Weight |
|-----|------|------|--------|
| Page titles | JetBrains Mono | 24–32px | 700 |
| Section headers | JetBrains Mono | 18–20px | 600 |
| Body text | Satoshi | 14–16px | 400 |
| Table data | JetBrains Mono | 12–13px | 400 |
| Labels/captions | Satoshi | 12px | 500 |

## Layout

```
┌─────────────────────────────────────────────────────┐
│ Top bar: logo + season selector + user avatar       │
├────────┬────────────────────────────────────────────┤
│        │ Summary cards (owned/missing/cost)          │
│ Side-  ├────────────────────────────────────────────┤
│ bar    │                                            │
│        │ Main content area                          │
│ Series │ (matrix / costs / tracks)                  │
│ nav    │                                            │
│        │                                            │
│ 220px  │ Scrollable, full remaining width           │
│ fixed  │                                            │
├────────┴────────────────────────────────────────────┤
│ (no footer in app views)                            │
└─────────────────────────────────────────────────────┘
```

- Sidebar: 220px fixed, collapsible to 56px icon-only
- Main content: `flex-1` with horizontal scroll for matrix
- Summary cards: sticky top, blur backdrop

## Information Architecture

Primär användarresa i navigation och CTA-copy:

1. `Setup` -> välj serier
2. `Seriescheman` -> planera vilka serier som är relevanta
3. `Banor` -> markera ägda banor
4. `Kostnader` -> se inköpslista och budget

`Dashboard/Matris` är en sekundär analysvy för veckotäckning, inte primär startpunkt.

## Dashboard Matrix

The core view. High information density with clear hierarchy.

```
          │ W1          │ W2          │ ... │ W12         │ Owned
──────────┼─────────────┼─────────────┼─────┼─────────────┼──────
GT3 Fixed │ ██ Spa GP   │ ██ Monza   │     │ ██ Suzuka   │ 9/12
IMSA Pilot│ ██ Daytona  │ ██ Sebring │     │ ██ Road Atl │ 7/12
```

- Cell colors: `bg-status-owned`, `bg-status-missing`, `bg-status-free`
- Use `opacity-20` for the background, full opacity for text
- Sticky first column (series name) + sticky header row (week numbers)
- Hover: show tooltip with track thumbnail, price, and cross-series usage count
- Click cell: expand detail panel (slide-in from right or modal)

## Components

### SummaryCard

Top-of-dashboard stats. 3–4 cards in a row.

```
┌──────────────────┐
│ 🏁  9 / 12       │  ← large number
│ tracks owned     │  ← label
│ GT3 Fixed        │  ← context
└──────────────────┘
```

Accent border-left to indicate status (green = good, red = needs attention).

### SeriesSelector (Wizard)

Card grid with search/filter. Each card shows:
- Series name + category badge
- License requirement pill (D/C/B/A)
- Car class thumbnails
- "X tracks owned" mini progress bar
- Checkbox for selection

### TrackCell (Matrix)

Compact cell in the matrix grid.
- Track name truncated with ellipsis
- Background color = ownership status
- Small icon if track appears in 2+ selected series (high-value indicator)

## Icons

Lucide React (`lucide-react`). Consistent 16–20px size in UI.

Key icons: `Trophy` (participation credits), `ShoppingCart` (cost view), `Calendar` (weeks), `Car` (series), `MapPin` (tracks), `Check` (owned), `X` (missing), `Gift` (free).

## Animations

Keep subtle. No flashy transitions.

- Page transitions: fade 150ms
- Wizard steps: slide-left 200ms with `@starting-style`
- Tooltip: fade-in 100ms with slight y-translate
- Matrix cells on data load: stagger fade-in by row (50ms delay per row)
- Sidebar collapse: width transition 200ms ease-out

## Responsive (Desktop MVP)

Minimum viewport: 1024px. No mobile layout for MVP.
At <1024px: show "best experienced on desktop" message.
