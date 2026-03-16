# Sub-spec 3: Dashboard Hub — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `/dashboard` with a 4-widget hub: Profile summary, Cost summary (expandable), Matrix (embedded), and Series Schedule (expandable).

**Architecture:** `app/(app)/dashboard/page.tsx` is rewritten as a Server Component that loads all data server-side (user profile, selected series, owned tracks/cars, cost data) and passes it to widget components. The existing `DashboardContent`/`Matrix` and `SeasonScheduleBrowser` are embedded as widgets. A new `ContentPurchaseRecommendation` type is added alongside (not replacing) the existing `PurchaseRecommendation` type. `CostTable` is extended to accept both shapes via a prop union.

**Tech Stack:** Next.js 16, React 19, TypeScript strict, Drizzle ORM + Turso, `pnpm lint` = `tsc --noEmit`

**Prerequisite:** Sub-specs 1 and 2 must be complete.

---

## Chunk 1: Cost Types + Price Maps

### File map
- Modify: `lib/analysis/types.ts` — add ContentItem, ContentPurchaseRecommendation (keep existing types)
- Create: `lib/iracing/track-prices.ts` — static track price map
- Create: `lib/iracing/car-prices.ts` — static car price map
- Create: `lib/analysis/content-cost.ts` — cost computation for new types

---

### Task 1: Add new cost types to `lib/analysis/types.ts`

**Files:**
- Modify: `lib/analysis/types.ts`

- [ ] **Step 1: Append new types** after the existing `CostSummary` interface. Do NOT modify existing types:

```ts
// ── JSON-native cost types ────────────────────────────────────────────────────

export interface ContentItem {
  name: string            // venue+config string for tracks, car name for cars
  type: 'track' | 'car'
  price: number           // USD
  seriesCount: number     // how many selected series need this item
}

export interface ContentPurchaseRecommendation {
  item: ContentItem
  score: number           // = seriesCount (for sorting)
  cumulativeCost: number  // running total including this item
}

export interface ContentCostSummary {
  totalBeforeDiscount: number
  discountTier: string
  discountPercent: number
  discountAmount: number
  totalAfterDiscount: number
  trackCount: number
  carCount: number
}
```

- [ ] **Step 2: Verify compiles**

```bash
cd /home/thomas/repos/iracing-series-planner && pnpm lint
```

- [ ] **Step 3: Commit**

```bash
git add lib/analysis/types.ts
git commit -m "feat: add ContentItem, ContentPurchaseRecommendation, ContentCostSummary types"
```

---

### Task 2: Create `lib/iracing/track-prices.ts`

This is a static price map. iRacing charges $11.99 per track (most tracks). Free tracks (included with subscription) have price 0. The full list is seeded with the most common price; individual free tracks are noted.

**Files:**
- Create: `lib/iracing/track-prices.ts`

- [ ] **Step 1: Create the file**

```ts
/**
 * Static track price map.
 * Key format: "venue|config" (config = "" if null) — matches makeTrackKey().
 * Price in USD. 0 = free with subscription.
 *
 * NOTE: This is a manually maintained list. Update when iRacing changes prices.
 * Most tracks are $11.99. Free (base content) tracks are listed explicitly as 0.
 */
export const TRACK_PRICES: Record<string, number> = {
  // Free tracks (included with subscription)
  'Lime Rock Park|': 0,
  'Lime Rock Park|Grand Prix': 0,
  'Lime Rock Park|Historic': 0,
  'Okayama International Circuit|Full': 0,
  'Okayama International Circuit|Short': 0,
  'Silverstone Circuit|Grand Prix': 0,
  'Silverstone Circuit|International': 0,
  'Silverstone Circuit|National': 0,
  'Watkins Glen International|Boot': 0,
  'Watkins Glen International|Long': 0,
  'Watkins Glen International|Short': 0,
  'Charlotte Motor Speedway|Legends Oval': 0,
  'Charlotte Motor Speedway|Oval': 0,
  'Charlotte Motor Speedway|Roval': 0,
  'Motorsport Arena Oschersleben|A-Kurs': 0,
  'Motorsport Arena Oschersleben|B-Kurs': 0,
  'Motorsport Arena Oschersleben|C-Kurs': 0,
  'Summit Point Motorsports Park|': 0,
  'Summit Point Motorsports Park|Jefferson Circuit': 0,
  'Summit Point Motorsports Park|Shenandoah Circuit': 0,

  // Paid tracks — $11.99 each
  // Add entries here as needed. Default price for unlisted tracks is $11.99 (see getTrackPrice).
}

/** Default price for any track not explicitly listed above */
export const DEFAULT_TRACK_PRICE = 11.99

export function getTrackPrice(trackKey: string): number {
  if (trackKey in TRACK_PRICES) return TRACK_PRICES[trackKey]
  return DEFAULT_TRACK_PRICE
}
```

