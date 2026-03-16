# Sub-spec 1: Nav + Data Layer — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplify the sidebar to 3 nav items and build a typed data access layer over the new season JSON dataset, with 4 new DB tables.

**Architecture:** The new JSON file at `lib/iracing/data/season-2026-s2.json` replaces iRacing API calls for series/track/car data. A new `season-data.ts` module exports typed accessor functions. Four new DB tables (string-keyed, additive — old tables untouched) are added via Drizzle schema + `pnpm db:push`.

**Tech Stack:** Next.js 16, TypeScript strict, Drizzle ORM + Turso (LibSQL), `pnpm lint` = `tsc --noEmit`

> **Note:** No test framework is configured in this project. Verification is done via `pnpm lint` (TypeScript type-checking) + dev server spot-checking. Each task ends with `pnpm lint` passing.

---

## Chunk 1: Types + Data Accessor

### File map
- Modify: `lib/iracing/types.ts` — append new JSON-native interfaces (do NOT remove existing types)
- Create: `lib/iracing/season-data.ts` — typed accessors over the JSON file

---

### Task 1: Add JSON-native types to `lib/iracing/types.ts`

**Files:**
- Modify: `lib/iracing/types.ts`

- [ ] **Step 1: Append new interfaces** after the last existing export in `lib/iracing/types.ts`:

```ts
// ── JSON-native types (season-2026-s2.json) ──────────────────────────────────

export type IracingCategory =
  | 'OVAL'
  | 'SPORTS_CAR'
  | 'FORMULA_CAR'
  | 'DIRT_OVAL'
  | 'DIRT_ROAD'
  | 'UNRANKED'

export interface IracingWeek {
  week: number
  startDate: string
  track: string           // full combined string e.g. "Charlotte Motor Speedway - Oval"
  venue: string           // venue only e.g. "Charlotte Motor Speedway"
  config: string | null   // config only e.g. "Oval", or null
  raceLength: string
  referenceSession: string
  notes: string
  weekCars?: string[]     // overrides series.cars for rotating-car series when present
}

export interface IracingSeries {
  category: IracingCategory
  class: string
  seriesName: string
  cars: string[]
  license: string
  scheduleFrequency: string
  minEntries: number
  splitAt: number
  drops: number
  incidentRules: string
  weeks: IracingWeek[]
}

export interface IracingSeason {
  season: string
  generatedAt: string
  totalSeries: number
  cars: string[]
  series: IracingSeries[]
}

export interface IracingTrack {
  venue: string
  config: string | null
}

/** Canonical track key: `"${venue}|${config ?? ''}"` */
export function makeTrackKey(venue: string, config: string | null): string {
  return `${venue}|${config ?? ''}`
}
```

- [ ] **Step 2: Verify types compile**

```bash
cd /home/thomas/repos/iracing-series-planner && pnpm lint
```

Expected: no errors related to `lib/iracing/types.ts`

- [ ] **Step 3: Commit**

```bash
git add lib/iracing/types.ts
git commit -m "feat: add JSON-native iRacing types (IracingSeries, IracingTrack, etc.)"
```

---

### Task 2: Create `lib/iracing/season-data.ts`

**Files:**
- Create: `lib/iracing/season-data.ts`

The module loads the JSON file once (module-level) and exports pure accessor functions. The `toSeasonScheduleData` adapter converts the JSON shape to the `SeasonScheduleData` type expected by `SeasonScheduleBrowser`.

- [ ] **Step 1: Create the file**

