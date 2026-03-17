# Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the scrollable dashboard with a fixed-height, full-viewport hub containing four widgets (Cost, Track Matrix, My Series, Race Conditions) that each expand to dedicated URLs.

**Architecture:** The dashboard page remains a Server Component that fetches all data and passes it as props to a new client-side layout shell (`DashboardHub`). Each widget is an isolated client component. Four new pure utility functions in `lib/iracing/` handle formatting and parsing. The legacy `DashboardContent` matrix is moved to a new `/dashboard/matrix` route.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS 4, TypeScript strict, Drizzle ORM + Turso, `lib/iracing/season-data.ts`, `lib/analysis/content-cost.ts`

---

## Chunk 1: Utility functions

### Task 1: `formatSeasonLabel`

**Files:**
- Create: `lib/iracing/format-season-label.ts`
- Test: `lib/iracing/__tests__/format-season-label.test.ts`

- [ ] **Step 1: Create test file**

```typescript
// lib/iracing/__tests__/format-season-label.test.ts
import { formatSeasonLabel } from '../format-season-label'

describe('formatSeasonLabel', () => {
  it('formats 2026-2 as iRacing 2026 S2', () => {
    expect(formatSeasonLabel('2026-2')).toBe('iRacing 2026 S2')
  })
  it('formats 2025-4 as iRacing 2025 S4', () => {
    expect(formatSeasonLabel('2025-4')).toBe('iRacing 2025 S4')
  })
  it('formats 2026-1 as iRacing 2026 S1', () => {
    expect(formatSeasonLabel('2026-1')).toBe('iRacing 2026 S1')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /home/thomas/repos/iracing-series-planner && pnpm exec jest lib/iracing/__tests__/format-season-label.test.ts 2>&1 | tail -10
```
Expected: error — module not found

- [ ] **Step 3: Implement**

```typescript
// lib/iracing/format-season-label.ts
export function formatSeasonLabel(season: string): string {
  const [year, quarter] = season.split('-')
  return `iRacing ${year} S${quarter}`
}
```

- [ ] **Step 4: Run tests**

```bash
pnpm exec jest lib/iracing/__tests__/format-season-label.test.ts 2>&1 | tail -5
```
Expected: PASS, 3 tests

- [ ] **Step 5: Commit**

```bash
git add lib/iracing/format-season-label.ts lib/iracing/__tests__/format-season-label.test.ts
git commit -m "feat: add formatSeasonLabel utility"
```

---

### Task 2: `getCurrentWeekIndex`

**Files:**
- Create: `lib/iracing/current-week.ts`
- Test: `lib/iracing/__tests__/current-week.test.ts`

- [ ] **Step 1: Create test file**

```typescript
// lib/iracing/__tests__/current-week.test.ts
import { getCurrentWeekIndex } from '../current-week'
import type { IracingWeek } from '../types'

function makeWeeks(startDates: string[]): IracingWeek[] {
  return startDates.map((startDate, i) => ({
    week: i,
    startDate,
    track: 'Test Track',
    venue: 'Test',
    config: null,
    raceLength: '30 min',
    referenceSession: '2026-03-28 13:00 1x',
    notes: '70°F/21°C, Rain chance None, Rolling start.',
  }))
}

describe('getCurrentWeekIndex', () => {
  it('returns index of week that contains today', () => {
    const weeks = makeWeeks(['2026-03-10', '2026-03-17', '2026-03-24'])
    // "today" = 2026-03-20 is within week starting 2026-03-17
    expect(getCurrentWeekIndex(weeks, '2026-03-20')).toBe(1)
  })
  it('returns index of week whose startDate equals today', () => {
    const weeks = makeWeeks(['2026-03-10', '2026-03-17', '2026-03-24'])
    expect(getCurrentWeekIndex(weeks, '2026-03-17')).toBe(1)
  })
  it('returns 0 if today is before all weeks', () => {
    const weeks = makeWeeks(['2026-04-01', '2026-04-08'])
    expect(getCurrentWeekIndex(weeks, '2026-03-17')).toBe(0)
  })
  it('returns last index if today is past all weeks', () => {
    const weeks = makeWeeks(['2026-01-01', '2026-01-08'])
    expect(getCurrentWeekIndex(weeks, '2026-06-01')).toBe(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm exec jest lib/iracing/__tests__/current-week.test.ts 2>&1 | tail -5
```
Expected: error — module not found

- [ ] **Step 3: Implement**

```typescript
// lib/iracing/current-week.ts
import type { IracingWeek } from './types'

/**
 * Returns the 0-based index of the current week.
 * Accepts an optional `today` date string (YYYY-MM-DD) for testability;
 * defaults to the actual current date.
 */
export function getCurrentWeekIndex(weeks: IracingWeek[], today?: string): number {
  const date = today ?? new Date().toISOString().split('T')[0]
  let lastPast = 0
  for (let i = 0; i < weeks.length; i++) {
    if (weeks[i].startDate <= date) lastPast = i
  }
  return lastPast
}
```

- [ ] **Step 4: Run tests**

```bash
pnpm exec jest lib/iracing/__tests__/current-week.test.ts 2>&1 | tail -5
```
Expected: PASS, 4 tests

- [ ] **Step 5: Commit**

