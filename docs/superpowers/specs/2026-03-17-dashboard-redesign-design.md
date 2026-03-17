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

## Profile Strip

**Content:** Racer name · one colored dot + discipline name + license level per discipline (Sports Car, Formula Car, Oval, Dirt Road, Dirt Oval) · season label · "Ändra profil →" link

**Season label:** Format `CURRENT_SEASON` (`'2026-2'`) as `"iRacing 2026 S2"` using a small utility: split on `-`, map second part to `S1/S2/S3/S4`.

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
2. **Kommande veckor** — compact mini-matrix: series names as row labels, upcoming weeks as columns (weeks after current), each cell colored by ownership status

**Week numbering:** `IracingWeek.week` is 0-based (0–11). Display to user as 1-based (week 0 = "v1", week 1 = "v2", etc.). The current week is determined by comparing `IracingWeek.startDate` against today's date.

**Interaction:** Header link "Full matris →" routes to `/dashboard/matrix` (new route — see URL Routes)

## My Series Widget (Mina serier)

**Content:** One card per selected series containing:
- Series name + ownership status badge (Äger / Saknar bana / Inkluderad)
- Category badge + license class badge
- Current week track name

Cards scroll vertically inside the widget if total height exceeds available space.

**Interaction:** Header link "Ändra urval →" routes to `/setup` (series selection step). Individual cards not linked in v1.

## Race Conditions Widget (Veckans förutsättningar)

**Content:** One block per selected series showing race conditions for the current week, parsed from `IracingWeek.notes` and `IracingWeek.referenceSession`.

**Data source:** Use `IracingSeries[]` directly (not `toSeasonScheduleData()` conversion) — `notes` and `referenceSession` are on `IracingWeek` which is available on `IracingSeries.weeks`.

**Condition pills per series:**
- Temperature: parse `XX°C` from notes (e.g. `"76°F/25°C, ..."` → `"25°C"`)
- Rain chance: parse `Rain chance N%` from notes; show `"Regn N%"` highlighted if > 0%; show nothing if `Rain chance None`
- Weather type: if notes contains `"Dynamic sky"` → `"Dynamiskt väder"` (cyan accent); else `"Fast väder"`
- Start time: parse date+time from `referenceSession` (format `"2026-03-28 13:35 1x"`) → show time `"13:35"`; night sessions (20:00–05:59) styled with purple accent

**Interaction:** Header link "Alla serier →" routes to `/series`

## URL Routes

| Route | Status | Content |
|---|---|---|
| `/dashboard` | Existing (rewrite) | Fixed-height hub (this spec) |
| `/dashboard/costs` | Existing | Full cost breakdown — no changes needed |
| `/dashboard/matrix` | **New route** | Move existing `DashboardContent` matrix component here; create `app/(app)/dashboard/matrix/page.tsx` |
| `/setup` | Existing | Wizard — no changes needed |
| `/series` | Existing (no changes) | Series browser; navigating here from the dashboard widget requires no special filter pre-selection in v1 |

## Data Requirements

All data is available from existing sources:
- `getUserProfile` — name, license levels
- `getAllSeries` + user's selected series from profile — for all widgets
- Cost data — from existing cost calculation in `CostWidget`
- Current week: find week where `IracingWeek.startDate <= today < startDate + 7 days`
- `IracingWeek.notes` + `IracingWeek.referenceSession` — already in JSON and typed in `lib/iracing/types.ts`

New utility functions needed (small, pure):
- `formatSeasonLabel(season: string): string` — `'2026-2'` → `'iRacing 2026 S2'`
- `parseRaceConditions(notes: string, referenceSession: string)` — returns structured conditions object
- `getCurrentWeekIndex(weeks: IracingWeek[]): number` — returns 0-based index of current week

## Implementation Notes

- Dashboard page (`app/(app)/dashboard/page.tsx`) is a Server Component — keep it as-is, pass props down to client widgets
- Fixed-height layout: each panel must have `min-height: 0` and `overflow: hidden` (or `overflow-y: auto` for scrollable panels)
- My Series widget scrolls internally with custom scrollbar styling matching existing design
- Create `app/(app)/dashboard/matrix/page.tsx` and move `DashboardContent` there; update the existing dashboard page to remove the full matrix and add the widget instead
- `.superpowers/` is in `.gitignore`
