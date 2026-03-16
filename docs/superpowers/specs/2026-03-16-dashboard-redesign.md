# iRacing Season Planner — Dashboard Redesign Spec

## Overview

Three sequential sub-specs that together replace the current fragmented nav with a focused wizard + dashboard hub experience. Each sub-spec ships independently.

**Data source:** `lib/iracing/data/season-2026-s2.json` — 188 series, 129 cars, 154 unique venues, 6 categories. Replaces iRacing API calls for schedule/series/car data.

---

## Sub-spec 1: Nav + Data Layer

### Goal
Simplify navigation to three items and build the typed data access layer on top of the new JSON dataset.

### Navigation changes

The sidebar/nav lives in `components/app-shell.tsx` (confirmed existing file — the authenticated layout wrapper that renders the two-group sidebar). Edit the `navItems` and `navGroups` consts in that file.

Remove from `components/app-shell.tsx`:
- Seriescheman (`/series`)
- Matris (`/dashboard` standalone link — remains accessible but not in nav as primary destination)
- Banor (`/tracks`)
- Kostnader (`/dashboard/costs`)

Keep:
- **Setup** (`/setup`) — wizard
- **Dashboard** (`/dashboard`) — hub
- **Settings** (`/settings`)

Update `pageMeta` and `navItems` arrays accordingly.

### Data layer

**New file: `lib/iracing/season-data.ts`**

Typed accessor functions over the JSON:
```ts
getAllSeries(): IracingSeries[]
getSeriesByCategory(category: string): IracingSeries[]
getUniqueTracks(): IracingTrack[]                         // unique venue+config pairs across all series
getTracksForSeries(seriesNames: string[]): IracingTrack[] // tracks for given series names
getAllCars(): string[]                                     // from JSON top-level cars[]
getCarsForSeries(seriesNames: string[]): string[]         // cars used by given series names (from series[].cars, deduplicated)
toSeasonScheduleData(series: IracingSeries[]): SeasonScheduleData  // adapter for SeasonScheduleBrowser
```

Cars are identified by their string name (e.g. `"Dallara IR18"`). This matches the `carName: text` column in `userOwnedCars`. No numeric car IDs exist in the dataset — string name is the stable identifier.

**trackKey canonical format:** `` `${venue}|${config ?? ''}` `` — this exact template literal must be used everywhere: in `getUniqueTracks()`, in the Step 3 save, in the cost widget price lookup, and in `track-prices.ts` map keys. Example: `"Charlotte Motor Speedway|Oval"`, `"Langley Speedway|"` (null config → empty string after pipe).

**`toSeasonScheduleData` field mapping** (`IracingSeries` → `SeasonSeries`):

| `SeasonSeries` field | Value from `IracingSeries` |
|---|---|
| `id` | `seriesName` (used as unique key) |
| `categoryId` | `category.toLowerCase().replace('_', '-')` → e.g. `'oval'`, `'sports-car'` |
| `categoryLabel` | Map: `OVAL`→`'Oval'`, `SPORTS_CAR`→`'Sports Car'`, `FORMULA_CAR`→`'Formula Car'`, `DIRT_OVAL`→`'Dirt Oval'`, `DIRT_ROAD`→`'Dirt Road'`, `UNRANKED`→`'Unranked'` |
| `className` | `class` |
| `title` | `seriesName` |
| `pdfPage` | `''` (not in JSON) |
| `cars` | `cars.join(', ')` |
| `license` | `license` |
| `frequency` | `scheduleFrequency` |
| `extra` | `incidentRules` |
| `weeks` | mapped array (see below) |

**`SeasonWeek` field mapping** (`IracingWeek` → `SeasonWeek`):

| `SeasonWeek` field | Value |
|---|---|
| `week` | `String(week)` |
| `startDate` | `startDate` |
| `track` | `track` (full string, e.g. `"Charlotte Motor Speedway - Oval"`) |
| `length` | `raceLength` |
| `referenceSession` | `referenceSession` |
| `notes` | `notes` |

`SeasonCategory[]` is derived from the unique categoryIds in the series array. Set `filename: ''` for all categories — this field was used by the old PDF-based data loader and is not used by `SeasonScheduleBrowser` for rendering.

**New/updated file: `lib/iracing/types.ts`**

```ts
interface IracingSeason {
  season: string
  generatedAt: string
  totalSeries: number
  cars: string[]
  series: IracingSeries[]
}

interface IracingSeries {
  category: 'OVAL' | 'SPORTS_CAR' | 'FORMULA_CAR' | 'DIRT_OVAL' | 'DIRT_ROAD' | 'UNRANKED'
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

interface IracingWeek {
  week: number
  startDate: string
  track: string           // full combined string, e.g. "Charlotte Motor Speedway - Oval"
  venue: string           // venue name only, e.g. "Charlotte Motor Speedway"
  config: string | null   // config name or null, e.g. "Oval"
  raceLength: string
  referenceSession: string
  notes: string
  weekCars?: string[]     // present for series with rotating cars (e.g. Draft Master Challenge);
                          // if present, overrides series.cars for that week
}

interface IracingTrack {
  venue: string
  config: string | null
}
```