```bash
git add lib/iracing/current-week.ts lib/iracing/__tests__/current-week.test.ts
git commit -m "feat: add getCurrentWeekIndex utility"
```

---

### Task 3: `parseRaceConditions`

**Files:**
- Create: `lib/iracing/race-conditions.ts`
- Test: `lib/iracing/__tests__/race-conditions.test.ts`

- [ ] **Step 1: Create test file**

```typescript
// lib/iracing/__tests__/race-conditions.test.ts
import { parseRaceConditions } from '../race-conditions'

describe('parseRaceConditions', () => {
  it('parses temperature', () => {
    const r = parseRaceConditions('76°F/25°C, Rain chance None, Rolling start.', '2026-03-28 13:35 1x')
    expect(r.tempC).toBe(25)
  })
  it('parses rain chance as null when None', () => {
    const r = parseRaceConditions('76°F/25°C, Rain chance None, Rolling start.', '2026-03-28 13:35 1x')
    expect(r.rainChance).toBeNull()
  })
  it('parses rain chance as number when present', () => {
    const r = parseRaceConditions('67°F/20°C, Rain chance 35%, Standing start.', '2026-03-28 13:35 1x')
    expect(r.rainChance).toBe(35)
  })
  it('detects dynamic weather when Dynamic sky present', () => {
    const r = parseRaceConditions('Constant weather, Dynamic sky, Rolling start.', '2026-03-28 13:35 1x')
    expect(r.isDynamic).toBe(true)
    expect(r.tempC).toBeNull()
  })
  it('isDynamic false for fixed weather', () => {
    const r = parseRaceConditions('76°F/25°C, Rain chance None, Rolling start.', '2026-03-28 13:35 1x')
    expect(r.isDynamic).toBe(false)
  })
  it('parses start time from referenceSession', () => {
    const r = parseRaceConditions('76°F/25°C, Rain chance None.', '2026-03-28 13:35 1x')
    expect(r.startTime).toBe('13:35')
  })
  it('flags night session when time >= 20:00', () => {
    const r = parseRaceConditions('76°F/25°C, Rain chance None.', '2026-03-28 20:20 1x')
    expect(r.isNight).toBe(true)
  })
  it('flags night session when time < 06:00', () => {
    const r = parseRaceConditions('76°F/25°C, Rain chance None.', '2026-03-28 03:00 1x')
    expect(r.isNight).toBe(true)
  })
  it('does not flag daytime as night', () => {
    const r = parseRaceConditions('76°F/25°C, Rain chance None.', '2026-03-28 14:00 1x')
    expect(r.isNight).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm exec jest lib/iracing/__tests__/race-conditions.test.ts 2>&1 | tail -5
```
Expected: error — module not found

- [ ] **Step 3: Implement**

```typescript
// lib/iracing/race-conditions.ts
export interface RaceConditions {
  tempC: number | null
  rainChance: number | null  // null = no rain / not applicable
  isDynamic: boolean
  startTime: string | null   // "HH:MM"
  isNight: boolean
}

export function parseRaceConditions(notes: string, referenceSession: string): RaceConditions {
  const tempMatch = notes.match(/(\d+)°C/)
  const tempC = tempMatch ? parseInt(tempMatch[1], 10) : null

  const rainMatch = notes.match(/Rain chance (\d+)%/)
  const rainChance = rainMatch ? parseInt(rainMatch[1], 10) : null

  const isDynamic = notes.includes('Dynamic sky')

  const sessionMatch = referenceSession.match(/\d{4}-\d{2}-\d{2} (\d{2}:\d{2})/)
  const startTime = sessionMatch ? sessionMatch[1] : null

  let isNight = false
  if (startTime) {
    const hour = parseInt(startTime.split(':')[0], 10)
    isNight = hour >= 20 || hour < 6
  }

  return { tempC, rainChance, isDynamic, startTime, isNight }
}
```

- [ ] **Step 4: Run tests**

```bash
pnpm exec jest lib/iracing/__tests__/race-conditions.test.ts 2>&1 | tail -5
```
Expected: PASS, 9 tests

- [ ] **Step 5: Commit**

```bash
git add lib/iracing/race-conditions.ts lib/iracing/__tests__/race-conditions.test.ts
git commit -m "feat: add parseRaceConditions utility"
```

---

### Task 4: `computeSeriesCost`

**Files:**
- Create: `lib/analysis/series-cost.ts`
- Test: `lib/analysis/__tests__/series-cost.test.ts`

- [ ] **Step 1: Create test file**

