# Wizard UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 4-step setup wizard with a single-page series selector featuring inline filters, license-colored badges, and streamlined UX.

**Architecture:** New `SeriesSetup` client component absorbs all logic from `SetupWizard` + `SeriesSelector` into one file. Filter state (categories, classes) moves from separate wizard steps to inline chip toggles above a virtualized series list. Old wizard components are deleted.

**Tech Stack:** React 19, Next.js 16 App Router, Tailwind CSS 4, TypeScript strict

**Spec:** `docs/superpowers/specs/2026-03-15-wizard-ux-redesign-design.md`

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `components/wizard/series-setup.tsx` | All-in-one setup page: header, filterbar, virtualized series list |
| Create | `lib/iracing/license-colors.ts` | License color mapping (iRacing R/D/C/B/A/P → softened hex + rgba) |
| Modify | `app/(app)/setup/page.tsx` | Update import from `SetupWizard` → `SeriesSetup` |
| Delete | `components/wizard/setup-wizard.tsx` | Old wizard orchestrator |
| Delete | `components/wizard/step-indicator.tsx` | Step indicator UI |
| Delete | `components/wizard/season-selector.tsx` | Season picker |
| Delete | `components/wizard/category-filter.tsx` | Category filter step |
| Delete | `components/wizard/class-filter.tsx` | Class filter step |
| Delete | `components/wizard/series-selector.tsx` | Old series list (absorbed into series-setup) |

---

## Chunk 1: License color utility + new SeriesSetup component

### Task 1: Create license color utility

**Files:**
- Create: `lib/iracing/license-colors.ts`

- [ ] **Step 1: Create the license color mapping file**

```ts
// lib/iracing/license-colors.ts

interface LicenseColor {
  text: string
  bg: string
  border: string
}

const licenseColors: Record<string, LicenseColor> = {
  R: { text: '#d45555', bg: 'rgba(200,60,60,0.12)', border: 'rgba(200,60,60,0.22)' },
  D: { text: '#d9a040', bg: 'rgba(220,150,40,0.12)', border: 'rgba(220,150,40,0.22)' },
  C: { text: '#d4c645', bg: 'rgba(210,190,50,0.12)', border: 'rgba(210,190,50,0.22)' },
  B: { text: '#5cc97a', bg: 'rgba(60,170,90,0.12)', border: 'rgba(60,170,90,0.22)' },
  A: { text: '#68b0e8', bg: 'rgba(70,130,210,0.12)', border: 'rgba(70,130,210,0.22)' },
  P: { text: '#a0a0b0', bg: 'rgba(180,180,200,0.08)', border: 'rgba(180,180,200,0.15)' },
}

const fallback: LicenseColor = { text: '#7d8aa6', bg: 'rgba(22,34,56,0.4)', border: 'rgba(38,53,83,0.5)' }

export function getLicenseColor(license: string): LicenseColor {
  const letter = license.trim().charAt(0).toUpperCase()
  return licenseColors[letter] ?? fallback
}

export function getLicenseLabel(raw: string): string {
  if (!raw) return 'N/A'
  return raw.split(',')[0]?.trim() ?? raw
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `pnpm exec tsc --noEmit --pretty`
Expected: No errors related to `license-colors.ts`

- [ ] **Step 3: Commit**

```bash
git add lib/iracing/license-colors.ts
git commit -m "feat: add iRacing license color utility"
```

---

### Task 2: Create SeriesSetup component — state and filtering logic

**Files:**
- Create: `components/wizard/series-setup.tsx`

This is the core component. Build it incrementally — first the state/filtering logic, then the UI in subsequent tasks.

- [ ] **Step 1: Create the component file with all state, memos, effects, and handlers**

```tsx
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { SeasonScheduleData, SeasonSeries } from '@/lib/season-schedules/types'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { getLicenseColor, getLicenseLabel } from '@/lib/iracing/license-colors'

interface SeriesSetupProps {
  data: SeasonScheduleData
}

interface PersistedSetupState {
  season: string
  selectedCategoryIds: string[]
  selectedClassNames: string[]
  selectedSeriesIds: string[]
}

type SortKey = 'name' | 'category' | 'class' | 'weeks'