- [ ] **Step 2: Verify compiles**

```bash
cd /home/thomas/repos/iracing-series-planner && pnpm lint
```

- [ ] **Step 3: Commit**

```bash
git add lib/iracing/track-prices.ts
git commit -m "feat: add static track price map with getTrackPrice helper"
```

---

### Task 3: Create `lib/iracing/car-prices.ts`

**Files:**
- Create: `lib/iracing/car-prices.ts`

- [ ] **Step 1: Create the file**

Most iRacing cars cost $11.99. A selection of free cars (included with subscription) are listed as 0. Cars in the 2026 S2 JSON that are free: Street Stock variants, Mini Stock, Legends Ford '34 Coupe, Skip Barber Formula 2000, VW Beetle and Beetle Lite, Formula Vee, Mazda MX-5 Cup, Late Model Stock, SRX (some are free — seed conservatively).

```ts
/**
 * Static car price map.
 * Key: exact car name string from season-2026-s2.json cars[].
 * Price in USD. 0 = free with subscription.
 * Default for unlisted: $11.99.
 */
export const CAR_PRICES: Record<string, number> = {
  // Free cars (included with subscription)
  'Street Stock - Eagle T3': 0,
  'Street Stock - Panther C1': 0,
  'Street Stock - Casino M2': 0,
  'Mini Stock': 0,
  'Legends Ford \'34 Coupe': 0,
  'Dirt Legends Ford \'34 Coupe': 0,
  'Skip Barber Formula 2000': 0,
  'VW Beetle': 0,
  'VW Beetle - Lite': 0,
  'Formula Vee': 0,
  'Global Mazda MX-5 Cup': 0,
  'Late Model Stock': 0,
  'SCCA Spec Racer Ford': 0,
  'Dallara iR-01': 0,
  'Ray FF1600': 0,

  // Paid cars — $11.99 each
  // Add entries here as needed. Default price for unlisted cars is $11.99 (see getCarPrice).
}

export const DEFAULT_CAR_PRICE = 11.99

export function getCarPrice(carName: string): number {
  if (carName in CAR_PRICES) return CAR_PRICES[carName]
  return DEFAULT_CAR_PRICE
}
```

- [ ] **Step 2: Verify compiles**

```bash
cd /home/thomas/repos/iracing-series-planner && pnpm lint
```

- [ ] **Step 3: Commit**

```bash
git add lib/iracing/car-prices.ts
git commit -m "feat: add static car price map with getCarPrice helper"
```

---

### Task 4: Create `lib/analysis/content-cost.ts`

**Files:**
- Create: `lib/analysis/content-cost.ts`

- [ ] **Step 1: Create the file**