### DB schema

**Existing tables** (already in `lib/db/schema.ts`):
- `userOwnedTracks(userId, trackId: integer)` — uses iRacing API numeric track IDs, **incompatible with the new JSON dataset** which has only venue/config strings
- `userSelectedSeries(userId, seriesId: integer, season)` — same issue, API numeric IDs

**New tables** to add:
```ts
// Tracks identified by composite key: "venue|config" (config may be null → "venue|")
export const userOwnedTrackKeys = sqliteTable(
  'user_owned_track_keys',
  {
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    trackKey: text('track_key').notNull(), // e.g. "Charlotte Motor Speedway|Oval"
  },
  (t) => [primaryKey({ columns: [t.userId, t.trackKey] })]
)

// Series identified by seriesName string from JSON
export const userSelectedSeriesKeys = sqliteTable(
  'user_selected_series_keys',
  {
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    seriesName: text('series_name').notNull(),
    season: text('season').notNull(), // hardcoded to '2026-2' for this dataset
  },
  (t) => [primaryKey({ columns: [t.userId, t.seriesName, t.season] })]
)

// Cars identified by car name string from JSON
export const userOwnedCars = sqliteTable(
  'user_owned_cars',
  {
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    carName: text('car_name').notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.carName] })]
)

// User profile (name + license class)
export const userProfile = sqliteTable('user_profile', {
  userId: text('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull().default(''),
  licenseClass: text('license_class').notNull().default('Rookie'),
})
```

The old `userOwnedTracks` and `userSelectedSeries` tables remain untouched (no migration needed — new tables are additive).

Run `pnpm db:push` after schema update.

### Deliverable
- Nav shows Setup, Dashboard, Settings only
- `season-data.ts` exports typed accessors
- New DB tables (`userOwnedTrackKeys`, `userSelectedSeriesKeys`, `userOwnedCars`, `userProfile`) exist in DB

---

## Sub-spec 2: Enhanced Wizard

### Goal
Extend the existing 1-step wizard (series selection) to a 4-step flow: Profile → Series → Tracks → Cars.

### Step 1 — Profile

Fields:
- **Namn** — text input, free text (iRacing display name)
- **Licensklass** — select: `Rookie | D | C | B | A | Pro | WC`

Persisted to:
- `localStorage` key: `planner-profile-v1` as `{ name: string, licenseClass: string }`
- DB: `userProfile` table (see sub-spec 1 schema)

Saved on "Nästa" button press (not on field change).

### Step 2 — Serier

Existing `SeriesSetup` component. Refactor data source from API to `getAllSeries()` from `season-data.ts`. Category and class filters remain unchanged.

### Step 3 — Banor

Derive unique tracks from selected series using `getTracksForSeries(selectedSeriesIds)`.

UI: searchable checkbox list. Each row shows venue name + config badge. Checked = owned. Pre-check tracks already in `userOwnedTrackKeys` (key format: `"venue|config"`, config is empty string if null).

On "Nästa": delete existing rows for this user in `userOwnedTrackKeys`, insert checked tracks (upsert).

### Step 4 — Bilar

Derive cars from selected series using `getCarsForSeries(selectedSeriesIds)`.

UI: searchable checkbox list. Each row shows car name. Checked = owned. Pre-check cars already in `userOwnedCars`.

On "Klar": delete existing rows for this user in `userOwnedCars`, insert checked cars (upsert), redirect to `/dashboard`.

### Wizard shell

- Step indicator in header: 4 numbered steps, active/completed states
- Back / Next buttons in footer
- State lives in React state (`useState`) during the wizard session — a single `WizardState` object:
  ```ts
  interface WizardState {
    step: 1 | 2 | 3 | 4
    profile: { name: string; licenseClass: string }
    selectedSeriesNames: string[]
    ownedTrackKeys: string[]      // "venue|config"
    ownedCarNames: string[]
  }
  ```
- On each "Next"/"Klar" button press, persist that step's data to localStorage + DB (not on field change)
- Back navigation: returns to previous step using in-memory state only — no re-load from DB. Edits made in a step are retained in memory until Back navigates past that step without saving.

### Routing
`/setup` renders the 4-step wizard. No step-specific URLs (all state in component).

### Deliverable
- `/setup` has 4 working steps
- Profile, track ownership, car ownership all persist correctly
- Wizard redirects to `/dashboard` on completion

---

## Sub-spec 3: Dashboard Hub

### Goal
Replace the current `/dashboard` with a widget hub. Existing views (matrix, costs, series schedule) become embedded or expandable widgets.