const ROW_HEIGHT = 86
const VIEWPORT_HEIGHT = 540
const OVERSCAN_ROWS = 6
const defaultSeason = '2026-2'
const storageKey = 'series-setup-state-v1'

function normalize(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function SeriesSetup({ data }: SeriesSetupProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const hydratedRef = useRef(false)

  // --- State ---
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    data.categories.map((c) => c.id)
  )
  const [selectedClassNames, setSelectedClassNames] = useState<string[]>([])
  const [selectedSeriesIds, setSelectedSeriesIds] = useState<string[]>([])
  const [search, setSearch] = useState(searchParams.get('setup_q') ?? '')
  const [sortKey, setSortKey] = useState<SortKey>(
    (searchParams.get('setup_sort') as SortKey) ?? 'name'
  )
  const [sortAscending, setSortAscending] = useState(
    (searchParams.get('setup_dir') ?? 'asc') === 'asc'
  )
  const [scrollTop, setScrollTop] = useState(0)

  // --- Derived data ---
  const categoryLabelMap = useMemo(
    () => Object.fromEntries(data.categories.map((c) => [c.id, c.label])),
    [data]
  )

  const availableCategoryIds = useMemo(
    () => new Set(data.categories.map((c) => c.id)),
    [data.categories]
  )
  const availableSeriesIds = useMemo(
    () => new Set(data.series.map((s) => s.id)),
    [data.series]
  )

  // Filter series by selected categories + classes
  const categoryFilteredSeries = useMemo(() => {
    return data.series.filter((s) => {
      if (selectedCategoryIds.length > 0 && !selectedCategoryIds.includes(s.categoryId)) return false
      if (selectedClassNames.length > 0 && !selectedClassNames.includes(s.className)) return false
      return true
    })
  }, [data.series, selectedCategoryIds, selectedClassNames])

  // IMPORTANT: availableClasses derived from category-filtered series,
  // NOT all series — so class pills update when categories change
  const availableClasses = useMemo(() => {
    const seriesInActiveCategories = data.series.filter(
      (s) => selectedCategoryIds.length === 0 || selectedCategoryIds.includes(s.categoryId)
    )
    const unique = new Set<string>()
    for (const s of seriesInActiveCategories) {
      unique.add(s.className)
    }
    return Array.from(unique).sort((a, b) => a.localeCompare(b))
  }, [data.series, selectedCategoryIds])

  const availableClassNames = useMemo(() => new Set(availableClasses), [availableClasses])

  // Apply search filter on top of category/class filtering
  const searchFilteredSeries = useMemo(() => {
    const query = normalize(search)
    if (!query) return categoryFilteredSeries
    return categoryFilteredSeries.filter((entry) => {
      if (normalize(entry.title).includes(query)) return true
      if (normalize(entry.className).includes(query)) return true
      if (normalize(entry.cars).includes(query)) return true
      return entry.weeks.some((week) => normalize(week.track).includes(query))
    })
  }, [search, categoryFilteredSeries])

  // Sort
  const sortedSeries = useMemo(() => {
    const entries = [...searchFilteredSeries]
    entries.sort((a, b) => {
      let cmp = 0
      if (sortKey === 'name') cmp = a.title.localeCompare(b.title)
      if (sortKey === 'category') cmp = a.categoryLabel.localeCompare(b.categoryLabel)
      if (sortKey === 'class') cmp = a.className.localeCompare(b.className)
      if (sortKey === 'weeks') cmp = a.weeks.length - b.weeks.length
      return sortAscending ? cmp : -cmp
    })
    return entries
  }, [searchFilteredSeries, sortAscending, sortKey])

  // Virtualization
  const allFilteredIds = sortedSeries.map((s) => s.id)
  const totalHeight = sortedSeries.length * ROW_HEIGHT
  const visibleStartIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN_ROWS)
  const visibleEndIndex = Math.min(
    sortedSeries.length,
    Math.ceil((scrollTop + VIEWPORT_HEIGHT) / ROW_HEIGHT) + OVERSCAN_ROWS
  )
  const visibleSeries = sortedSeries.slice(visibleStartIndex, visibleEndIndex)

  // --- localStorage hydration ---
  useEffect(() => {
    if (hydratedRef.current) return
    const raw = localStorage.getItem(storageKey)
    if (!raw) {
      hydratedRef.current = true
      return
    }
    try {
      const parsed = JSON.parse(raw) as Partial<PersistedSetupState>
      if (Array.isArray(parsed.selectedCategoryIds)) {
        setSelectedCategoryIds(
          parsed.selectedCategoryIds.filter(
            (id): id is string => typeof id === 'string' && availableCategoryIds.has(id)
          )
        )
      }
      if (Array.isArray(parsed.selectedClassNames)) {
        setSelectedClassNames(
          parsed.selectedClassNames.filter(
            (name): name is string => typeof name === 'string' && availableClassNames.has(name)
          )
        )
      }
      if (Array.isArray(parsed.selectedSeriesIds)) {
        setSelectedSeriesIds(
          parsed.selectedSeriesIds.filter(
            (id): id is string => typeof id === 'string' && availableSeriesIds.has(id)
          )
        )
      }
    } catch {
      localStorage.removeItem(storageKey)
    } finally {
      hydratedRef.current = true
    }
  }, [availableCategoryIds, availableClassNames, availableSeriesIds])

  // --- localStorage persistence ---
  useEffect(() => {
    if (!hydratedRef.current) return
    const snapshot: PersistedSetupState = {
      season: defaultSeason,
      selectedCategoryIds,
      selectedClassNames,
      selectedSeriesIds,
    }
    localStorage.setItem(storageKey, JSON.stringify(snapshot))
  }, [selectedCategoryIds, selectedClassNames, selectedSeriesIds])

  // --- Clean up stale selections when available options change ---
  useEffect(() => {
    setSelectedCategoryIds((prev) => prev.filter((id) => availableCategoryIds.has(id)))
  }, [availableCategoryIds])

  useEffect(() => {
    setSelectedClassNames((prev) => prev.filter((name) => availableClassNames.has(name)))
  }, [availableClassNames])

  useEffect(() => {
    setSelectedSeriesIds((prev) => prev.filter((id) => availableSeriesIds.has(id)))
  }, [availableSeriesIds])

  // --- URL params sync ---
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (search) params.set('setup_q', search)
    else params.delete('setup_q')
    params.set('setup_sort', sortKey)
    params.set('setup_dir', sortAscending ? 'asc' : 'desc')
    const current = searchParams.toString()
    const next = params.toString()
    if (current === next) return
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false })
  }, [pathname, router, search, searchParams, sortAscending, sortKey])

  // --- Handlers ---
  const toggleCategory = (categoryId: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    )
  }

  const toggleClass = (className: string) => {
    setSelectedClassNames((prev) =>
      prev.includes(className) ? prev.filter((n) => n !== className) : [...prev, className]
    )
  }

  const toggleSeries = (seriesId: string) => {
    setSelectedSeriesIds((prev) =>
      prev.includes(seriesId) ? prev.filter((id) => id !== seriesId) : [...prev, seriesId]
    )
  }

  const selectManySeries = (ids: string[]) => {
    setSelectedSeriesIds((prev) => Array.from(new Set([...prev, ...ids])))
  }

  const clearManySeries = () => {
    const toClear = new Set(allFilteredIds)
    setSelectedSeriesIds((prev) => prev.filter((id) => !toClear.has(id)))
  }

  // Navigate to tracks — no step logic, just navigate directly
  const handleNext = () => {
    const params = new URLSearchParams()
    params.set('season', defaultSeason)
    if (selectedCategoryIds.length > 0) params.set('categories', selectedCategoryIds.join(','))
    if (selectedClassNames.length > 0) params.set('classes', selectedClassNames.join(','))
    if (selectedSeriesIds.length > 0) params.set('series', selectedSeriesIds.join(','))
    router.push(`/tracks?${params.toString()}`)
  }

  // --- Placeholder JSX (replaced in Task 3) ---
  return <div>SeriesSetup placeholder</div>
}
```

Key differences from the old code:
- **No `step` state** — no wizard progression, direct single-page
- **`availableClasses`** filters by active categories (not all series) so class pills update dynamically
- **`handleNext`** navigates directly to `/tracks` — no step-progression conditional
- **New storage key** `series-setup-state-v1` — old wizard state ignored
- **All state in one component** — no `SeriesSelector` child component

- [ ] **Step 2: Verify TypeScript compiles**

Run: `pnpm exec tsc --noEmit --pretty`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add components/wizard/series-setup.tsx
git commit -m "feat: add SeriesSetup component with state and filtering logic"
```

