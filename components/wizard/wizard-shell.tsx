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
  const [isProfilePending, startProfileTransition] = useTransition()
  const [isSeriesPending, startSeriesTransition] = useTransition()
  const [isTracksPending, startTracksTransition] = useTransition()
  const [isCarsPending, startCarsTransition] = useTransition()

  const [state, setState] = useState<WizardState>(() => {
    const stored = loadFromStorage()
    return {
      step: 1,
      profile: stored.profile ?? initialProfile,
      selectedSeriesNames: stored.selectedSeriesNames ?? initialSeriesNames,
      ownedTrackKeys: stored.ownedTrackKeys ?? initialTrackKeys,
      ownedCarNames: stored.ownedCarNames ?? initialCarNames,
    }
  })
  const [saveError, setSaveError] = useState<string | null>(null)

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
    startProfileTransition(async () => {
      await saveUserProfile(userId, profile.name, profile.licenseClass)
    })
  }

  function handleSeriesNext(selectedSeriesNames: string[]) {
    updateState({ selectedSeriesNames, step: 3 })
    startSeriesTransition(async () => {
      await saveSelectedSeriesNames(userId, SEASON, selectedSeriesNames)
    })
  }

  function handleTracksNext(ownedTrackKeys: string[]) {
    updateState({ ownedTrackKeys, step: 4 })
    startTracksTransition(async () => {
      await saveOwnedTrackKeys(userId, ownedTrackKeys)
    })
  }

  function handleCarsDone(ownedCarNames: string[]) {
    updateState({ ownedCarNames })
    setSaveError(null)
    startCarsTransition(async () => {
      try {
        await saveOwnedCarNames(userId, ownedCarNames)
        router.push('/dashboard')
      } catch {
        setSaveError('Något gick fel. Försök igen.')
      }
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
          isPending={isTracksPending}
        />
      )}
      {state.step === 4 && (
        <div className="flex flex-col gap-2">
          <CarsStep
            allCars={allCars}
            initialOwnedCarNames={state.ownedCarNames}
            onDone={handleCarsDone}
            onBack={goBack}
            isPending={isCarsPending}
          />
          {saveError && (
            <p className="text-sm text-red-400">{saveError}</p>
          )}
        </div>
      )}
    </div>
  )
}
