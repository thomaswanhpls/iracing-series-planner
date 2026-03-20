'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import type { SeasonScheduleData } from '@/lib/season-schedules/types'
import { useRouter } from 'next/navigation'
import {
  saveUserProfile,
  saveSelectedSeriesNames,
  saveOwnedTrackKeys,
  saveOwnedCarNames,
} from '@/lib/db/actions'
import { ProfileStep, type ProfileData } from './profile-step'
import { SeriesSetup } from './series-setup'
import { TracksStep } from './tracks-step'
import { CarsStep } from './cars-step'
import type { IracingTrack } from '@/lib/iracing/types'
import { CURRENT_SEASON } from '@/lib/iracing/season-data'

export interface WizardState {
  step: 1 | 2 | 3 | 4
  profile: ProfileData
  selectedSeriesNames: string[]
  ownedTrackKeys: string[]
  ownedCarNames: string[]
}

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
  seriesData: SeasonScheduleData
  allTracks: IracingTrack[]
  allCars: string[]
  initialSeriesNames: string[]
  initialTrackKeys: string[]
  initialCarNames: string[]
  initialProfile: ProfileData
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
  const t = useTranslations('wizard')
  const router = useRouter()
  const [isProfilePending, startProfileTransition] = useTransition()
  const [isSeriesPending, startSeriesTransition] = useTransition()
  const [isTracksPending, startTracksTransition] = useTransition()
  const [isCarsPending, startCarsTransition] = useTransition()

  const [state, setState] = useState<WizardState>(() => {
    const stored = loadFromStorage()
    return {
      step: stored.step ?? 1,
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

  function handleProfileNext(profile: ProfileData) {
    updateState({ profile, step: 2 })
    startProfileTransition(async () => {
      await saveUserProfile(
        userId,
        profile.name,
        profile.licenseSportsCar,
        profile.licenseFormulaCar,
        profile.licenseOval,
        profile.licenseDirtRoad,
        profile.licenseDirtOval,
      )
    })
  }

  function handleTracksNext(ownedTrackKeys: string[]) {
    updateState({ ownedTrackKeys, step: 3 })
    startTracksTransition(async () => {
      await saveOwnedTrackKeys(userId, ownedTrackKeys)
    })
  }

  function handleCarsNext(ownedCarNames: string[]) {
    updateState({ ownedCarNames, step: 4 })
    startCarsTransition(async () => {
      await saveOwnedCarNames(userId, ownedCarNames)
    })
  }

  function handleSeriesDone(selectedSeriesNames: string[]) {
    updateState({ selectedSeriesNames })
    setSaveError(null)
    startSeriesTransition(async () => {
      try {
        await saveSelectedSeriesNames(userId, CURRENT_SEASON, selectedSeriesNames)
        router.push('/dashboard')
      } catch {
        setSaveError(t('saveError'))
      }
    })
  }

  function goBack() {
    setState((prev) => ({
      ...prev,
      step: Math.max(1, prev.step - 1) as WizardState['step'],
    }))
  }

  const steps = [t('steps.profile'), t('steps.tracks'), t('steps.cars'), t('steps.series')]

  return (
    <div className="flex flex-col gap-6 min-h-full">
      {/* Step indicator */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
        {steps.map((label, i) => {
          const stepNum = (i + 1) as WizardState['step']
          const isActive = state.step === stepNum
          const isDone = state.step > stepNum
          return (
            <div key={label} className="flex shrink-0 items-center gap-2">
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
        <TracksStep
          allTracks={allTracks}
          initialOwnedTrackKeys={state.ownedTrackKeys}
          onNext={handleTracksNext}
          onBack={goBack}
          isPending={isTracksPending}
        />
      )}
      {state.step === 3 && (
        <CarsStep
          allCars={allCars}
          initialOwnedCarNames={state.ownedCarNames}
          onNext={handleCarsNext}
          onBack={goBack}
          isPending={isCarsPending}
        />
      )}
      {state.step === 4 && (
        <div className="flex flex-col gap-2 flex-1">
          <SeriesSetup
            data={seriesData}
            initialSelectedSeriesNames={state.selectedSeriesNames}
            userLicenseClasses={{
              sportsCar: state.profile.licenseSportsCar,
              formulaCar: state.profile.licenseFormulaCar,
              oval: state.profile.licenseOval,
              dirtRoad: state.profile.licenseDirtRoad,
              dirtOval: state.profile.licenseDirtOval,
            }}
            onNext={handleSeriesDone}
            onBack={goBack}
          />
          {saveError && (
            <p className="text-sm text-red-400">{saveError}</p>
          )}
        </div>
      )}
    </div>
  )
}