---

### Task 3: Add SeriesSetup UI — header, filterbar, series list

**Files:**
- Modify: `components/wizard/series-setup.tsx`

- [ ] **Step 1: Replace placeholder JSX with the full UI**

The JSX has three zones:

**Header section:**
```tsx
<div className="flex justify-between items-start">
  <div>
    <h2 className="font-display text-lg font-bold text-text-primary">Välj dina serier</h2>
    <p className="text-sm text-text-muted mt-1">
      2026 Season 2 · Markera serier du vill köra, sen fortsätt till banval.
    </p>
  </div>
  <div className="flex items-center gap-3">
    <span className="px-3 py-1 rounded-md bg-accent-primary/10 text-accent-primary text-xs font-display font-semibold">
      {selectedSeriesIds.length} valda
    </span>
    <Button onClick={handleNext} disabled={selectedSeriesIds.length === 0}>
      Fortsätt till Banor →
    </Button>
  </div>
</div>
```

**Filterbar section** (below header, separated by `border-b border-border-subtle`):

Row 1 — Category chips:
- Map `data.categories` to toggleable buttons
- Active style: `bg-accent-primary/10 border-accent-primary/25 text-accent-primary rounded-lg px-3.5 py-1.5 text-xs`
- Inactive style: `bg-bg-elevated/60 border-border text-text-muted rounded-lg px-3.5 py-1.5 text-xs`

