# Sub-spec 2: Enhanced Wizard — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend `/setup` from a single series-selection step to a 4-step wizard: Profile → Series → Tracks → Cars, with each step persisting to localStorage and DB.

**Architecture:** A new `WizardShell` client component wraps the existing `SeriesSetup` component (step 2) alongside three new step components. All wizard state lives in a single `WizardState` object in React `useState`. The `setup/page.tsx` switches from the markdown-based data loader to `getAllSeries()` + `toSeasonScheduleData()` from `season-data.ts`. Each Next/Klar button press persists that step's data via server actions from Sub-spec 1.

**Tech Stack:** Next.js 16, React 19, TypeScript strict, Drizzle ORM + Turso, `pnpm lint` = `tsc --noEmit`

**Prerequisite:** Sub-spec 1 must be complete (`season-data.ts` exports, DB tables and server actions exist).

---

## Chunk 1: Wizard Shell + Profile Step

### File map
- Create: `components/wizard/wizard-shell.tsx` — 4-step state machine, renders active step
- Create: `components/wizard/profile-step.tsx` — name input + license class select
- Modify: `app/(app)/setup/page.tsx` — switch data source to JSON

---

### Task 1: Create `components/wizard/wizard-shell.tsx`

This is the main client component that owns all wizard state and renders the correct step.

**Files:**
- Create: `components/wizard/wizard-shell.tsx`

- [ ] **Step 1: Create the file**