```typescript
// lib/analysis/__tests__/series-cost.test.ts
import { computeSeriesCost } from '../series-cost'
import type { IracingSeries } from '@/lib/iracing/types'

function makeSeries(name: string, venues: Array<{ venue: string; config: string | null }>): IracingSeries {
  return {
    category: 'SPORTS_CAR',
    class: 'C',
    seriesName: name,
    cars: [],
    license: 'C',
    scheduleFrequency: 'Weekly',
    minEntries: 8,
    splitAt: 40,
    drops: 4,
    incidentRules: '',
    weeks: venues.map((v, i) => ({
      week: i,
      startDate: `2026-03-${17 + i}`,
      track: v.venue,
      venue: v.venue,
      config: v.config,
      raceLength: '30 min',
      referenceSession: '2026-03-28 13:00 1x',
      notes: '70°F/21°C, Rain chance None, Rolling start.',
    })),
  }
}

describe('computeSeriesCost', () => {
  it('returns 0 for a series where all tracks are owned', () => {
    const series = makeSeries('GT3', [{ venue: 'Spa', config: 'Grand Prix' }])
    const result = computeSeriesCost([series], ['Spa|Grand Prix'])
    expect(result.get('GT3')).toBe(0)
  })

  it('returns 0 for a series where all tracks are free', () => {
    // Lime Rock Park is price 0 in track-prices
    const series = makeSeries('Skip Barber', [{ venue: 'Lime Rock Park', config: 'Grand Prix' }])
    const result = computeSeriesCost([series], [])
    expect(result.get('Skip Barber')).toBe(0)
  })

  it('returns total price of missing paid tracks for a series', () => {
    // Use a track that has a price > 0. Suzuka is $11.99 in track-prices.
    const series = makeSeries('TCR', [{ venue: 'Suzuka International Raceway', config: 'Full' }])
    const result = computeSeriesCost([series], [])
    expect(result.get('TCR')).toBeGreaterThan(0)
  })

  it('does not double-count the same track appearing in multiple weeks', () => {
    const series = makeSeries('TCR', [
      { venue: 'Suzuka International Raceway', config: 'Full' },
      { venue: 'Suzuka International Raceway', config: 'Full' },
    ])
    const result1 = computeSeriesCost([series], [])
    const series2 = makeSeries('TCR', [{ venue: 'Suzuka International Raceway', config: 'Full' }])
    const result2 = computeSeriesCost([series2], [])
    expect(result1.get('TCR')).toBe(result2.get('TCR'))
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm exec jest lib/analysis/__tests__/series-cost.test.ts 2>&1 | tail -5
```
Expected: error — module not found

- [ ] **Step 3: Implement**

```typescript
// lib/analysis/series-cost.ts
import type { IracingSeries } from '@/lib/iracing/types'
import { makeTrackKey } from '@/lib/iracing/types'
import { getTrackPrice } from '@/lib/iracing/track-prices'

/**
 * Returns a map of seriesName → total cost of missing paid tracks for that series.
 * Tracks with price 0 (free) are excluded. Each unique track key counted once per series.
 */
export function computeSeriesCost(
  selectedSeries: IracingSeries[],
  ownedTrackKeys: string[],
): Map<string, number> {
  const ownedSet = new Set(ownedTrackKeys)
  const result = new Map<string, number>()

  for (const s of selectedSeries) {
    const seen = new Set<string>()
    let total = 0
    for (const w of s.weeks) {
      const key = makeTrackKey(w.venue, w.config)
      if (seen.has(key)) continue
      seen.add(key)
      if (!ownedSet.has(key)) {
        const price = getTrackPrice(key)
        if (price > 0) total += price
      }
    }
    result.set(s.seriesName, total)
  }

  return result
}
```

- [ ] **Step 4: Run tests**

```bash
pnpm exec jest lib/analysis/__tests__/series-cost.test.ts 2>&1 | tail -5
```
Expected: PASS, 4 tests

- [ ] **Step 5: Commit**

```bash
git add lib/analysis/series-cost.ts lib/analysis/__tests__/series-cost.test.ts
git commit -m "feat: add computeSeriesCost utility"
```

---

## Chunk 2: Widget components

### Task 5: `ProfileStrip`

**Files:**
- Create: `components/dashboard/profile-strip.tsx`

- [ ] **Step 1: Create component**

```tsx
// components/dashboard/profile-strip.tsx
import Link from 'next/link'

interface ProfileStripProps {
  name: string
  licenseSportsCar: string
  licenseFormulaCar: string
  licenseOval: string
  licenseDirtRoad: string
  licenseDirtOval: string
  seasonLabel: string
}

const DISCIPLINES = [
  { key: 'licenseSportsCar' as const, label: 'Sports Car', color: '#60b8ff' },
  { key: 'licenseFormulaCar' as const, label: 'Formula Car', color: '#c060ff' },
  { key: 'licenseOval' as const, label: 'Oval', color: '#ff9060' },
  { key: 'licenseDirtRoad' as const, label: 'Dirt Road', color: '#60d890' },
  { key: 'licenseDirtOval' as const, label: 'Dirt Oval', color: '#ffd060' },
] as const

export function ProfileStrip({
  name,
  licenseSportsCar,
  licenseFormulaCar,
  licenseOval,
  licenseDirtRoad,
  licenseDirtOval,
  seasonLabel,
}: ProfileStripProps) {
  const levels: Record<(typeof DISCIPLINES)[number]['key'], string> = {
    licenseSportsCar,
    licenseFormulaCar,
    licenseOval,
    licenseDirtRoad,
    licenseDirtOval,
  }

  return (
    <div className="flex h-[52px] shrink-0 items-center gap-0 border-b border-border-subtle bg-bg-elevated px-4">
      {name && (
        <>
          <span className="text-[13px] font-semibold text-text-primary">{name}</span>
          <div className="mx-3 h-[22px] w-px bg-border-subtle" />
        </>
      )}
      <div className="flex items-center gap-3.5">
        {DISCIPLINES.map(({ key, label, color }) => (
          <span key={key} className="flex items-center gap-[5px] text-[10px]">
            <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: color }} />
            <span className="text-text-muted">{label}</span>
            <span className="font-semibold text-text-secondary ml-0.5">{levels[key]}</span>
          </span>
        ))}
      </div>
      <div className="ml-auto flex items-center gap-3">
        <span className="text-[10px] text-text-muted">{seasonLabel}</span>
        <Link href="/setup" className="text-[10px] text-accent-cyan/40 transition-colors hover:text-accent-cyan/80">
          Ändra profil →
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify lint passes**

```bash
cd /home/thomas/repos/iracing-series-planner && pnpm lint 2>&1 | tail -15
```
Expected: no errors related to `profile-strip.tsx`

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/profile-strip.tsx
git commit -m "feat: add ProfileStrip component"
```