Row 2 — Class pills + search + sort:
- Map `availableClasses` (filtered by active categories) to toggleable pills
- Active: `bg-accent-primary/8 border-accent-primary/18 text-accent-primary rounded-full px-2.5 py-1 text-[11px]`
- Inactive: `bg-bg-elevated/40 border-border/50 text-text-muted rounded-full px-2.5 py-1 text-[11px]`
- Vertical divider: `<div className="w-px h-5 bg-border/60 mx-1" />`
- Search `<Input>` with `flex-1 min-w-[200px]`
- Sort `<select>` and direction `<Button variant="secondary">`

**Series list section:**

Counter + bulk actions row:
```tsx
<div className="flex justify-between items-center">
  <span className="text-xs text-text-muted">{sortedSeries.length} serier matchar</span>
  <div className="flex gap-3">
    <Button variant="ghost" className="h-7 px-2 text-xs" onClick={() => onSelectMany(allFilteredIds)}>
      Välj alla
    </Button>
    <Button variant="ghost" className="h-7 px-2 text-xs" onClick={clearManySeries}>
      Rensa
    </Button>
  </div>
</div>
```

Virtualized series list (same scroll container pattern from `series-selector.tsx`):
- Outer div: `h-[540px] overflow-y-auto rounded-xl border border-border/60 bg-bg-surface/30 p-2`
- Inner div: `relative` with `height: totalHeight`
- Each row is `absolute` positioned at `top: index * ROW_HEIGHT`

**Each series row** layout:
```tsx
<button
  className={cn(
    'absolute left-0 right-0 flex h-[78px] items-center gap-3 rounded-lg border px-3 text-left transition-all duration-150',
    selected
      ? 'border-accent-primary/12 bg-accent-primary/4'
      : 'border-border/40 bg-bg-surface/40 hover:border-accent-primary/20 hover:bg-bg-surface/80'
  )}
  style={{ top: `${top}px` }}
  onClick={() => toggleSeries(entry.id)}
>
  <Checkbox checked={selected} ... />
  <div className="flex-1 min-w-0">
    <div className="font-display text-sm font-semibold text-text-primary line-clamp-1">{entry.title}</div>
    <div className="text-[11px] text-text-muted mt-0.5">{entry.className} · {entry.weeks.length} veckor</div>
  </div>
  {/* License badge — uses getLicenseColor() */}
  <span
    className="px-2 py-0.5 rounded text-[10px] font-semibold"
    style={{ color: licColor.text, background: licColor.bg, border: `1px solid ${licColor.border}` }}
  >
    {licenseLabel}
  </span>
  {/* Category badge — neutral */}
  <span className="px-2 py-0.5 rounded text-[10px] bg-accent-muted/50 border border-border/60 text-text-secondary">
    {categoryLabelMap[entry.categoryId] ?? entry.categoryLabel}
  </span>
</button>
```