```tsx
'use client'

import { useState, useTransition } from 'react'
import type { SeasonScheduleData } from '@/lib/season-schedules/types'
import { useRouter } from 'next/navigation'
import {
  saveUserProfile,
  saveSelectedSeriesNames,
  saveOwnedTrackKeys,
  saveOwnedCarNames,
} from '@/lib/db/actions'
import { ProfileStep } from './profile-step'
import { SeriesSetup } from './series-setup'
import { TracksStep } from './tracks-step'
import { CarsStep } from './cars-step'
import type { IracingTrack } from '@/lib/iracing/types'

export interface WizardState {
  step: 1 | 2 | 3 | 4
  profile: { name: string; licenseClass: string }
  selectedSeriesNames: string[]
  ownedTrackKeys: string[]
  ownedCarNames: string[]
}

const SEASON = '2026-2'
const STORAGE_KEY = 'planner-wizard-state-v1'

function loadFromStorage(): Partial<WizardState> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveToStorage(state: WizardState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {}
}

interface WizardShellProps {
  userId: string
  /** Full SeasonScheduleData built from JSON for the SeriesSetup component */
  seriesData: SeasonScheduleData
  /** All unique tracks across all series (for the Tracks step) */
  allTracks: IracingTrack[]
  /** All cars across all series (for the Cars step) */
  allCars: string[]
  /** Pre-loaded from DB: previously selected series names */
  initialSeriesNames: string[]
  /** Pre-loaded from DB: previously owned track keys */
  initialTrackKeys: string[]
  /** Pre-loaded from DB: previously owned car names */
  initialCarNames: string[]
  /** Pre-loaded from DB: user profile */
  initialProfile: { name: string; licenseClass: string }
}

export function WizardShell({
  userId,
  seriesData,
  allTracks,
  allCars,
  initialSeriesNames,
  initialTrackKeys,
  initialCarNames,
  initialProfile,
}: WizardShellProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const stored = loadFromStorage()

  const [state, setState] = useState<WizardState>({
    step: 1,
    profile: stored.profile ?? initialProfile,
    selectedSeriesNames: stored.selectedSeriesNames ?? initialSeriesNames,
    ownedTrackKeys: stored.ownedTrackKeys ?? initialTrackKeys,
    ownedCarNames: stored.ownedCarNames ?? initialCarNames,
  })

  function updateState(patch: Partial<WizardState>) {
    setState((prev) => {
      const next = { ...prev, ...patch }
      saveToStorage(next)
      return next
    })
  }

  // ── Step handlers ──────────────────────────────────────────────────────────

  function handleProfileNext(profile: { name: string; licenseClass: string }) {
    updateState({ profile, step: 2 })
    startTransition(async () => {
      await saveUserProfile(userId, profile.name, profile.licenseClass)
    })
  }

  function handleSeriesNext(selectedSeriesNames: string[]) {
    updateState({ selectedSeriesNames, step: 3 })
    startTransition(async () => {
      await saveSelectedSeriesNames(userId, SEASON, selectedSeriesNames)
    })
  }

  function handleTracksNext(ownedTrackKeys: string[]) {
    updateState({ ownedTrackKeys, step: 4 })
    startTransition(async () => {
      await saveOwnedTrackKeys(userId, ownedTrackKeys)
    })
  }

  function handleCarsDone(ownedCarNames: string[]) {
    updateState({ ownedCarNames })
    startTransition(async () => {
      await saveOwnedCarNames(userId, ownedCarNames)
      router.push('/dashboard')
    })
  }

  function goBack() {
    setState((prev) => ({
      ...prev,
      step: Math.max(1, prev.step - 1) as WizardState['step'],
    }))
  }

  // ── Step indicator ─────────────────────────────────────────────────────────

  const steps = ['Profil', 'Serier', 'Banor', 'Bilar']

  return (
    <div className="flex flex-col gap-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {steps.map((label, i) => {
          const stepNum = (i + 1) as WizardState['step']
          const isActive = state.step === stepNum
          const isDone = state.step > stepNum
          return (
            <div key={label} className="flex items-center gap-2">
              <div
                className={[
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-colors',
                  isActive
                    ? 'border-accent-cyan bg-accent-cyan/10 text-accent-cyan'
                    : isDone
                      ? 'border-accent-cyan/40 bg-transparent text-accent-cyan/60'
                      : 'border-white/20 bg-transparent text-white/30',
                ].join(' ')}
              >
                {isDone ? '✓' : stepNum}
              </div>
              <span
                className={[
                  'text-sm',
                  isActive ? 'text-white/90 font-medium' : 'text-white/30',
                ].join(' ')}
              >
                {label}
              </span>
              {i < steps.length - 1 && (
                <span className="mx-1 text-white/15">›</span>
              )}
            </div>
          )
        })}
      </div>

      {/* Active step */}
      {state.step === 1 && (
        <ProfileStep
          initialProfile={state.profile}
          onNext={handleProfileNext}
        />
      )}
      {state.step === 2 && (
        <div className="flex flex-col gap-4">
          <SeriesSetup
            data={seriesData}
            initialSelectedSeriesNames={state.selectedSeriesNames}
            onNext={handleSeriesNext}
          />
          <button
            type="button"
            onClick={goBack}
            className="self-start text-sm text-text-muted hover:text-text-primary transition-colors"
          >
            ← Tillbaka
          </button>
        </div>
      )}
      {state.step === 3 && (
        <TracksStep
          allTracks={allTracks}
          initialOwnedTrackKeys={state.ownedTrackKeys}
          onNext={handleTracksNext}
          onBack={goBack}
          isPending={isPending}
        />
      )}
      {state.step === 4 && (
        <CarsStep
          allCars={allCars}
          initialOwnedCarNames={state.ownedCarNames}
          onDone={handleCarsDone}
          onBack={goBack}
          isPending={isPending}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify compiles** (will show errors for missing step component imports — that's expected at this stage)

```bash
cd /home/thomas/repos/iracing-series-planner && pnpm lint 2>&1 | grep -v "Cannot find module.*profile-step\|tracks-step\|cars-step" | head -20
```

- [ ] **Step 3: Commit**

```bash
git add components/wizard/wizard-shell.tsx
git commit -m "feat: add WizardShell with 4-step state machine"
```

---

### Task 2: Create `components/wizard/profile-step.tsx`

**Files:**
- Create: `components/wizard/profile-step.tsx`

- [ ] **Step 1: Create the file**

```tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const LICENSE_CLASSES = ['Rookie', 'D', 'C', 'B', 'A', 'Pro', 'WC'] as const
type LicenseClass = (typeof LICENSE_CLASSES)[number]

interface ProfileStepProps {
  initialProfile: { name: string; licenseClass: string }
  onNext: (profile: { name: string; licenseClass: string }) => void
}