```ts
import type { IracingSeries } from '@/lib/iracing/types'
import { makeTrackKey } from '@/lib/iracing/types'
import { getTrackPrice } from '@/lib/iracing/track-prices'
import { getCarPrice } from '@/lib/iracing/car-prices'
import type { ContentPurchaseRecommendation, ContentCostSummary } from './types'

interface ComputeContentCostArgs {
  selectedSeries: IracingSeries[]
  ownedTrackKeys: string[]
  ownedCarNames: string[]
}

interface ContentCostResult {
  recommendations: ContentPurchaseRecommendation[]
  summary: ContentCostSummary
}

function iRacingDiscount(total: number): { tier: string; percent: number } {
  if (total >= 60) return { tier: 'Platinum', percent: 10 }
  if (total >= 40) return { tier: 'Gold', percent: 10 }
  if (total >= 20) return { tier: 'Silver', percent: 10 }
  return { tier: 'None', percent: 0 }
}

export function computeContentCost({
  selectedSeries,
  ownedTrackKeys,
  ownedCarNames,
}: ComputeContentCostArgs): ContentCostResult {
  const ownedTrackSet = new Set(ownedTrackKeys)
  const ownedCarSet = new Set(ownedCarNames)

  // Count how many series need each missing track
  const trackSeriesCount = new Map<string, number>()
  for (const s of selectedSeries) {
    const seen = new Set<string>()
    for (const w of s.weeks) {
      const key = makeTrackKey(w.venue, w.config)
      if (!ownedTrackSet.has(key) && !seen.has(key)) {
        seen.add(key)
        trackSeriesCount.set(key, (trackSeriesCount.get(key) ?? 0) + 1)
      }
    }
  }

  // Count how many series need each missing car
  const carSeriesCount = new Map<string, number>()
  for (const s of selectedSeries) {
    const carsThisSeries = new Set<string>()
    for (const car of s.cars) carsThisSeries.add(car)
    for (const w of s.weeks) {
      if (w.weekCars) for (const car of w.weekCars) carsThisSeries.add(car)
    }
    for (const car of carsThisSeries) {
      if (!ownedCarSet.has(car)) {
        carSeriesCount.set(car, (carSeriesCount.get(car) ?? 0) + 1)
      }
    }
  }

  // Build recommendations sorted by score desc
  const items: ContentPurchaseRecommendation[] = []

  for (const [key, count] of Array.from(trackSeriesCount.entries()).sort((a, b) => b[1] - a[1])) {
    items.push({
      item: { name: key, type: 'track', price: getTrackPrice(key), seriesCount: count },
      score: count,
      cumulativeCost: 0, // filled below
    })
  }

  for (const [name, count] of Array.from(carSeriesCount.entries()).sort((a, b) => b[1] - a[1])) {
    items.push({
      item: { name, type: 'car', price: getCarPrice(name), seriesCount: count },
      score: count,
      cumulativeCost: 0,
    })
  }

  // Fill cumulative cost
  let running = 0
  for (const rec of items) {
    running += rec.item.price
    rec.cumulativeCost = running
  }

  const totalBeforeDiscount = running
  const { tier, percent } = iRacingDiscount(totalBeforeDiscount)
  const discountAmount = totalBeforeDiscount * (percent / 100)

  const trackCount = Array.from(trackSeriesCount.keys()).length
  const carCount = Array.from(carSeriesCount.keys()).length

  const summary: ContentCostSummary = {
    totalBeforeDiscount,
    discountTier: tier,
    discountPercent: percent,
    discountAmount,
    totalAfterDiscount: totalBeforeDiscount - discountAmount,
    trackCount,
    carCount,
  }

  return { recommendations: items, summary }
}
```

- [ ] **Step 2: Verify compiles**

```bash
cd /home/thomas/repos/iracing-series-planner && pnpm lint
```

- [ ] **Step 3: Commit**

```bash
git add lib/analysis/content-cost.ts
git commit -m "feat: add computeContentCost for JSON-native track + car cost calculation"
```

---

## Chunk 2: Widget Components

### File map
- Create: `components/dashboard/profile-widget.tsx`
- Create: `components/dashboard/cost-widget.tsx`
- Create: `components/dashboard/series-widget.tsx`
- Modify: `components/dashboard/cost-table.tsx` — accept ContentPurchaseRecommendation prop union

---

### Task 5: Create `components/dashboard/profile-widget.tsx`

