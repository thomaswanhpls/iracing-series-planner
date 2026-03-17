# Dashboard Redesign — Design Spec

**Date:** 2026-03-17
**Status:** Approved

## Overview

Redesign the dashboard from a scrollable page into a fixed-height, full-viewport layout where each widget occupies a defined region. Widgets expand to dedicated URLs rather than inline.

The current dashboard (`app/(app)/dashboard/page.tsx`) renders `ProfileWidget`, `CostWidget`, `DashboardContent` (legacy matrix), and `SeriesWidget` in a scrolling column. **`SeriesWidget` is removed** — its role is split between the new My Series widget and the Race Conditions widget.

## Layout

```
┌─────────────────────────────────────────────────────┐
│  Profile Strip (52px)                               │
├──────────────────────────┬──────────────────────────┤
│  Cost Widget             │  My Series Widget        │
│  (auto height)           │  (1fr of right col)      │
├──────────────────────────┼──────────────────────────┤
│  Track Matrix Widget     │  Race Conditions Widget  │
│  (1fr, takes remainder)  │  (1fr of right col)      │
└──────────────────────────┴──────────────────────────┘
```

- **Root element:** `height: 100vh; overflow: hidden; display: flex; flex-direction: column`
- **Profile strip:** fixed 52px, `flex-shrink: 0`
- **Main grid:** CSS grid, `flex: 1; min-height: 0`
- **Columns:** left ~40%, right ~60%
- **Left column:** Cost (`auto`) stacked above Matrix (`1fr`)
- **Right column:** My Series (`1fr`) stacked above Race Conditions (`1fr`)
- Each panel: `min-height: 0; overflow: hidden` (scrollable panels use `overflow-y: auto`)

## Profile Strip

**Content:** Racer name · one colored dot + full discipline name + license level per discipline · season label · "Ändra profil →" link

**Season label:** Format `CURRENT_SEASON` string (`'2026-2'`) → `'iRacing 2026 S2'` using a small utility function: split on `-`, map second segment `1→S1, 2→S2, 3→S3, 4→S4`.

**Props needed:** `name: string`, `licenseSportsCar: string`, `licenseFormulaCar: string`, `licenseOval: string`, `licenseDirtRoad: string`, `licenseDirtOval: string` — all sourced from `getUserProfile`.

**Discipline dot colors:**
- Sports Car → blue (`#60b8ff`)
- Formula Car → purple (`#c060ff`)
- Oval → orange (`#ff9060`)
- Dirt Road → green (`#60d890`)
- Dirt Oval → yellow (`#ffd060`)

**Interaction:** "Ändra profil →" routes to `/setup`

## Cost Widget

**Content:**
- Large total cost figure with subtitle "X saknade banor · Y bilar" (from `ContentCostSummary`)
- Per-series cost list: for each selected series, show the series name and the sum of prices of missing tracks used by that series this season

**Per-series cost computation:** Requires a new utility `computeSeriesCost(selectedSeries, ownedTrackKeys)` that, for each series, sums `getTrackPrice(key)` for all tracks used that season which are not in `ownedTrackKeys` and not free (`price > 0`). Series with total `$0` shown in green.

**Interaction:** Header link "Full analys →" routes to `/dashboard/costs`

## Track Matrix Widget

**Content — two sections:**

1. **Denna vecka** — one row per selected series showing: status dot (green=owned / red=missing / blue=free), series name, track name + config, ownership label ("Äger" / "Saknas" / "Inkl.")
2. **Kommande veckor** — compact mini-matrix: series names as row labels, remaining weeks as columns, each cell colored by ownership status

**Week numbering:** `IracingWeek.week` is 0-based (0–11). Display as 1-based to the user ("v1"–"v12"). Current week = the week whose `startDate <= today < startDate + 7 days`.

**Ownership logic** (same for all widgets):
- Key in `ownedTrackKeys` → owned (green)
- `getTrackPrice(makeTrackKey(venue, config)) === 0` → free/included (blue)
- Otherwise → missing (red)

**Interaction:** Header link "Full matris →" routes to `/dashboard/matrix` (new route)

## My Series Widget (Mina serier)

**Content:** One card per selected series containing:
- Series name + ownership status badge for current week's track (Äger / Saknar bana / Inkluderad) — using the ownership logic above
- Category badge + license class badge
- Current week track name + config