---

### Task 6: `CostWidget` (updated for new layout)

**Files:**
- Modify: `components/dashboard/cost-widget.tsx`

The widget loses its inline expand behaviour (now routes to `/dashboard/costs`) and gains a per-series breakdown using `computeSeriesCost`.

- [ ] **Step 1: Update `CostWidget`**

Replace the entire file:

```tsx
// components/dashboard/cost-widget.tsx
import Link from 'next/link'
import type { ContentCostSummary } from '@/lib/analysis/types'

interface CostWidgetProps {
  summary: ContentCostSummary
  seriesCosts: Record<string, number>  // seriesName → cost
}

export function CostWidget({ summary, seriesCosts }: CostWidgetProps) {
  const entries = Object.entries(seriesCosts).sort((a, b) => b[1] - a[1])

  return (
    <div className="flex flex-col overflow-hidden min-h-0">
      <div className="flex shrink-0 items-center justify-between px-3.5 pb-2 pt-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Kostnader</span>
        <Link
          href="/dashboard/costs"
          className="text-[10px] text-accent-cyan/40 transition-colors hover:text-accent-cyan/80"
        >
          Full analys →
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto px-3.5 pb-3">
        <div className="mb-3">
          <div className="text-[28px] font-bold leading-none text-[#ff9060] tabular-nums">
            ${summary.totalAfterDiscount.toFixed(2)}
          </div>
          <div className="mt-1 text-[10px] text-text-muted">
            {summary.trackCount} saknade banor · {summary.carCount} bilar
          </div>
        </div>
        <div className="flex flex-col gap-[3px]">
          {entries.map(([name, cost]) => (
            <div
              key={name}
              className="flex items-center justify-between rounded px-2 py-1.5 text-[10px]"
              style={{ background: 'rgba(255,255,255,0.025)' }}
            >
              <span className="truncate text-text-secondary">{name}</span>
              <span
                className="ml-2 shrink-0 font-semibold tabular-nums"
                style={{ color: cost === 0 ? '#50c878' : '#ff9060' }}
              >
                ${cost.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify lint passes**

```bash
pnpm lint 2>&1 | tail -15
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/cost-widget.tsx
git commit -m "feat: update CostWidget — route to /dashboard/costs, add per-series breakdown"
```

---

### Task 7: `MatrixWidget`

**Files:**
- Create: `components/dashboard/matrix-widget.tsx`

- [ ] **Step 1: Create component**

```tsx
// components/dashboard/matrix-widget.tsx
'use client'

import Link from 'next/link'
import { makeTrackKey } from '@/lib/iracing/types'
import { getTrackPrice } from '@/lib/iracing/track-prices'
import type { IracingSeries } from '@/lib/iracing/types'

type CellStatus = 'owned' | 'missing' | 'free'

function getStatus(venue: string, config: string | null, ownedSet: Set<string>): CellStatus {
  const key = makeTrackKey(venue, config)
  if (ownedSet.has(key)) return 'owned'
  if (getTrackPrice(key) === 0) return 'free'
  return 'missing'
}

const STATUS_COLORS: Record<CellStatus, string> = {
  owned: 'rgba(80,200,120,0.35)',
  missing: 'rgba(255,80,80,0.3)',
  free: 'rgba(80,180,255,0.25)',
}
const STATUS_LABELS: Record<CellStatus, string> = {
  owned: 'Äger',
  missing: 'Saknas',
  free: 'Inkl.',
}
const STATUS_COLORS_TEXT: Record<CellStatus, string> = {
  owned: '#50c878',
  missing: '#ff6060',
  free: '#60b8ff',
}

interface MatrixWidgetProps {
  selectedSeries: IracingSeries[]
  ownedTrackKeys: string[]
  currentWeekIndex: number
}