**Files:**
- Create: `components/dashboard/profile-widget.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { Card } from '@/components/ui/card'
import Link from 'next/link'

interface ProfileWidgetProps {
  name: string
  licenseClass: string
  selectedSeriesCount: number
}

export function ProfileWidget({ name, licenseClass, selectedSeriesCount }: ProfileWidgetProps) {
  return (
    <Card className="p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-text-muted mb-1">
            Profil
          </div>
          <div className="text-lg font-semibold text-text-primary">
            {name || <span className="text-text-muted italic">Ej angivet</span>}
          </div>
          <div className="text-sm text-text-secondary mt-0.5">
            Licens: <span className="text-accent-cyan font-medium">{licenseClass}</span>
          </div>
        </div>
        <Link
          href="/setup"
          className="text-xs text-text-muted hover:text-accent-cyan transition-colors border border-border rounded-md px-2.5 py-1"
        >
          Redigera setup
        </Link>
      </div>
      <div className="text-sm text-text-secondary">
        <span className="font-semibold text-text-primary">{selectedSeriesCount}</span> valda serier
      </div>
    </Card>
  )
}
```

- [ ] **Step 2: Verify compiles**

```bash
cd /home/thomas/repos/iracing-series-planner && pnpm lint
```

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/profile-widget.tsx
git commit -m "feat: add ProfileWidget dashboard card"
```

---

### Task 6: Extend `CostTable` to accept the new content type

**Files:**
- Modify: `components/dashboard/cost-table.tsx`

The existing `CostTable` uses `PurchaseRecommendation` (with `track: Track`). We add a second variant via a discriminated union prop.

- [ ] **Step 1: Add the `ContentCostSummary` import and new props variant** at the top of the file, after existing imports:

```tsx
import type { ContentPurchaseRecommendation, ContentCostSummary } from '@/lib/analysis/types'

type CostTableProps =
  | {
      recommendations: import('@/lib/analysis/types').PurchaseRecommendation[]
      costSummary: import('@/lib/analysis/types').CostSummary
      variant?: 'legacy'
    }
  | {
      recommendations: ContentPurchaseRecommendation[]
      costSummary: ContentCostSummary
      variant: 'content'
    }