Cards scroll vertically inside the widget if total height exceeds available space.

**Interaction:** Header link "Ändra urval →" routes to `/setup`. Individual cards not linked in v1.

## Race Conditions Widget (Veckans förutsättningar)

**Content:** One block per selected series showing conditions for the current week's race, parsed from `IracingWeek.notes` and `IracingWeek.referenceSession` (available directly on `IracingSeries.weeks` — use the raw `IracingSeries[]`, not the `toSeasonScheduleData()` conversion).

**Condition pills:**
- **Temperature:** regex `(\d+)°C` from notes → e.g. `"25°C"`. Not present when notes starts with `"Constant weather"`.
- **Rain chance:** regex `Rain chance (\d+)%` → show `"Regn N%"` with cyan/amber accent if > 0%. Omit if `Rain chance None`.
- **Weather type:** notes containing `"Dynamic sky"` → `"Dynamiskt väder"` (cyan accent); notes starting with `"Constant weather"` without dynamic → `"Konstant väder"`; otherwise `"Fast väder"`.
- **Start time:** parse from `referenceSession` format `"2026-03-28 13:35 1x"` → show `"13:35"`. Night sessions (time ≥ 20:00 or < 06:00) styled with purple accent.

**Edge case:** Some notes are `"Constant weather, Dynamic sky, ..."` — treat `"Dynamic sky"` as the authoritative flag regardless of `"Constant weather"` prefix.

**Interaction:** Header link "Alla serier →" routes to `/series`

## URL Routes

| Route | Status | Content |
|---|---|---|
| `/dashboard` | Existing (rewrite) | Fixed-height hub (this spec) |
| `/dashboard/costs` | Existing — **no changes** | Uses old markdown loader + `useOwnership()` context; remains as-is |
| `/dashboard/matrix` | **New route** | Create `app/(app)/dashboard/matrix/page.tsx`; move `DashboardContent` here |
| `/setup` | Existing — no changes | Wizard |
| `/series` | Existing — **no changes** | Uses old markdown loader; linked from Race Conditions widget without filter pre-selection |

**Known pre-existing inconsistency:** `/dashboard/costs` and `/series` both use `getSeason2Schedules()` (markdown-based loader), while the new dashboard widgets use the JSON dataset (`season-2026-s2.json`). Unifying these data sources is out of scope for this redesign.

## Data Requirements

Sourced in `app/(app)/dashboard/page.tsx` (Server Component):

| Data | Source |
|---|---|
| `name`, `licenseSportsCar/FormulaCar/Oval/DirtRoad/DirtOval` | `fetchUserProfile(userId)` |
| `selectedSeriesNames` | `fetchSelectedSeriesNames(userId, CURRENT_SEASON)` |
| `ownedTrackKeys` | `fetchOwnedTrackKeys(userId)` |
| `ownedCarNames` | `fetchOwnedCarNames(userId)` |
| `allSeries` (IracingSeries[]) | `getAllSeries()` from season JSON |
| `selectedSeries` | `allSeries.filter(...)` by name |
| `recommendations`, `summary` | `computeContentCost(...)` (existing) |
| per-series cost | `computeSeriesCost(...)` (new utility) |
| season label | `formatSeasonLabel(CURRENT_SEASON)` (new utility) |

**New pure utility functions** (colocate in `lib/iracing/`):
- `formatSeasonLabel(season: string): string`
- `parseRaceConditions(notes: string, referenceSession: string): RaceConditions`
- `getCurrentWeekIndex(weeks: IracingWeek[]): number`
- `computeSeriesCost(selectedSeries: IracingSeries[], ownedTrackKeys: string[]): Map<string, number>`

## Components to create/modify

- `app/(app)/dashboard/page.tsx` — rewrite layout; remove `getSeason2Schedules()` call and `SeriesWidget`
- `app/(app)/dashboard/matrix/page.tsx` — new; render `DashboardContent`
- `components/dashboard/dashboard-hub.tsx` — new client layout shell with CSS grid
- `components/dashboard/profile-strip.tsx` — new (replaces `ProfileWidget`)
- `components/dashboard/cost-widget.tsx` — modify: add per-series breakdown, link instead of expand
- `components/dashboard/matrix-widget.tsx` — new
- `components/dashboard/my-series-widget.tsx` — new
- `components/dashboard/race-conditions-widget.tsx` — new
