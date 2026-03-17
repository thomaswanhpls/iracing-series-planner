# Dashboard Redesign — Design Spec

**Date:** 2026-03-17
**Status:** Approved

## Overview

Redesign the dashboard from a scrollable page into a fixed-height, full-viewport layout where each widget occupies a defined region. Widgets expand to dedicated URLs rather than inline.

## Layout

```
┌─────────────────────────────────────────────────────┐
│  Profile Strip (52px)                               │
├──────────────────────────┬──────────────────────────┤
│  Cost Widget             │                          │
│  (~30% of remaining h)   │  Series Widget           │
│                          │  (full height, scrolls)  │
├──────────────────────────┤                          │
│  Track Matrix Widget     │                          │
│  (~70% of remaining h)   │                          │
└──────────────────────────┴──────────────────────────┘
```

- **Root element:** `height: 100vh; overflow: hidden; display: flex; flex-direction: column`
- **Profile strip:** fixed 52px, `flex-shrink: 0`
- **Main grid:** CSS grid, `flex: 1; min-height: 0`, two columns (~40% / ~60%), left column split into two rows
- **Left column proportions:** Cost ~`auto`, Matrix `1fr` — matrix takes remaining space
- **Right column:** series widget spans both rows, scrolls internally

## Profile Strip

**Content:** Racer name · one colored dot + discipline name + license level per discipline (Sports Car, Formula Car, Oval, Dirt Road, Dirt Oval) · season label (e.g. "iRacing 2026 S2") · "Ändra profil →" link

**Discipline dot colors:**
- Sports Car → blue (`#60b8ff`)
- Formula Car → purple (`#c060ff`)
- Oval → orange (`#ff9060`)
- Dirt Road → green (`#60d890`)
- Dirt Oval → yellow (`#ffd060`)

**Interaction:** "Ändra profil →" routes to `/setup`

## Cost Widget

**Content:**
- Large total cost figure (e.g. `$34.95`) with subtitle "X saknade banor"
- List of selected series with cost per series; series with no missing tracks show `$0` in green

**Interaction:** Header link "Full analys →" routes to `/dashboard/costs`

## Track Matrix Widget

**Content — two sections:**

1. **Denna vecka** — one row per selected series showing: status dot (green=owned / red=missing / blue=free-with-subscription), series name, track name + config, ownership label
2. **Kommande veckor** — compact mini-matrix: series names as row labels, weeks v3–v12 as columns, each cell colored by ownership status; current week marked with cyan outline

**Interaction:** Header link "Full matris →" routes to `/dashboard/matrix`

## Series Widget

**Content:** One card per selected series containing:
- Series name + ownership status badge (Äger / Saknar bana / Inkluderad)
- Category badge + license class badge
- Current week track name

Cards scroll vertically inside the widget if total height exceeds viewport.

**Interaction:** Header link "Utforska serier →" routes to `/series`. Individual series cards are not linked in v1.

## URL Routes (expanded views)

| Route | Content |
|---|---|
| `/dashboard` | Fixed-height hub (this spec) |
| `/dashboard/costs` | Full cost breakdown table with per-track detail |
| `/dashboard/matrix` | Full-page track matrix (existing DashboardContent) |
| `/series` | Full series browser — pre-filtered to user's selections, but all filters available for exploration |

The `/series` page is the existing series browser. When navigated to from the dashboard it should default-filter to the user's selected series, but the user can freely adjust filters to explore all series. The existing `/dashboard/costs` page may need minor layout adjustments to work as a standalone expanded view, but its content is not redesigned here.

## Data Requirements

All data is already available from existing server components and queries:
- `getUserProfile` — name, license levels
- `getAllSeries` / selected series from user profile — for series widget and matrix
- Cost data — from existing cost calculation in `CostWidget`
- Current week derived from `CURRENT_SEASON` constant and current date

## Implementation Notes

- Dashboard page (`app/(app)/dashboard/page.tsx`) is a Server Component — keep it as-is, pass data to client layout shell if needed
- The fixed-height constraint must not break on shorter screens; consider `min-height` guards on individual panels
- Series widget uses internal `overflow-y: auto` scroll with custom scrollbar styling matching existing design
- No new data fetching logic required — restructuring existing widgets only
- `.superpowers/` should be in `.gitignore`