```

- [ ] **Step 2: Update the `CostTable` function signature** to use the union type:

```tsx
export function CostTable(props: CostTableProps) {
```

- [ ] **Step 3: Add a content-variant render path** inside `CostTable`. Find the `return` statement and wrap the existing JSX in a condition:

```tsx
if (props.variant === 'content') {
  const { recommendations, costSummary } = props
  if (recommendations.length === 0) {
    return (
      <Card>
        <p className="text-text-secondary text-center py-8">
          Inget att köpa — du har allt du behöver!
        </p>
      </Card>
    )
  }
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 stagger-children">
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-cyan/10">
              <span className="font-display text-sm font-bold text-accent-cyan">
                {costSummary.trackCount + costSummary.carCount}
              </span>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-text-muted">Banor + bilar</div>
              <div className="font-display text-lg font-bold">
                {costSummary.trackCount}b + {costSummary.carCount}bil
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-status-owned/10">
              <span className="font-display text-sm font-bold text-status-owned">%</span>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-text-muted">
                Rabatt ({costSummary.discountTier}: {costSummary.discountPercent}%)
              </div>
              <div className="font-display text-lg font-bold text-status-owned">
                -${costSummary.discountAmount.toFixed(2)}
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-cyan/10">
              <span className="font-display text-sm font-bold text-accent-cyan">$</span>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-text-muted">Total</div>
              <div className="font-display text-lg font-bold">
                ${costSummary.totalAfterDiscount.toFixed(2)}
              </div>
            </div>
          </div>
        </Card>
      </div>
      <div className="space-y-2">
        {recommendations.map((rec) => (
          <div
            key={rec.item.name}
            className="flex items-center justify-between rounded-md border border-border-subtle bg-bg-glass px-4 py-2.5 text-sm"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wide text-text-muted w-8">
                {rec.item.type === 'track' ? 'Bana' : 'Bil'}
              </span>
              <span className="text-text-primary">{rec.item.name}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-text-muted">{rec.item.seriesCount} serier</span>
              <span className="font-mono text-sm text-text-primary">
                ${rec.item.price.toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
// fall through to existing legacy render below
```

The existing function body (legacy path) remains unchanged after this block.

- [ ] **Step 4: Verify compiles**

```bash
cd /home/thomas/repos/iracing-series-planner && pnpm lint
```

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/cost-table.tsx
git commit -m "feat: extend CostTable to accept ContentPurchaseRecommendation via variant prop"
```

---

### Task 7: Create `components/dashboard/cost-widget.tsx`

**Files:**
- Create: `components/dashboard/cost-widget.tsx`

- [ ] **Step 1: Create the file**

```tsx
'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { CostTable } from './cost-table'
import type { ContentPurchaseRecommendation, ContentCostSummary } from '@/lib/analysis/types'

interface CostWidgetProps {
  recommendations: ContentPurchaseRecommendation[]
  summary: ContentCostSummary
}

export function CostWidget({ recommendations, summary }: CostWidgetProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="flex flex-col gap-3">
      <Card
        className="p-5 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-text-muted mb-1">
              Kostnad
            </div>
            <div className="text-2xl font-bold font-display text-text-primary">
              ${summary.totalAfterDiscount.toFixed(2)}
            </div>
            <div className="text-sm text-text-secondary mt-1">
              {summary.trackCount} banor · {summary.carCount} bilar saknas
            </div>
          </div>
          <span className="text-xs text-text-muted mt-1">
            {expanded ? '▲ Dölj' : '▼ Visa detaljer'}
          </span>
        </div>
      </Card>

      {expanded && (
        <CostTable
          recommendations={recommendations}
          costSummary={summary}
          variant="content"
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify compiles**

```bash
cd /home/thomas/repos/iracing-series-planner && pnpm lint
```

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/cost-widget.tsx
git commit -m "feat: add CostWidget with expandable CostTable"
```

---

### Task 8: Create `components/dashboard/series-widget.tsx`

**Files:**
- Create: `components/dashboard/series-widget.tsx`

- [ ] **Step 1: Create the file**

```tsx
'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { SeasonScheduleBrowser } from '@/components/season-schedule-browser'
import type { SeasonScheduleData } from '@/lib/season-schedules/types'

interface SeriesWidgetProps {
  seriesData: SeasonScheduleData
  nextRaceDate: string | null  // ISO date string or null if no upcoming races
}

export function SeriesWidget({ seriesData, nextRaceDate }: SeriesWidgetProps) {
  const [expanded, setExpanded] = useState(false)

  const seriesCount = seriesData.series.length

  return (
    <div className="flex flex-col gap-3">
      <Card
        className="p-5 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-text-muted mb-1">
              Seriescheman
            </div>
            <div className="text-2xl font-bold font-display text-text-primary">
              {seriesCount} serier
            </div>
            {nextRaceDate && (
              <div className="text-sm text-text-secondary mt-1">
                Nästa vecka startar {new Date(nextRaceDate).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' })}
              </div>
            )}
          </div>
          <span className="text-xs text-text-muted mt-1">
            {expanded ? '▲ Dölj' : '▼ Visa scheman'}
          </span>
        </div>
      </Card>

      {expanded && (
        <div className="rounded-lg border border-border-subtle bg-bg-glass overflow-hidden">
          <SeasonScheduleBrowser data={seriesData} />
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify compiles**

```bash
cd /home/thomas/repos/iracing-series-planner && pnpm lint
```

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/series-widget.tsx
git commit -m "feat: add SeriesWidget with expandable SeasonScheduleBrowser"
```

---

## Chunk 3: Dashboard Page

### File map
- Modify: `app/(app)/dashboard/page.tsx` — rewrite as hub with 4 widgets

---

### Task 9: Rewrite `app/(app)/dashboard/page.tsx`

**Files:**
- Modify: `app/(app)/dashboard/page.tsx`

- [ ] **Step 1: Rewrite the file**

```tsx
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import {
  fetchSelectedSeriesNames,
  fetchOwnedTrackKeys,
  fetchOwnedCarNames,
  fetchUserProfile,
} from '@/lib/db/actions'
import { getAllSeries, getTracksForSeries, toSeasonScheduleData } from '@/lib/iracing/season-data'
import { computeContentCost } from '@/lib/analysis/content-cost'
import { ProfileWidget } from '@/components/dashboard/profile-widget'
import { CostWidget } from '@/components/dashboard/cost-widget'
import { SeriesWidget } from '@/components/dashboard/series-widget'
import { DashboardContent } from '@/components/dashboard/dashboard-content'
import { getSeason2Schedules } from '@/lib/season-schedules/markdown'

function getNextRaceDate(selectedSeriesNames: string[]): string | null {
  const today = new Date().toISOString().split('T')[0]
  const allSeries = getAllSeries()
  const selected = allSeries.filter((s) => selectedSeriesNames.includes(s.seriesName))
  let earliest: string | null = null
  for (const s of selected) {
    for (const w of s.weeks) {
      if (w.startDate >= today) {
        if (!earliest || w.startDate < earliest) earliest = w.startDate
      }
    }
  }
  return earliest
}

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/')

  const [selectedSeriesNames, ownedTrackKeys, ownedCarNames, profile, matrixSeasonData] =
    await Promise.all([
      fetchSelectedSeriesNames(session.userId, '2026-2'),
      fetchOwnedTrackKeys(session.userId),
      fetchOwnedCarNames(session.userId),
      fetchUserProfile(session.userId),
      getSeason2Schedules(), // for the legacy Matrix widget
    ])

  const allSeries = getAllSeries()
  const selectedSeries = allSeries.filter((s) => selectedSeriesNames.includes(s.seriesName))
  const selectedSeriesData = toSeasonScheduleData(selectedSeries)

  const { recommendations, summary } = computeContentCost({
    selectedSeries,
    ownedTrackKeys,
    ownedCarNames,
  })

  const nextRaceDate = getNextRaceDate(selectedSeriesNames)

  const resolvedProfile = profile ?? { name: '', licenseClass: 'Rookie' }

  return (
    <div className="flex flex-col gap-6">
      {/* Top row: 2 columns */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ProfileWidget
          name={resolvedProfile.name}
          licenseClass={resolvedProfile.licenseClass}
          selectedSeriesCount={selectedSeriesNames.length}
        />
        <CostWidget recommendations={recommendations} summary={summary} />
      </div>

      {/* Matrix: full width */}
      <DashboardContent seasonData={matrixSeasonData} />

      {/* Series schedule: full width, expandable */}
      <SeriesWidget seriesData={selectedSeriesData} nextRaceDate={nextRaceDate} />
    </div>
  )
}
```

- [ ] **Step 2: Verify compiles**

```bash
cd /home/thomas/repos/iracing-series-planner && pnpm lint
```

- [ ] **Step 3: Start dev server and manually test the dashboard**

```bash
pnpm dev
```

Navigate to http://localhost:3000/dashboard. Verify:
1. Profile widget shows name, license class, series count
2. Cost widget shows total cost collapsed; click to expand shows CostTable
3. Matrix is embedded and functional
4. Series widget shows series count + next race date; click to expand shows SeasonScheduleBrowser
5. Layout: 2-column top row on wide screen, stacks on narrow

- [ ] **Step 4: Commit**

```bash
git add app/'(app)'/dashboard/page.tsx
git commit -m "feat: rewrite dashboard as 4-widget hub (profile, cost, matrix, series schedule)"
```

---

## Done

Sub-spec 3 is complete when:
- `pnpm lint` passes with 0 errors
- `/dashboard` shows all 4 widgets with real data
- Expanding Cost widget shows item list
- Expanding Series widget shows SeasonScheduleBrowser
- `/dashboard/costs` and `/series` still work as direct links (untouched)