```ts
import seasonJson from './data/season-2026-s2.json'
import type { IracingSeason, IracingSeries, IracingTrack } from './types'
import { makeTrackKey } from './types'
import type { SeasonScheduleData, SeasonCategory, SeasonSeries, SeasonWeek } from '@/lib/season-schedules/types'

const season = seasonJson as IracingSeason

export function getAllSeries(): IracingSeries[] {
  return season.series
}

export function getSeriesByCategory(category: string): IracingSeries[] {
  return season.series.filter((s) => s.category === category)
}

export function getUniqueTracks(): IracingTrack[] {
  const seen = new Set<string>()
  const tracks: IracingTrack[] = []
  for (const s of season.series) {
    for (const w of s.weeks) {
      const key = makeTrackKey(w.venue, w.config)
      if (!seen.has(key)) {
        seen.add(key)
        tracks.push({ venue: w.venue, config: w.config })
      }
    }
  }
  return tracks
}

export function getTracksForSeries(seriesNames: string[]): IracingTrack[] {
  const nameSet = new Set(seriesNames)
  const seen = new Set<string>()
  const tracks: IracingTrack[] = []
  for (const s of season.series) {
    if (!nameSet.has(s.seriesName)) continue
    for (const w of s.weeks) {
      const key = makeTrackKey(w.venue, w.config)
      if (!seen.has(key)) {
        seen.add(key)
        tracks.push({ venue: w.venue, config: w.config })
      }
    }
  }
  return tracks
}

export function getAllCars(): string[] {
  return season.cars
}

export function getCarsForSeries(seriesNames: string[]): string[] {
  const nameSet = new Set(seriesNames)
  const seen = new Set<string>()
  for (const s of season.series) {
    if (!nameSet.has(s.seriesName)) continue
    for (const car of s.cars) {
      seen.add(car)
    }
    // Also include weekCars for rotating-car series
    for (const w of s.weeks) {
      if (w.weekCars) {
        for (const car of w.weekCars) seen.add(car)
      }
    }
  }
  return Array.from(seen).sort()
}

// ── SeasonScheduleBrowser adapter ────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  oval: 'Oval',
  'sports-car': 'Sports Car',
  'formula-car': 'Formula Car',
  'dirt-oval': 'Dirt Oval',
  'dirt-road': 'Dirt Road',
  unranked: 'Unranked',
}

function toCategoryId(category: string): string {
  return category.toLowerCase().replace('_', '-')
}

export function toSeasonScheduleData(series: IracingSeries[]): SeasonScheduleData {
  // Derive unique categories in order of first appearance
  const categoryIds: string[] = []
  const seen = new Set<string>()
  for (const s of series) {
    const id = toCategoryId(s.category)
    if (!seen.has(id)) {
      seen.add(id)
      categoryIds.push(id)
    }
  }

  const categories: SeasonCategory[] = categoryIds.map((id) => ({
    id,
    label: CATEGORY_LABELS[id] ?? id,
    filename: '', // unused in new architecture
  }))

  const mappedSeries: SeasonSeries[] = series.map((s) => {
    const categoryId = toCategoryId(s.category)
    const weeks: SeasonWeek[] = s.weeks.map((w) => ({
      week: String(w.week),
      startDate: w.startDate,
      track: w.track,
      length: w.raceLength,
      referenceSession: w.referenceSession,
      notes: w.notes,
    }))
    return {
      id: s.seriesName,
      categoryId,
      categoryLabel: CATEGORY_LABELS[categoryId] ?? categoryId,
      className: s.class,
      title: s.seriesName,
      pdfPage: '',
      cars: s.cars.join(', '),
      license: s.license,
      frequency: s.scheduleFrequency,
      extra: s.incidentRules,
      weeks,
    }
  })

  return { categories, series: mappedSeries }
}
```

- [ ] **Step 2: Verify TypeScript passes**

```bash
cd /home/thomas/repos/iracing-series-planner && pnpm lint
```

Expected: 0 errors. If you get "Cannot find module './data/season-2026-s2.json'", add `"resolveJsonModule": true` to `tsconfig.json` `compilerOptions`.

- [ ] **Step 3: Commit**

```bash
git add lib/iracing/season-data.ts
git commit -m "feat: add season-data.ts with JSON accessors and SeasonScheduleBrowser adapter"
```

---

## Chunk 2: DB Schema + Queries