Import `getLicenseColor` and `getLicenseLabel` from `@/lib/iracing/license-colors`.

Add empty state at bottom (same as current):
```tsx
{sortedSeries.length === 0 && (
  <div className="rounded-lg border border-border p-4 text-sm text-text-secondary">
    Ingen serie matchade filtret.
  </div>
)}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `pnpm exec tsc --noEmit --pretty`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add components/wizard/series-setup.tsx
git commit -m "feat: add complete UI for SeriesSetup component"
```

---

## Chunk 2: Wire up page + delete old files + verify

### Task 4: Update setup page to use new component

**Files:**
- Modify: `app/(app)/setup/page.tsx`

- [ ] **Step 1: Update the import and component reference**

Change:
```tsx
import { SetupWizard } from '@/components/wizard/setup-wizard'
```
To:
```tsx
import { SeriesSetup } from '@/components/wizard/series-setup'
```

Change:
```tsx
return <SetupWizard data={seasonData} />
```
To:
```tsx
return <SeriesSetup data={seasonData} />
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `pnpm exec tsc --noEmit --pretty`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add app/(app)/setup/page.tsx
git commit -m "feat: wire setup page to new SeriesSetup component"
```

---

### Task 5: Delete old wizard components

**Files:**
- Delete: `components/wizard/setup-wizard.tsx`
- Delete: `components/wizard/step-indicator.tsx`
- Delete: `components/wizard/season-selector.tsx`
- Delete: `components/wizard/category-filter.tsx`
- Delete: `components/wizard/class-filter.tsx`
- Delete: `components/wizard/series-selector.tsx`

- [ ] **Step 1: Verify no other files import the old components**

Run: `grep -r "setup-wizard\|step-indicator\|season-selector\|category-filter\|class-filter\|series-selector" --include="*.tsx" --include="*.ts" app/ components/ lib/ -l`

Expected: Only `components/wizard/setup-wizard.tsx` should reference the sub-components. `app/(app)/setup/page.tsx` should now reference `series-setup`, not `setup-wizard`.

If any other files import these components, update them before deleting.

- [ ] **Step 2: Delete all old wizard files**

```bash
rm components/wizard/setup-wizard.tsx
rm components/wizard/step-indicator.tsx
rm components/wizard/season-selector.tsx
rm components/wizard/category-filter.tsx
rm components/wizard/class-filter.tsx
rm components/wizard/series-selector.tsx
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `pnpm exec tsc --noEmit --pretty`
Expected: No errors — no dangling imports

- [ ] **Step 4: Commit**

```bash
git add -u components/wizard/
git commit -m "chore: remove old wizard components (step-indicator, season-selector, category-filter, class-filter, series-selector, setup-wizard)"
```

---

### Task 6: Build verification and visual check

**Files:** None (verification only)

- [ ] **Step 1: Run full lint**

Run: `pnpm lint`
Expected: No errors

- [ ] **Step 2: Run production build**

Run: `pnpm build`
Expected: Build succeeds with no errors

- [ ] **Step 3: Visual verification**

Run: `pnpm dev`

Open `http://localhost:3000/setup` and verify:
1. No wizard steps visible — single page with header, filterbar, series list
2. Category chips toggle on/off, series list updates live
3. Class pills appear/disappear based on active categories
4. Search filters series by name, class, car, track
5. Sort dropdown and direction button work
6. Clicking a series row toggles selection (checkbox fills with orange)
7. "X valda" badge updates in header
8. License badges show correct colors per level (R=red, D=orange, C=yellow, B=green, A=blue, P=silver)
9. Category badges are neutral blue-grey on every row
10. "Fortsätt till Banor →" navigates to `/tracks` with correct query params
11. Button is disabled when 0 series selected
12. Refresh preserves selections (localStorage persistence)
13. Empty state message shows when filters match nothing

- [ ] **Step 4: Commit any fixes from visual check**

If fixes were needed:
```bash
git add -A
git commit -m "fix: address visual issues found during verification"
```