export function ProfileStep({ initialProfile, onNext }: ProfileStepProps) {
  const [name, setName] = useState(initialProfile.name)
  const [licenseClass, setLicenseClass] = useState<LicenseClass>(
    (initialProfile.licenseClass as LicenseClass) ?? 'Rookie'
  )

  function handleNext() {
    onNext({ name, licenseClass })
  }

  return (
    <div className="flex flex-col gap-6 max-w-md">
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-1">Din profil</h2>
        <p className="text-sm text-text-secondary">
          Ange ditt iRacing-namn och din nuvarande licensklass.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-secondary" htmlFor="profile-name">
            Namn
          </label>
          <Input
            id="profile-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ditt iRacing-namn"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            className="text-sm font-medium text-text-secondary"
            htmlFor="profile-license"
          >
            Licensklass
          </label>
          <select
            id="profile-license"
            value={licenseClass}
            onChange={(e) => setLicenseClass(e.target.value as LicenseClass)}
            className="h-10 rounded-md border border-border bg-bg-elevated px-3 text-sm text-text-primary focus:border-accent-cyan focus:outline-none focus:ring-1 focus:ring-accent-cyan/40 cursor-pointer"
          >
            {LICENSE_CLASSES.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Button onClick={handleNext} className="self-start">
        Nästa →
      </Button>
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
git add components/wizard/profile-step.tsx
git commit -m "feat: add ProfileStep component (name + license class)"
```

---

## Chunk 2: Tracks Step + Cars Step

### File map
- Create: `components/wizard/tracks-step.tsx` — searchable checkbox list of tracks
- Create: `components/wizard/cars-step.tsx` — searchable checkbox list of cars

---

### Task 3: Create `components/wizard/tracks-step.tsx`

**Files:**
- Create: `components/wizard/tracks-step.tsx`

- [ ] **Step 1: Create the file**

```tsx
'use client'

import { useState, useMemo } from 'react'
import type { IracingTrack } from '@/lib/iracing/types'
import { makeTrackKey } from '@/lib/iracing/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'

interface TracksStepProps {
  allTracks: IracingTrack[]
  initialOwnedTrackKeys: string[]
  onNext: (ownedTrackKeys: string[]) => void
  onBack: () => void
  isPending: boolean
}

function normalize(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function TracksStep({
  allTracks,
  initialOwnedTrackKeys,
  onNext,
  onBack,
  isPending,
}: TracksStepProps) {
  const [search, setSearch] = useState('')
  const [owned, setOwned] = useState<Set<string>>(new Set(initialOwnedTrackKeys))

  const filtered = useMemo(() => {
    if (!search.trim()) return allTracks
    const q = normalize(search)
    return allTracks.filter((t) => normalize(t.venue).includes(q))
  }, [allTracks, search])

  function toggle(track: IracingTrack) {
    const key = makeTrackKey(track.venue, track.config)
    setOwned((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function toggleAll() {
    const filteredKeys = filtered.map((t) => makeTrackKey(t.venue, t.config))
    const allChecked = filteredKeys.every((k) => owned.has(k))
    setOwned((prev) => {
      const next = new Set(prev)
      if (allChecked) {
        filteredKeys.forEach((k) => next.delete(k))
      } else {
        filteredKeys.forEach((k) => next.add(k))
      }
      return next
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-1">Dina banor</h2>
        <p className="text-sm text-text-secondary">
          Markera de banor du redan äger. Omarkerade banor räknas som köpbehov i
          kostnadskalkylerna.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Input
          type="text"
          placeholder="Sök bana..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <span className="text-xs text-text-muted">
          {owned.size} / {allTracks.length} ägda
        </span>
      </div>

      {/* Select all for filtered results */}
      {filtered.length > 0 && (
        <button
          type="button"
          onClick={toggleAll}
          className="self-start text-xs text-accent-cyan/70 hover:text-accent-cyan transition-colors"
        >
          {filtered.every((t) => owned.has(makeTrackKey(t.venue, t.config)))
            ? 'Avmarkera filtrerade'
            : 'Markera filtrerade'}
        </button>
      )}

      <div
        className="flex flex-col gap-1 overflow-y-auto rounded-md border border-border-subtle bg-bg-glass p-2"
        style={{ maxHeight: '50vh' }}
      >
        {filtered.length === 0 && (
          <p className="py-4 text-center text-sm text-text-muted">Inga banor hittades.</p>
        )}
        {filtered.map((track) => {
          const key = makeTrackKey(track.venue, track.config)
          const isOwned = owned.has(key)
          return (
            <div
              key={key}
              role="button"
              tabIndex={0}
              onClick={() => toggle(track)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  toggle(track)
                }
              }}
              className={[
                'flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
                isOwned
                  ? 'border border-[rgba(0,255,255,0.55)] bg-[rgba(0,255,255,0.08)]'
                  : 'border border-transparent hover:bg-white/[0.03]',
              ].join(' ')}
            >
              <Checkbox checked={isOwned} readOnly />
              <span className="flex-1 text-text-primary">{track.venue}</span>
              {track.config && (
                <Badge variant="default" className="text-xs">
                  {track.config}
                </Badge>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={() => onNext(Array.from(owned))} disabled={isPending}>
          {isPending ? 'Sparar...' : 'Nästa →'}
        </Button>
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-text-muted hover:text-text-primary transition-colors"
        >
          ← Tillbaka
        </button>
      </div>
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
git add components/wizard/tracks-step.tsx
git commit -m "feat: add TracksStep component with searchable checkbox list"
```

---

### Task 4: Create `components/wizard/cars-step.tsx`

**Files:**
- Create: `components/wizard/cars-step.tsx`

- [ ] **Step 1: Create the file**

```tsx
'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'

interface CarsStepProps {
  allCars: string[]
  initialOwnedCarNames: string[]
  onDone: (ownedCarNames: string[]) => void
  onBack: () => void
  isPending: boolean
}

function normalize(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function CarsStep({
  allCars,
  initialOwnedCarNames,
  onDone,
  onBack,
  isPending,
}: CarsStepProps) {
  const [search, setSearch] = useState('')
  const [owned, setOwned] = useState<Set<string>>(new Set(initialOwnedCarNames))

  const filtered = useMemo(() => {
    if (!search.trim()) return allCars
    const q = normalize(search)
    return allCars.filter((c) => normalize(c).includes(q))
  }, [allCars, search])

  function toggle(carName: string) {
    setOwned((prev) => {
      const next = new Set(prev)
      if (next.has(carName)) next.delete(carName)
      else next.add(carName)
      return next
    })
  }

  function toggleAll() {
    const allChecked = filtered.every((c) => owned.has(c))
    setOwned((prev) => {
      const next = new Set(prev)
      if (allChecked) {
        filtered.forEach((c) => next.delete(c))
      } else {
        filtered.forEach((c) => next.add(c))
      }
      return next
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-1">Dina bilar</h2>
        <p className="text-sm text-text-secondary">
          Markera de bilar du redan äger. Omarkerade bilar kan påverka kostnadskalkylerna.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Input
          type="text"
          placeholder="Sök bil..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <span className="text-xs text-text-muted">
          {owned.size} / {allCars.length} ägda
        </span>
      </div>

      {filtered.length > 0 && (
        <button
          type="button"
          onClick={toggleAll}
          className="self-start text-xs text-accent-cyan/70 hover:text-accent-cyan transition-colors"
        >
          {filtered.every((c) => owned.has(c))
            ? 'Avmarkera filtrerade'
            : 'Markera filtrerade'}
        </button>
      )}

      <div
        className="flex flex-col gap-1 overflow-y-auto rounded-md border border-border-subtle bg-bg-glass p-2"
        style={{ maxHeight: '50vh' }}
      >
        {filtered.length === 0 && (
          <p className="py-4 text-center text-sm text-text-muted">Inga bilar hittades.</p>
        )}
        {filtered.map((carName) => {
          const isOwned = owned.has(carName)
          return (
            <div
              key={carName}
              role="button"
              tabIndex={0}
              onClick={() => toggle(carName)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  toggle(carName)
                }
              }}
              className={[
                'flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
                isOwned
                  ? 'border border-[rgba(0,255,255,0.55)] bg-[rgba(0,255,255,0.08)]'
                  : 'border border-transparent hover:bg-white/[0.03]',
              ].join(' ')}
            >
              <Checkbox checked={isOwned} readOnly />
              <span className="flex-1 text-text-primary">{carName}</span>
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={() => onDone(Array.from(owned))} disabled={isPending}>
          {isPending ? 'Sparar...' : 'Klar →'}
        </Button>
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-text-muted hover:text-text-primary transition-colors"
        >
          ← Tillbaka
        </button>
      </div>
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
git add components/wizard/cars-step.tsx
git commit -m "feat: add CarsStep component with searchable checkbox list"
```

---

## Chunk 3: SeriesSetup Adapter + Setup Page

### File map
- Modify: `components/wizard/series-setup.tsx` — add `initialSelectedSeriesNames` + `onNext` props so WizardShell can control it
- Modify: `app/(app)/setup/page.tsx` — switch to JSON data source, render WizardShell

---

### Task 5: Add wizard-compatible props to `SeriesSetup`

The existing `SeriesSetup` manages its own selection state via localStorage. In wizard mode, the parent (`WizardShell`) owns the state and needs a way to pre-seed selections and receive the final selection on Next.

**Files:**
- Modify: `components/wizard/series-setup.tsx`

- [ ] **Step 1: Add optional props to the `SeriesSetupProps` interface**

In `components/wizard/series-setup.tsx`, find the `SeriesSetupProps` interface and add two optional props:

```ts
interface SeriesSetupProps {
  data: SeasonScheduleData
  /** If provided, seeds initial selection and shows a "Nästa" button */
  initialSelectedSeriesNames?: string[]
  /** If provided, renders a "Nästa" button that calls this with selected series names */
  onNext?: (selectedSeriesNames: string[]) => void
}
```

- [ ] **Step 2: Wire `initialSelectedSeriesNames` into the component's state initializer**

Find the `useState` call for selected series IDs in `SeriesSetup`. The component currently uses `selectedSeriesIds: string[]` from localStorage (`storageKey = 'series-setup-state-v1'`). When `initialSelectedSeriesNames` is provided, it should override the localStorage value for the initial render:

Inside `SeriesSetup`, find the `useState` initialization that reads from `storageKey` and modify it so that if `initialSelectedSeriesNames` is provided (non-undefined), it overrides the stored `selectedSeriesIds`:

```ts
// Inside the useState initializer callback (look for the function that reads localStorage)
// Add at the top of that function:
if (props.initialSelectedSeriesNames !== undefined) {
  return {
    ...defaultState,
    selectedSeriesIds: props.initialSelectedSeriesNames,
  }
}
```

(The exact location depends on how the component currently initializes state — find the `useState(() => { ... })` call that reads `storageKey` and add this early return.)

- [ ] **Step 3: Add a "Nästa" button when `onNext` is provided**

Find the footer or bottom area of the `SeriesSetup` JSX (where existing save/summary buttons live). Add:

```tsx
{onNext && (
  <Button
    onClick={() => onNext(state.selectedSeriesIds)}
    className="mt-4"
  >
    Nästa →
  </Button>
)}
```

(Add this near any existing action buttons. The exact position depends on the JSX structure — place it in a visible bottom area.)

- [ ] **Step 4: Verify compiles**

```bash
cd /home/thomas/repos/iracing-series-planner && pnpm lint
```

- [ ] **Step 5: Commit**

```bash
git add components/wizard/series-setup.tsx
git commit -m "feat: add initialSelectedSeriesNames + onNext props to SeriesSetup for wizard integration"
```

---

### Task 6: Rewrite `app/(app)/setup/page.tsx`

**Files:**
- Modify: `app/(app)/setup/page.tsx`

- [ ] **Step 1: Rewrite the file**

```tsx
import { WizardShell } from '@/components/wizard/wizard-shell'
import { getAllSeries, getUniqueTracks, getAllCars, toSeasonScheduleData } from '@/lib/iracing/season-data'
import { getSession } from '@/lib/auth/session'
import {
  fetchSelectedSeriesNames,
  fetchOwnedTrackKeys,
  fetchOwnedCarNames,
  fetchUserProfile,
} from '@/lib/db/actions'
import { redirect } from 'next/navigation'

export default async function SetupPage() {
  const session = await getSession()
  if (!session) redirect('/')

  const allSeries = getAllSeries()
  const seriesData = toSeasonScheduleData(allSeries)
  const allTracks = getUniqueTracks()
  const allCars = getAllCars()

  const [selectedSeriesNames, ownedTrackKeys, ownedCarNames, profile] = await Promise.all([
    fetchSelectedSeriesNames(session.userId, '2026-2'),
    fetchOwnedTrackKeys(session.userId),
    fetchOwnedCarNames(session.userId),
    fetchUserProfile(session.userId),
  ])

  return (
    <WizardShell
      userId={session.userId}
      seriesData={seriesData}
      allTracks={allTracks}
      allCars={allCars}
      initialSeriesNames={selectedSeriesNames}
      initialTrackKeys={ownedTrackKeys}
      initialCarNames={ownedCarNames}
      initialProfile={profile ?? { name: '', licenseClass: 'Rookie' }}
    />
  )
}
```

- [ ] **Step 2: Verify compiles**

```bash
cd /home/thomas/repos/iracing-series-planner && pnpm lint
```

- [ ] **Step 3: Start dev server and manually test the wizard**

```bash
pnpm dev
```

Navigate to http://localhost:3000/setup. Verify:
1. Step indicator shows "Profil › Serier › Banor › Bilar"
2. Step 1 shows name input + license class select, "Nästa" button works
3. Step 2 shows the existing series list with category/class filters
4. Step 3 shows a searchable track list
5. Step 4 shows a searchable car list, "Klar" redirects to `/dashboard`
6. Back button on each step returns to previous step with state preserved

- [ ] **Step 4: Commit**

```bash
git add app/'(app)'/setup/page.tsx
git commit -m "feat: rewrite setup page to use WizardShell with JSON data source"
```

---

## Done

Sub-spec 2 is complete when:
- `pnpm lint` passes with 0 errors
- `/setup` renders a 4-step wizard
- Completing the wizard persists profile, series, tracks, cars to DB and redirects to `/dashboard`
- Back navigation preserves in-memory state

Proceed to: `docs/superpowers/plans/2026-03-17-subspec3-dashboard-hub.md`