### File map
- Modify: `lib/db/schema.ts` — add 4 new tables
- Modify: `lib/db/queries.ts` — add query functions for new tables
- Modify: `lib/db/actions.ts` — add server actions for new queries

---

### Task 3: Add new tables to `lib/db/schema.ts`

**Files:**
- Modify: `lib/db/schema.ts`

- [ ] **Step 1: Append new table definitions** after the existing exports:

```ts
export const userOwnedTrackKeys = sqliteTable(
  'user_owned_track_keys',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    trackKey: text('track_key').notNull(), // "venue|config", config="" if null
  },
  (t) => [primaryKey({ columns: [t.userId, t.trackKey] })]
)

export const userSelectedSeriesKeys = sqliteTable(
  'user_selected_series_keys',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    seriesName: text('series_name').notNull(),
    season: text('season').notNull(), // hardcoded to '2026-2' for this dataset
  },
  (t) => [primaryKey({ columns: [t.userId, t.seriesName, t.season] })]
)

export const userOwnedCars = sqliteTable(
  'user_owned_cars',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    carName: text('car_name').notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.carName] })]
)

export const userProfile = sqliteTable('user_profile', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull().default(''),
  licenseClass: text('license_class').notNull().default('Rookie'),
})
```

- [ ] **Step 2: Verify schema compiles**

```bash
cd /home/thomas/repos/iracing-series-planner && pnpm lint
```

- [ ] **Step 3: Push schema to database**

```bash
cd /home/thomas/repos/iracing-series-planner && pnpm db:push
```

Expected: Drizzle prints the 4 new table names and "Done". Answer `Yes` to any prompts.

- [ ] **Step 4: Commit**

```bash
git add lib/db/schema.ts
git commit -m "feat: add userOwnedTrackKeys, userSelectedSeriesKeys, userOwnedCars, userProfile tables"
```

---

### Task 4: Add query functions to `lib/db/queries.ts`

**Files:**
- Modify: `lib/db/queries.ts`

- [ ] **Step 1: Update the import** at the top of `lib/db/queries.ts` to include the new tables:

```ts
import {
  users,
  userOwnedTracks,
  userSelectedSeries,
  userOwnedTrackKeys,
  userSelectedSeriesKeys,
  userOwnedCars,
  userProfile,
} from './schema'
```

- [ ] **Step 2: Append new query functions** after the existing `setSelectedSeries` function:

```ts
// ── Track keys (JSON-native) ─────────────────────────────────────────────────

export async function getOwnedTrackKeys(userId: string): Promise<string[]> {
  const rows = await getDb()
    .select({ trackKey: userOwnedTrackKeys.trackKey })
    .from(userOwnedTrackKeys)
    .where(eq(userOwnedTrackKeys.userId, userId))
  return rows.map((r) => r.trackKey)
}

export async function setOwnedTrackKeys(userId: string, trackKeys: string[]): Promise<void> {
  await getDb().delete(userOwnedTrackKeys).where(eq(userOwnedTrackKeys.userId, userId))
  if (trackKeys.length > 0) {
    await getDb()
      .insert(userOwnedTrackKeys)
      .values(trackKeys.map((trackKey) => ({ userId, trackKey })))
  }
}

// ── Selected series keys (JSON-native) ───────────────────────────────────────

export async function getSelectedSeriesNames(userId: string, season: string): Promise<string[]> {
  const rows = await getDb()
    .select({ seriesName: userSelectedSeriesKeys.seriesName })
    .from(userSelectedSeriesKeys)
    .where(
      and(
        eq(userSelectedSeriesKeys.userId, userId),
        eq(userSelectedSeriesKeys.season, season)
      )
    )
  return rows.map((r) => r.seriesName)
}

export async function setSelectedSeriesNames(
  userId: string,
  season: string,
  seriesNames: string[]
): Promise<void> {
  await getDb()
    .delete(userSelectedSeriesKeys)
    .where(
      and(
        eq(userSelectedSeriesKeys.userId, userId),
        eq(userSelectedSeriesKeys.season, season)
      )
    )
  if (seriesNames.length > 0) {
    await getDb()
      .insert(userSelectedSeriesKeys)
      .values(seriesNames.map((seriesName) => ({ userId, seriesName, season })))
  }
}

// ── Owned cars (JSON-native) ─────────────────────────────────────────────────

export async function getOwnedCarNames(userId: string): Promise<string[]> {
  const rows = await getDb()
    .select({ carName: userOwnedCars.carName })
    .from(userOwnedCars)
    .where(eq(userOwnedCars.userId, userId))
  return rows.map((r) => r.carName)
}

export async function setOwnedCarNames(userId: string, carNames: string[]): Promise<void> {
  await getDb().delete(userOwnedCars).where(eq(userOwnedCars.userId, userId))
  if (carNames.length > 0) {
    await getDb()
      .insert(userOwnedCars)
      .values(carNames.map((carName) => ({ userId, carName })))
  }
}

// ── User profile ─────────────────────────────────────────────────────────────

export async function getUserProfile(
  userId: string
): Promise<{ name: string; licenseClass: string } | null> {
  const row = await getDb().query.userProfile.findFirst({
    where: eq(userProfile.userId, userId),
  })
  return row ? { name: row.name, licenseClass: row.licenseClass } : null
}

export async function setUserProfile(
  userId: string,
  name: string,
  licenseClass: string
): Promise<void> {
  await getDb()
    .insert(userProfile)
    .values({ userId, name, licenseClass })
    .onConflictDoUpdate({
      target: userProfile.userId,
      set: { name, licenseClass },
    })
}
```

