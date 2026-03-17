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
│  Cost Widget             │  My Series Widget        │
│  (auto height)           │  (~50% of right col)     │
├──────────────────────────┼──────────────────────────┤
│  Track Matrix Widget     │  Race Conditions Widget  │
│  (1fr, takes remainder)  │  (~50% of right col)     │
└──────────────────────────┴──────────────────────────┘
```

- **Root element:** `height: 100vh; overflow: hidden; display: flex; flex-direction: column`
- **Profile strip:** fixed 52px, `flex-shrink: 0`
- **Main grid:** CSS grid, `flex: 1; min-height: 0`
- **Columns:** left ~40%, right ~60%
- **Left column:** Cost (`auto`) stacked above Matrix (`1fr`)
- **Right column:** My Series (`1fr`) stacked above Race Conditions (`1fr`)

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

## My Series Widget (Mina serier)

**Content:** One card per selected series containing:
- Series name + ownership status badge (Äger / Saknar bana / Inkluderad)
- Category badge + license class badge
- Current week track name

Cards scroll vertically inside the widget if total height exceeds available space.

**Interaction:** Header link "Ändra urval →" routes to `/setup` (series selection step). Individual cards not linked in v1.

## Race Conditions Widget (Veckans förutsättningar)

**Content:** One block per selected series showing race conditions for the current week, parsed from the season JSON:

- Series name + current track
- Condition pills: temperature (from `notes`, e.g. "25°C"), rain chance (from `notes`, highlighted in accent color if > 0%), weather type ("Dynamiskt väder" if `notes` contains "Dynamic sky", else "Fast väder"), start time (from `referenceSession`, e.g. "13:35")
- Night sessions (time 20:00–05:59) styled with purple accent
- High rain chance (≥25%) and dynamic weather highlighted in cyan accent

**Data parsing:** `notes` field format: `"76°F/25°C, Rain chance None, ..."` or `"Constant weather, Dynamic sky, ..."`. Parse with regex: extract `XX°C`, `Rain chance N%` or `Rain chance None`, detect "Dynamic sky" string.

**Interaction:** Header link "Alla serier →" routes to `/series`

## URL Routes (expanded views)

| Route | Content |
|---|---|
| `/dashboard` | Fixed-height hub (this spec) |
| `/dashboard/costs` | Full cost breakdown table with per-track detail |
| `/dashboard/matrix` | Full-page track matrix (existing DashboardContent) |
| `/setup` | Wizard — profile, series selection, tracks, cars |
| `/series` | Full series browser with filters; navigating here from dashboard shows all series with user's filters as defaults |

## Data Requirements

All data is available from existing sources:
- `getUserProfile` — name, license levels
- `getAllSeries` + user's selected series from profile — for My Series and matrix widgets
- Cost data — from existing cost calculation in `CostWidget`
- Current week derived from `CURRENT_SEASON` constant and current date
- `notes` + `referenceSession` fields on `IracingWeek` — for race conditions widget (already in JSON, types already defined)

No new API calls or data fetching logic required.

## Implementation Notes

- Dashboard page (`app/(app)/dashboard/page.tsx`) is a Server Component — keep it as-is, pass props down to client widgets
- Fixed-height layout must not break on short screens; each panel should have `min-height: 0` and `overflow: hidden` or `overflow-y: auto`
- My Series widget scrolls internally with custom scrollbar styling
- Race conditions parser is a pure utility function — colocate in `lib/iracing/` or inline in the widget
- `.superpowers/` is in `.gitignore`
