# Domain: iRacing

## Season Structure

- Calendar year = 4 seasons (quarters). Naming: `2026 Season 2` = Q2 2026.
- Each season = 12 race weeks (Tuesday to Monday) + Week 13 (fun/transition week).
- Builds deploy first/second week of March, June, September, December.
- During build week: iRacing is offline. Week 13 bridges the gap.

## Series

A series is a championship across one season. Key properties:

| Field | Type | Notes |
|-------|------|-------|
| series_id | int | Stable across seasons |
| series_name | string | e.g. "GT3 Fixed" |
| category | enum | Road, Oval, Dirt Road, Dirt Oval |
| license_group | enum | Rookie, D, C, B, A, Pro |
| car_class_ids | int[] | Which car classes are eligible |
| fixed_setup | bool | Whether setups are locked |

## Tracks

A track has multiple configurations (layouts). Key properties:

| Field | Type | Notes |
|-------|------|-------|
| track_id | int | Unique per configuration |
| track_name | string | e.g. "Spa-Francorchamps" |
| config_name | string | e.g. "Grand Prix" — empty for single-config tracks |
| category | string | road, oval, dirt_road, dirt_oval |
| free_with_subscription | bool | True for ~20 included tracks |
| price | float | ~$14.95 standard, $11.95+ with volume discount |
| sku | int | Package ID for purchase grouping |

A `track_id` refers to a specific configuration. Multiple `track_id`s can share the same physical location (e.g. Daytona Road vs Daytona Oval).

## Cars

| Field | Type | Notes |
|-------|------|-------|
| car_id | int | Unique identifier |
| car_name | string | e.g. "BMW M4 GT3" |
| free_with_subscription | bool | ~30 cars included free |
| price | float | ~$11.95 standard |
| car_class_id | int | Category grouping (GT3, GTE, etc.) |

## Season Schedule

Each series has a 12-week schedule mapping week number → track_id. This is the core data for the planner.

```
Week 1:  track_id 123 (Spa GP)
Week 2:  track_id 456 (Monza GP)
...
Week 12: track_id 789 (Suzuka GP)
```

## Participation Credits

iRacing grants "participation credits" ($1–4/season) if you race in 8+ unique weeks of a series. This means owning ≥8 of 12 tracks in your chosen series has monetary value beyond just being able to race.

## Content Ownership

Users buy tracks and cars individually or in bundles. Volume discounts apply:

| Items in cart | Discount |
|---------------|----------|
| 3–5 | 10% |
| 6+ | 15% |
| 40+ | 20% |

Free content (included with subscription) should never appear in purchase recommendations.

## Key Optimization Problem

Given: a set of series the user wants to race + their currently owned tracks.
Find: the minimum set of tracks to purchase that maximizes:
1. Number of series where ≥8/12 weeks are covered (participation credits)
2. Total raceable weeks across all selected series
3. Cost efficiency (tracks used in multiple series = higher value)

This is essentially a weighted set cover problem. For MVP, a greedy algorithm ranked by cross-series usage count is sufficient.