- [ ] **Step 3: Verify compiles**

```bash
cd /home/thomas/repos/iracing-series-planner && pnpm lint
```

- [ ] **Step 4: Commit**

```bash
git add lib/db/queries.ts
git commit -m "feat: add query functions for track keys, series names, owned cars, user profile"
```

---

### Task 5: Add server actions to `lib/db/actions.ts`

**Files:**
- Modify: `lib/db/actions.ts`

- [ ] **Step 1: Update imports** at the top of `lib/db/actions.ts`:

```ts
import {
  getOwnedTrackIds,
  setTrackOwned,
  bulkSetTracksOwned,
  clearOwnedTracks,
  getSelectedSeriesIds,
  setSelectedSeries,
  getOwnedTrackKeys,
  setOwnedTrackKeys,
  getSelectedSeriesNames,
  setSelectedSeriesNames,
  getOwnedCarNames,
  setOwnedCarNames,
  getUserProfile,
  setUserProfile,
} from './queries'
```

- [ ] **Step 2: Append new server actions** at the bottom of the file:

```ts
// ── JSON-native actions ───────────────────────────────────────────────────────

export async function fetchOwnedTrackKeys(userId: string) {
  return getOwnedTrackKeys(userId)
}

export async function saveOwnedTrackKeys(userId: string, trackKeys: string[]) {
  await setOwnedTrackKeys(userId, trackKeys)
}

export async function fetchSelectedSeriesNames(userId: string, season: string) {
  return getSelectedSeriesNames(userId, season)
}

export async function saveSelectedSeriesNames(
  userId: string,
  season: string,
  seriesNames: string[]
) {
  await setSelectedSeriesNames(userId, season, seriesNames)
}

export async function fetchOwnedCarNames(userId: string) {
  return getOwnedCarNames(userId)
}

export async function saveOwnedCarNames(userId: string, carNames: string[]) {
  await setOwnedCarNames(userId, carNames)
}

export async function fetchUserProfile(userId: string) {
  return getUserProfile(userId)
}

export async function saveUserProfile(userId: string, name: string, licenseClass: string) {
  await setUserProfile(userId, name, licenseClass)
}
```

- [ ] **Step 3: Verify compiles**

```bash
cd /home/thomas/repos/iracing-series-planner && pnpm lint
```

- [ ] **Step 4: Commit**