### Layout

```
┌─────────────────┬──────────────────┐
│  Profil-widget  │  Kostnad-widget  │
├─────────────────┴──────────────────┤
│  Matris-widget (full-width)        │
├────────────────────────────────────┤
│  Serieschema-widget (expanderbar)  │
└────────────────────────────────────┘
```

2-column grid on ≥ 1024px, 1-column on smaller screens.

### Profil-widget (summary card)

Displays: namn, licensklass, antal valda serier.
CTA: "Redigera setup" → `/setup` (wizard step 1).

### Kostnad-widget (summary card + expandable)

Collapsed: total cost (USD), count of missing tracks, count of missing cars.
Expanded: `components/dashboard/cost-table.tsx` rendered inline.
Expand/collapse toggle on the card.

`CostTable` expects `{ recommendations: PurchaseRecommendation[], costSummary: CostSummary }`. The existing `PurchaseRecommendation` type has `track: Track` where `Track` is the iRacing API shape (numeric `track_id`, `price`, etc.) — incompatible with the JSON data. Sub-spec 3 introduces new types in `lib/analysis/types.ts`:

```ts
// New types added alongside existing PurchaseRecommendation — old type is kept as-is for
// the existing /dashboard/costs page. CostTable is overloaded to accept either type.
interface ContentItem {
  name: string       // venue+config string for tracks, car name for cars
  type: 'track' | 'car'
  price: number      // USD from price map
  seriesCount: number // how many selected series need this item
}

interface ContentPurchaseRecommendation {
  item: ContentItem
  score: number
  cumulativeCost: number
}
```

Adapt `CostTable` to accept `ContentPurchaseRecommendation[]` via a prop union — the existing `/dashboard/costs` page continues using the old `PurchaseRecommendation[]` prop unchanged.

**Price maps:**
- Tracks: **New file `lib/iracing/track-prices.ts`** — `Record<string, number>` keyed by `"venue|config"` (same format as `trackKey`)
- Cars: **New file `lib/iracing/car-prices.ts`** — `Record<string, number>` keyed by car name string

Both files contain static USD prices populated from iRacing store data (out of scope for auto-population — prices must be added manually or via a separate data task).

Compute cost widget data server-side in `app/(app)/dashboard/page.tsx`: load selected series, owned track keys, owned car names from DB → derive missing items → look up prices → build `ContentPurchaseRecommendation[]` and `CostSummary`.

### Matris-widget (fully embedded)

Existing `DashboardContent` / `Matrix` rendered directly in the dashboard grid. No expand — always visible.

### Serieschema-widget (expandable)

Collapsed: number of selected series + next race week start date (earliest `startDate` across all weeks of selected series that is ≥ today).

Expanded: `SeasonScheduleBrowser` (`components/season-schedule-browser.tsx`) rendered inline.

`SeasonScheduleBrowser` expects `data: SeasonScheduleData` (type defined in `lib/season-schedules/types.ts`). The new data source is the JSON file, not the old API response. Create an adapter function in `lib/iracing/season-data.ts`:

```ts
export function toSeasonScheduleData(series: IracingSeries[]): SeasonScheduleData
```

This adapter maps `IracingSeries[]` → `SeasonScheduleData` (field mapping defined in Sub-spec 1 data layer section). Pass user's selected series (filtered from JSON by `userSelectedSeriesKeys`) to the widget.

### Routing

`/dashboard` — rewrite `app/(app)/dashboard/page.tsx` to render the hub. The old dashboard content (Matrix) becomes the Matris-widget inside it.

`/dashboard/costs` and `/series` — **keep the existing route files as-is** (no deletion, no redirect). They remain fully functional pages; they are simply no longer linked from the nav. The cost widget's expand panel replaces the primary cost view for most users, but `/dashboard/costs` stays accessible via direct URL.

The `navShouldCarrySeries` set in `app-shell.tsx` can be removed or emptied since series-carrying nav links are gone.

### Deliverable
- `/dashboard` shows 4 widgets
- Profil-widget reflects wizard data
- Kostnad-widget calculates from owned tracks + owned cars
- Matris and Serieschema embedded and functional

---

## Data flow summary

```
season-2026-s2.json
       │
       ▼
season-data.ts (typed accessors)
       │
       ├─► Wizard Step 2 (series list)
       ├─► Wizard Step 3 (track list derived from selected series)
       ├─► Wizard Step 4 (car list derived from selected series)
       │
       ▼
DB: userSelectedSeries, userOwnedTracks, userOwnedCars, userProfile
       │
       ▼
Dashboard widgets (read from DB on server render)
```

## Out of scope

- Live iRacing API integration for profile data (manual input only)
- Car pricing — use a static price map (same pattern as tracks)
- Multi-season support (single season from JSON)
- Mobile-optimized layout (responsive but not native-mobile)