export function MatrixWidget({ selectedSeries, ownedTrackKeys, currentWeekIndex }: MatrixWidgetProps) {
  const ownedSet = new Set(ownedTrackKeys)
  const upcomingWeekIndices = selectedSeries[0]?.weeks
    .map((_, i) => i)
    .filter((i) => i > currentWeekIndex)
    .slice(0, 8) ?? []

  return (
    <div className="flex flex-col overflow-hidden min-h-0">
      <div className="flex shrink-0 items-center justify-between px-3.5 pb-2 pt-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
          Track Matrix · v{currentWeekIndex + 1}
        </span>
        <Link
          href="/dashboard/matrix"
          className="text-[10px] text-accent-cyan/40 transition-colors hover:text-accent-cyan/80"
        >
          Full matris →
        </Link>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-3.5 pb-3">
        {/* This week */}
        <div>
          <div className="mb-1.5 text-[9px] font-semibold uppercase tracking-widest text-text-muted/60">
            Denna vecka
          </div>
          <div className="flex flex-col gap-[3px]">
            {selectedSeries.map((s) => {
              const week = s.weeks[currentWeekIndex]
              if (!week) return null
              const status = getStatus(week.venue, week.config, ownedSet)
              return (
                <div
                  key={s.seriesName}
                  className="flex items-center gap-2 rounded px-2 py-1.5"
                  style={{ background: 'rgba(255,255,255,0.025)' }}
                >
                  <span
                    className="h-[7px] w-[7px] shrink-0 rounded-full"
                    style={{ background: STATUS_COLORS_TEXT[status] }}
                  />
                  <div className="flex flex-1 min-w-0 flex-col">
                    <span className="truncate text-[10px] text-text-secondary">{s.seriesName}</span>
                    <span className="truncate text-[9px] text-text-muted">{week.track}</span>
                  </div>
                  <span className="shrink-0 text-[9px] font-semibold" style={{ color: STATUS_COLORS_TEXT[status] }}>
                    {STATUS_LABELS[status]}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Upcoming weeks mini-matrix */}
        {upcomingWeekIndices.length > 0 && (
          <div>
            <div className="mb-1.5 text-[9px] font-semibold uppercase tracking-widest text-text-muted/60">
              Kommande veckor
            </div>
            {/* Week labels */}
            <div className="mb-1 flex gap-[2px] pl-[108px]">
              {upcomingWeekIndices.map((wi) => (
                <div key={wi} className="w-4 text-center text-[8px] text-text-muted/50">
                  v{wi + 1}
                </div>
              ))}
            </div>
            {/* Rows */}
            {selectedSeries.map((s) => (
              <div key={s.seriesName} className="mb-[2px] flex items-center gap-[2px]">
                <span className="w-[104px] shrink-0 truncate text-[9px] text-text-muted">{s.seriesName}</span>
                {upcomingWeekIndices.map((wi) => {
                  const week = s.weeks[wi]
                  if (!week) return <div key={wi} className="h-[10px] w-4 rounded-[2px]" />
                  const status = getStatus(week.venue, week.config, ownedSet)
                  return (
                    <div
                      key={wi}
                      className="h-[10px] w-4 shrink-0 rounded-[2px]"
                      style={{ background: STATUS_COLORS[status] }}
                      title={`${week.track} — ${STATUS_LABELS[status]}`}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify lint passes**

```bash
pnpm lint 2>&1 | tail -15
```

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/matrix-widget.tsx
git commit -m "feat: add MatrixWidget component"
```

---

### Task 8: `MySeriesWidget`

**Files:**
- Create: `components/dashboard/my-series-widget.tsx`

- [ ] **Step 1: Create component**

```tsx
// components/dashboard/my-series-widget.tsx
import Link from 'next/link'
import { makeTrackKey } from '@/lib/iracing/types'
import { getTrackPrice } from '@/lib/iracing/track-prices'
import type { IracingSeries } from '@/lib/iracing/types'

type TrackStatus = 'owned' | 'missing' | 'free'

function getTrackStatus(venue: string, config: string | null, ownedSet: Set<string>): TrackStatus {
  const key = makeTrackKey(venue, config)
  if (ownedSet.has(key)) return 'owned'
  if (getTrackPrice(key) === 0) return 'free'
  return 'missing'
}

const BADGE_STYLES: Record<TrackStatus, { label: string; color: string; bg: string }> = {
  owned: { label: 'Äger', color: '#50c878', bg: 'rgba(80,200,120,0.12)' },
  missing: { label: 'Saknar bana', color: '#ff6060', bg: 'rgba(255,80,80,0.1)' },
  free: { label: 'Inkluderad', color: '#60b8ff', bg: 'rgba(80,180,255,0.1)' },
}

const CATEGORY_LABELS: Record<string, string> = {
  SPORTS_CAR: 'Sports Car',
  FORMULA_CAR: 'Formula Car',
  OVAL: 'Oval',
  DIRT_ROAD: 'Dirt Road',
  DIRT_OVAL: 'Dirt Oval',
  UNRANKED: 'Unranked',
}

interface MySeriesWidgetProps {
  selectedSeries: IracingSeries[]
  ownedTrackKeys: string[]
  currentWeekIndex: number
}

export function MySeriesWidget({ selectedSeries, ownedTrackKeys, currentWeekIndex }: MySeriesWidgetProps) {
  const ownedSet = new Set(ownedTrackKeys)

  return (
    <div className="flex flex-col overflow-hidden min-h-0">
      <div className="flex shrink-0 items-center justify-between px-3.5 pb-2 pt-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Mina serier</span>
        <Link
          href="/setup"
          className="text-[10px] text-accent-cyan/40 transition-colors hover:text-accent-cyan/80"
        >
          Ändra urval →
        </Link>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto px-3.5 pb-3">
        {selectedSeries.map((s) => {
          const week = s.weeks[currentWeekIndex]
          const status = week ? getTrackStatus(week.venue, week.config, ownedSet) : 'owned'
          const badge = BADGE_STYLES[status]
          return (
            <div
              key={s.seriesName}
              className="shrink-0 rounded-md border px-2.5 py-2"
              style={{ borderColor: 'rgba(255,255,255,0.07)' }}
            >
              <div className="mb-1.5 flex items-start justify-between gap-2">
                <span className="text-[10px] font-semibold leading-snug text-text-secondary">{s.seriesName}</span>
                <span
                  className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold"
                  style={{ color: badge.color, background: badge.bg }}
                >
                  {badge.label}
                </span>
              </div>
              <div className="mb-1 flex flex-wrap gap-1">
                <span className="rounded-[3px] border px-1.5 py-0.5 text-[9px] text-text-muted"
                  style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.04)' }}>
                  {CATEGORY_LABELS[s.category] ?? s.category}
                </span>
                <span className="rounded-[3px] border px-1.5 py-0.5 text-[9px] text-text-muted"
                  style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.04)' }}>
                  {s.class}
                </span>
              </div>
              {week && (
                <div className="text-[9px] text-text-muted/70 truncate">{week.track}</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify lint passes**

```bash
pnpm lint 2>&1 | tail -15
```

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/my-series-widget.tsx
git commit -m "feat: add MySeriesWidget component"
```

---

### Task 9: `RaceConditionsWidget`

**Files:**
- Create: `components/dashboard/race-conditions-widget.tsx`

- [ ] **Step 1: Create component**

```tsx
// components/dashboard/race-conditions-widget.tsx
import Link from 'next/link'
import { parseRaceConditions } from '@/lib/iracing/race-conditions'
import type { IracingSeries } from '@/lib/iracing/types'

interface RaceConditionsWidgetProps {
  selectedSeries: IracingSeries[]
  currentWeekIndex: number
}

export function RaceConditionsWidget({ selectedSeries, currentWeekIndex }: RaceConditionsWidgetProps) {
  return (
    <div className="flex flex-col overflow-hidden min-h-0">
      <div className="flex shrink-0 items-center justify-between px-3.5 pb-2 pt-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
          Veckans förutsättningar
        </span>
        <Link
          href="/series"
          className="text-[10px] text-accent-cyan/40 transition-colors hover:text-accent-cyan/80"
        >
          Alla serier →
        </Link>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-3.5 pb-3">
        {selectedSeries.map((s) => {
          const week = s.weeks[currentWeekIndex]
          if (!week) return null
          const cond = parseRaceConditions(week.notes, week.referenceSession)

          return (
            <div
              key={s.seriesName}
              className="shrink-0 pb-2.5 border-b last:border-b-0"
              style={{ borderColor: 'rgba(255,255,255,0.05)' }}
            >
              <div className="mb-1.5 flex items-baseline justify-between gap-2">
                <span className="truncate text-[10px] font-semibold text-text-secondary">{s.seriesName}</span>
                <span className="shrink-0 truncate text-[9px] text-text-muted">{week.track}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {/* Weather type */}
                <Pill
                  label={cond.isDynamic ? 'Dynamiskt väder' : 'Fast väder'}
                  accent={cond.isDynamic ? 'cyan' : undefined}
                />
                {/* Temperature */}
                {cond.tempC !== null && <Pill label={`${cond.tempC}°C`} />}
                {/* Rain */}
                {cond.rainChance !== null && (
                  <Pill label={`Regn ${cond.rainChance}%`} accent={cond.rainChance >= 25 ? 'amber' : 'cyan'} />
                )}
                {/* Time */}
                {cond.startTime && (
                  <Pill label={cond.startTime} accent={cond.isNight ? 'purple' : undefined} />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Pill({ label, accent }: { label: string; accent?: 'cyan' | 'amber' | 'purple' }) {
  const styles: Record<string, { color: string; bg: string; border: string }> = {
    cyan:   { color: '#60d8ff', bg: 'rgba(0,200,255,0.07)',   border: 'rgba(0,200,255,0.15)' },
    amber:  { color: '#ffc850', bg: 'rgba(255,200,80,0.08)',  border: 'rgba(255,200,80,0.15)' },
    purple: { color: '#b090ff', bg: 'rgba(120,80,255,0.08)',  border: 'rgba(120,80,255,0.15)' },
    default:{ color: '#888',    bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.07)' },
  }
  const s = styles[accent ?? 'default']
  return (
    <span
      className="inline-flex items-center rounded px-1.5 py-0.5 text-[9px] whitespace-nowrap"
      style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}
    >
      {label}
    </span>
  )
}
```

- [ ] **Step 2: Verify lint passes**

```bash
pnpm lint 2>&1 | tail -15
```

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/race-conditions-widget.tsx
git commit -m "feat: add RaceConditionsWidget component"
```

---

## Chunk 3: Layout shell and routes

### Task 10: `DashboardHub` layout shell

**Files:**
- Create: `components/dashboard/dashboard-hub.tsx`

- [ ] **Step 1: Create component**

```tsx
// components/dashboard/dashboard-hub.tsx
'use client'

import type { IracingSeries } from '@/lib/iracing/types'
import type { ContentCostSummary } from '@/lib/analysis/types'
import { ProfileStrip } from './profile-strip'
import { CostWidget } from './cost-widget'
import { MatrixWidget } from './matrix-widget'
import { MySeriesWidget } from './my-series-widget'
import { RaceConditionsWidget } from './race-conditions-widget'

interface DashboardHubProps {
  // Profile
  name: string
  licenseSportsCar: string
  licenseFormulaCar: string
  licenseOval: string
  licenseDirtRoad: string
  licenseDirtOval: string
  seasonLabel: string
  // Cost
  summary: ContentCostSummary
  seriesCosts: Record<string, number>  // Map is not JSON-serializable across server→client boundary
  // Shared series data
  selectedSeries: IracingSeries[]
  ownedTrackKeys: string[]
  currentWeekIndex: number
}

export function DashboardHub({
  name,
  licenseSportsCar,
  licenseFormulaCar,
  licenseOval,
  licenseDirtRoad,
  licenseDirtOval,
  seasonLabel,
  summary,
  seriesCosts,
  selectedSeries,
  ownedTrackKeys,
  currentWeekIndex,
}: DashboardHubProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <ProfileStrip
        name={name}
        licenseSportsCar={licenseSportsCar}
        licenseFormulaCar={licenseFormulaCar}
        licenseOval={licenseOval}
        licenseDirtRoad={licenseDirtRoad}
        licenseDirtOval={licenseDirtOval}
        seasonLabel={seasonLabel}
      />
      <div
        className="grid flex-1 overflow-hidden"
        style={{
          gridTemplateColumns: '2fr 3fr',
          gridTemplateRows: 'auto 1fr',
          gap: '1px',
          background: 'rgba(255,255,255,0.05)',
        }}
      >
        {/* Top-left: Cost */}
        <div className="overflow-hidden bg-bg-base">
          <CostWidget summary={summary} seriesCosts={seriesCosts} />
        </div>
        {/* Top-right: My Series */}
        <div className="overflow-hidden bg-bg-base">
          <MySeriesWidget
            selectedSeries={selectedSeries}
            ownedTrackKeys={ownedTrackKeys}
            currentWeekIndex={currentWeekIndex}
          />
        </div>
        {/* Bottom-left: Matrix */}
        <div className="overflow-hidden bg-bg-base">
          <MatrixWidget
            selectedSeries={selectedSeries}
            ownedTrackKeys={ownedTrackKeys}
            currentWeekIndex={currentWeekIndex}
          />
        </div>
        {/* Bottom-right: Race Conditions */}
        <div className="overflow-hidden bg-bg-base">
          <RaceConditionsWidget
            selectedSeries={selectedSeries}
            currentWeekIndex={currentWeekIndex}
          />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify lint passes**

```bash
pnpm lint 2>&1 | tail -15
```

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/dashboard-hub.tsx
git commit -m "feat: add DashboardHub layout shell"
```

---

### Task 11: Rewrite `app/(app)/dashboard/page.tsx`

**Files:**
- Modify: `app/(app)/dashboard/page.tsx`

- [ ] **Step 1: Rewrite dashboard page**

```tsx
// app/(app)/dashboard/page.tsx
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import {
  fetchSelectedSeriesNames,
  fetchOwnedTrackKeys,
  fetchOwnedCarNames,
  fetchUserProfile,
} from '@/lib/db/actions'
import { getAllSeries, CURRENT_SEASON } from '@/lib/iracing/season-data'
import { computeContentCost } from '@/lib/analysis/content-cost'
import { computeSeriesCost } from '@/lib/analysis/series-cost'
import { formatSeasonLabel } from '@/lib/iracing/format-season-label'
import { getCurrentWeekIndex } from '@/lib/iracing/current-week'
import { DashboardHub } from '@/components/dashboard/dashboard-hub'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/')

  const [selectedSeriesNames, ownedTrackKeys, ownedCarNames, profile] = await Promise.all([
    fetchSelectedSeriesNames(session.userId, CURRENT_SEASON),
    fetchOwnedTrackKeys(session.userId),
    fetchOwnedCarNames(session.userId),
    fetchUserProfile(session.userId),
  ])

  const allSeries = getAllSeries()
  const selectedSeries = allSeries.filter((s) => selectedSeriesNames.includes(s.seriesName))

  const { summary } = computeContentCost({ selectedSeries, ownedTrackKeys, ownedCarNames })
  const seriesCosts = Object.fromEntries(computeSeriesCost(selectedSeries, ownedTrackKeys))

  const currentWeekIndex = selectedSeries[0]
    ? getCurrentWeekIndex(selectedSeries[0].weeks)
    : 0

  const resolvedProfile = profile ?? {
    name: '',
    licenseClass: 'Rookie',
    licenseSportsCar: 'Rookie',
    licenseFormulaCar: 'Rookie',
    licenseOval: 'Rookie',
    licenseDirtRoad: 'Rookie',
    licenseDirtOval: 'Rookie',
  }

  return (
    <DashboardHub
      name={resolvedProfile.name}
      licenseSportsCar={resolvedProfile.licenseSportsCar}
      licenseFormulaCar={resolvedProfile.licenseFormulaCar}
      licenseOval={resolvedProfile.licenseOval}
      licenseDirtRoad={resolvedProfile.licenseDirtRoad}
      licenseDirtOval={resolvedProfile.licenseDirtOval}
      seasonLabel={formatSeasonLabel(CURRENT_SEASON)}
      summary={summary}
      seriesCosts={seriesCosts}
      selectedSeries={selectedSeries}
      ownedTrackKeys={ownedTrackKeys}
      currentWeekIndex={currentWeekIndex}
    />
  )
}
```

- [ ] **Step 2: Verify build compiles**

```bash
pnpm build 2>&1 | tail -20
```
Expected: no TypeScript or import errors

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/dashboard/page.tsx
git commit -m "feat: rewrite dashboard page as fixed-height hub"
```

---

### Task 12: Create `/dashboard/matrix` route

**Files:**
- Create: `app/(app)/dashboard/matrix/page.tsx`

- [ ] **Step 1: Create route**

```tsx
// app/(app)/dashboard/matrix/page.tsx
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { getSeason2Schedules } from '@/lib/season-schedules/markdown'
import { DashboardContent } from '@/components/dashboard/dashboard-content'

export default async function MatrixPage() {
  const session = await getSession()
  if (!session) redirect('/')

  const seasonData = await getSeason2Schedules()

  return (
    <div className="p-6">
      <h1 className="mb-4 text-lg font-semibold text-text-primary">Track Matrix</h1>
      <DashboardContent seasonData={seasonData} />
    </div>
  )
}
```

- [ ] **Step 2: Verify build compiles**

```bash
pnpm build 2>&1 | tail -20
```
Expected: no errors, new route `/dashboard/matrix` listed in output

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/dashboard/matrix/page.tsx
git commit -m "feat: add /dashboard/matrix route with full track matrix"
```

---

### Task 13: Fix AppShell layout conflict

`DashboardHub` uses `h-full` which requires the entire parent chain to propagate height. The actual shell component is `components/app-shell.tsx` (not `layout.tsx` directly). Its `<main>` element has `className="flex-1 overflow-auto p-6"` — the `overflow-auto` prevents `h-full` from working correctly, and the `p-6` padding insets the hub from the viewport edges.

**Files:**
- Read: `components/app-shell.tsx`
- Modify: `components/app-shell.tsx`

- [ ] **Step 1: Read AppShell**

```bash
cat components/app-shell.tsx
```

- [ ] **Step 2: Make the dashboard route opt out of default padding and overflow**

The simplest fix: use a CSS data attribute or a wrapper approach so the dashboard page can opt out of `p-6` and `overflow-auto`. Replace the hardcoded `<main className="flex-1 overflow-auto p-6">` with a version that accepts a `noPadding` prop, or — simpler — wrap the `DashboardHub` in a negative-margin escape hatch.

**Recommended approach:** Pass a `bare` boolean prop from `layout.tsx` to `AppShell`, or check the pathname. Since this is a Server Component layout, the cleanest solution is to make `DashboardHub` use a full-bleed escape:

In `components/app-shell.tsx`, change the `<main>` to remove padding conditionally, OR simply change:
```tsx
<main className="flex-1 overflow-auto p-6">
```
to:
```tsx
<main className="flex-1 overflow-hidden">
```

Note: This removes `p-6` from all pages in the `(app)` group. If other pages rely on this padding, add it back at the page level instead (e.g., wrap page content in `<div className="p-6">`). Check `app/(app)/series/page.tsx`, `app/(app)/tracks/page.tsx`, `app/(app)/settings/page.tsx`, `app/(app)/setup/page.tsx` and add `<div className="p-6 overflow-auto h-full">` wrappers as needed.

- [ ] **Step 3: Add padding wrappers to other pages that need it**

For each non-dashboard page that was relying on `p-6` from AppShell:

```bash
# Check which pages exist
ls app/\(app\)/
```

Wrap content in each page (except `/dashboard`) with:
```tsx
<div className="h-full overflow-auto p-6">
  {/* existing content */}
</div>
```

- [ ] **Step 4: Start dev server and verify**

```bash
pnpm dev
```
Open `http://localhost:3000/dashboard` and visually verify:
- No page scroll on the dashboard
- All four widgets visible and filling the viewport below the app's top bar
- Profile strip at the top of the hub
- Other pages (`/series`, `/setup`, etc.) still have correct padding

- [ ] **Step 5: Commit**

```bash
git add components/app-shell.tsx app/\(app\)/series/page.tsx app/\(app\)/setup/page.tsx app/\(app\)/tracks/page.tsx app/\(app\)/settings/page.tsx
git commit -m "fix: move p-6 padding from AppShell main to page level for dashboard compatibility"
```

---

### Task 14: Final lint and build check

- [ ] **Step 1: Run lint**

```bash
pnpm lint 2>&1
```
Expected: no errors

- [ ] **Step 2: Run build**

```bash
pnpm build 2>&1 | tail -30
```
Expected: successful build, all routes listed including `/dashboard/matrix`

- [ ] **Step 3: Commit if any lint fixes were needed**

```bash
git add -A
git commit -m "fix: lint and build fixes"
```