```bash
git add lib/db/actions.ts
git commit -m "feat: add server actions for JSON-native track keys, series, cars, profile"
```

---

## Chunk 3: Nav Simplification

### File map
- Modify: `components/app-shell.tsx` — remove 4 nav items, keep 3

---

### Task 6: Simplify nav in `components/app-shell.tsx`

**Files:**
- Modify: `components/app-shell.tsx`

- [ ] **Step 1: Replace `navItems` array** (currently 6 items) with:

```ts
const navItems: NavItem[] = [
  { href: '/setup',     label: 'Setup',         icon: Compass,         group: 'planering' },
  { href: '/dashboard', label: 'Dashboard',      icon: LayoutDashboard, group: 'planering' },
  { href: '/settings',  label: 'Inställningar',  icon: Settings,        group: 'planering' },
]
```

- [ ] **Step 2: Replace `navGroups` array** — all 3 items are in one group now, so remove the Analys group:

```ts
const navGroups: { key: 'planering' | 'analys'; label: string }[] = [
  { key: 'planering', label: 'Planering' },
]
```

- [ ] **Step 3: Update `pageMeta`** to match the 3 routes:

```ts
const pageMeta: Record<string, { breadcrumb: string; title: string }> = {
  '/setup':     { breadcrumb: 'Planering', title: 'Välj serier' },
  '/dashboard': { breadcrumb: 'Planering', title: 'Dashboard' },
  '/settings':  { breadcrumb: 'Planering', title: 'Inställningar' },
}
```

- [ ] **Step 4: Remove `navShouldCarrySeries`** and all references to it (the `seriesParam` variable and `navHref` conditional logic). Simplify the `<Link>` in the nav group map:

Replace this block inside the `groupItems.map(...)`:
```ts
const navHref =
  seriesParam && navShouldCarrySeries.has(href)
    ? `${href}?series=${seriesParam}`
    : href
```
...with just `const navHref = href`.

Also remove:
```ts
const seriesParam = searchParams.get('series')
const navShouldCarrySeries = new Set(['/tracks', '/series', '/dashboard', '/dashboard/costs'])
```

And remove the `useSearchParams` import if it's no longer used elsewhere in the file. Check: `searchParams` is still used in the `useEffect` for season badge — keep the import, just remove those two consts.

- [ ] **Step 5: Remove `focusModeActive` logic** — this referenced `/tracks` and `/dashboard/costs` routes that are now gone from nav. Remove:
  - `emphasizeFocusFlow` state
  - `setEmphasizeFocusFlow`
  - `isPrimaryFlowRoute`
  - `hasReachedCostStep`
  - `focusModeActive`
  - `flowStep`
  - The focus mode button in the topbar
  - The focus mode notice box in the nav
  - The `focusModeActive && isAnalys && 'opacity-60'` class on nav links
  - The `isAnalys` variable inside the link render

Also remove unused imports: `CalendarDays`, `DollarSign`, `MapPin` (no longer in navItems). Keep `Compass`, `LayoutDashboard`, `Settings`, `ChevronLeft`, `ChevronRight`, `LogOut`.

- [ ] **Step 6: Verify compiles and check dev server**

```bash
cd /home/thomas/repos/iracing-series-planner && pnpm lint
```

Then `pnpm dev` and open http://localhost:3000. Confirm:
- Sidebar shows Setup, Dashboard, Inställningar only
- No broken TypeScript errors
- Season badge still shows in the logo area

- [ ] **Step 7: Commit**

```bash
git add components/app-shell.tsx
git commit -m "feat: simplify nav to Setup, Dashboard, Settings — remove focus mode and series-carry logic"
```

---

## Done

Sub-spec 1 is complete when:
- `pnpm lint` passes with 0 errors
- `pnpm db:push` has run and the 4 new tables exist
- Sidebar shows exactly 3 nav items
- `lib/iracing/season-data.ts` is importable with all accessors typed

Proceed to: `docs/superpowers/plans/2026-03-17-subspec2-wizard.md`
