'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { StepIndicator } from '@/components/wizard/step-indicator'
import { SeasonSelector } from '@/components/wizard/season-selector'
import { CategoryFilter } from '@/components/wizard/category-filter'
import { ClassFilter } from '@/components/wizard/class-filter'
import { SeriesSelector } from '@/components/wizard/series-selector'
import { Button } from '@/components/ui/button'
import type { SeasonScheduleData } from '@/lib/season-schedules/types'

interface SetupWizardProps {
  data: SeasonScheduleData
}

interface SeasonOption {
  value: string
  label: string
  description: string
}

const wizardSteps = ['Säsong', 'Kategorier', 'Klasser', 'Serier']
const defaultSeason = '2026-2'
const setupWizardStorageKey = 'setup-wizard-state-v1'

interface PersistedSetupState {
  step: number
  season: string
  selectedCategoryIds: string[]
  selectedClassNames: string[]
  selectedSeriesIds: string[]
}

function toCategoryLabelMap(data: SeasonScheduleData): Record<string, string> {
  return Object.fromEntries(data.categories.map((category) => [category.id, category.label]))
}

export function SetupWizard({ data }: SetupWizardProps) {
  const router = useRouter()
  const hydratedRef = useRef(false)
  const [step, setStep] = useState(0)
  const [season, setSeason] = useState(defaultSeason)
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    data.categories.map((category) => category.id)
  )
  const [selectedClassNames, setSelectedClassNames] = useState<string[]>([])
  const [selectedSeriesIds, setSelectedSeriesIds] = useState<string[]>([])

  const seasonOptions = useMemo<SeasonOption[]>(() => {
    const totalSeries = data.series.length
    return [
      {
        value: defaultSeason,
        label: '2026 Season 2',
        description: `${totalSeries} serier med veckoschema`,
      },
    ]
  }, [data.series.length])

  const categoryLabelMap = useMemo(() => toCategoryLabelMap(data), [data])

  const availableClasses = useMemo(() => {
    const unique = new Set<string>()
    for (const series of data.series) {
      unique.add(series.className)
    }
    return Array.from(unique).sort((a, b) => a.localeCompare(b))
  }, [data.series])
  const availableCategoryIds = useMemo(() => new Set(data.categories.map((entry) => entry.id)), [data.categories])
  const availableClassNames = useMemo(() => new Set(availableClasses), [availableClasses])
  const availableSeriesIds = useMemo(() => new Set(data.series.map((entry) => entry.id)), [data.series])

  const filteredSeries = useMemo(() => {
    return data.series.filter((series) => {
      if (selectedCategoryIds.length > 0 && !selectedCategoryIds.includes(series.categoryId)) return false
      if (selectedClassNames.length > 0 && !selectedClassNames.includes(series.className)) return false
      return true
    })
  }, [data.series, selectedCategoryIds, selectedClassNames])

  useEffect(() => {
    const storedSeason = localStorage.getItem('planner-season')
    if (!storedSeason) return
    const normalized = storedSeason.replace(' S', '-').toLowerCase()
    if (seasonOptions.some((option) => option.value === normalized)) {
      setSeason(normalized)
    }
  }, [seasonOptions])

  useEffect(() => {
    if (hydratedRef.current) return

    const rawState = localStorage.getItem(setupWizardStorageKey)
    if (!rawState) {
      hydratedRef.current = true
      return
    }

    try {
      const parsed = JSON.parse(rawState) as Partial<PersistedSetupState>
      if (typeof parsed.step === 'number') {
        setStep(Math.max(0, Math.min(wizardSteps.length - 1, parsed.step)))
      }
      if (
        typeof parsed.season === 'string' &&
        seasonOptions.some((option) => option.value === parsed.season)
      ) {
        setSeason(parsed.season)
      }
      if (Array.isArray(parsed.selectedCategoryIds)) {
        setSelectedCategoryIds(
          parsed.selectedCategoryIds.filter(
            (entry): entry is string => typeof entry === 'string' && availableCategoryIds.has(entry)
          )
        )
      }
      if (Array.isArray(parsed.selectedClassNames)) {
        setSelectedClassNames(
          parsed.selectedClassNames.filter(
            (entry): entry is string => typeof entry === 'string' && availableClassNames.has(entry)
          )
        )
      }
      if (Array.isArray(parsed.selectedSeriesIds)) {
        setSelectedSeriesIds(
          parsed.selectedSeriesIds.filter(
            (entry): entry is string => typeof entry === 'string' && availableSeriesIds.has(entry)
          )
        )
      }
    } catch {
      localStorage.removeItem(setupWizardStorageKey)
    } finally {
      hydratedRef.current = true
    }
  }, [availableCategoryIds, availableClassNames, availableSeriesIds, seasonOptions])

  useEffect(() => {
    if (!hydratedRef.current) return
    const snapshot: PersistedSetupState = {
      step,
      season,
      selectedCategoryIds,
      selectedClassNames,
      selectedSeriesIds,
    }
    localStorage.setItem(setupWizardStorageKey, JSON.stringify(snapshot))
  }, [season, selectedCategoryIds, selectedClassNames, selectedSeriesIds, step])

  useEffect(() => {
    setSelectedCategoryIds((previous) => previous.filter((entry) => availableCategoryIds.has(entry)))
  }, [availableCategoryIds])

  useEffect(() => {
    setSelectedClassNames((previous) => previous.filter((entry) => availableClassNames.has(entry)))
  }, [availableClassNames])

  useEffect(() => {
    setSelectedSeriesIds((previous) => previous.filter((entry) => availableSeriesIds.has(entry)))
  }, [availableSeriesIds])

  const toggleCategory = (categoryId: string) => {
    setSelectedCategoryIds((previous) =>
      previous.includes(categoryId)
        ? previous.filter((entry) => entry !== categoryId)
        : [...previous, categoryId]
    )
  }

  const toggleClass = (className: string) => {
    setSelectedClassNames((previous) =>
      previous.includes(className)
        ? previous.filter((entry) => entry !== className)
        : [...previous, className]
    )
  }

  const toggleSeries = (seriesId: string) => {
    setSelectedSeriesIds((previous) =>
      previous.includes(seriesId)
        ? previous.filter((entry) => entry !== seriesId)
        : [...previous, seriesId]
    )
  }

  const selectManySeries = (seriesIds: string[]) => {
    setSelectedSeriesIds((previous) => Array.from(new Set([...previous, ...seriesIds])))
  }

  const clearManySeries = (seriesIds: string[]) => {
    const idsToClear = new Set(seriesIds)
    setSelectedSeriesIds((previous) => previous.filter((entry) => !idsToClear.has(entry)))
  }

  const clearAllSeries = () => {
    setSelectedSeriesIds([])
  }

  const handleNext = () => {
    if (step < wizardSteps.length - 1) {
      setStep((previous) => previous + 1)
      return
    }

    const params = new URLSearchParams()
    params.set('season', season)
    if (selectedCategoryIds.length > 0) params.set('categories', selectedCategoryIds.join(','))
    if (selectedClassNames.length > 0) params.set('classes', selectedClassNames.join(','))
    if (selectedSeriesIds.length > 0) params.set('series', selectedSeriesIds.join(','))
    router.push(`/tracks?${params.toString()}`)
  }

  const handleBack = () => {
    if (step > 0) setStep((previous) => previous - 1)
  }

  const handleResetWizard = () => {
    setStep(0)
    setSeason(defaultSeason)
    setSelectedCategoryIds(data.categories.map((category) => category.id))
    setSelectedClassNames([])
    setSelectedSeriesIds([])
    localStorage.removeItem(setupWizardStorageKey)
  }

  const seriesSelectionMissing = step === wizardSteps.length - 1 && selectedSeriesIds.length === 0
  const matchingSeriesCount = filteredSeries.length
  const activeCategoryLabels = selectedCategoryIds.map((id) => categoryLabelMap[id] ?? id)
  const summaryClassLabels = selectedClassNames.slice(0, 3)

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h2 className="mb-2 font-display text-xl font-bold">Setup Wizard</h2>
        <p className="text-sm text-text-secondary">
          Välj verkliga serier från 2026 Season 2. Nästa steg är att markera vilka banor du äger.
        </p>
      </div>

      <StepIndicator currentStep={step} steps={wizardSteps} />

      <div className="rounded-xl border border-border bg-bg-surface/40 p-4">
        <div className="grid gap-3 text-sm md:grid-cols-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-text-muted">Säsong</div>
            <div className="mt-1 font-display font-semibold text-text-primary">
              {season.replace('-', ' S').toUpperCase()}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-text-muted">Kategorier</div>
            <div className="mt-1 font-display font-semibold text-text-primary">
              {selectedCategoryIds.length}
            </div>
            <div className="mt-1 line-clamp-1 text-xs text-text-muted">
              {activeCategoryLabels.join(', ') || 'Alla'}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-text-muted">Klasser</div>
            <div className="mt-1 font-display font-semibold text-text-primary">
              {selectedClassNames.length || 'Alla'}
            </div>
            {selectedClassNames.length > 0 && (
              <div className="mt-1 line-clamp-1 text-xs text-text-muted">
                {summaryClassLabels.join(', ')}
                {selectedClassNames.length > 3 ? '…' : ''}
              </div>
            )}
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-text-muted">Serier</div>
            <div className="mt-1 font-display font-semibold text-text-primary">
              {selectedSeriesIds.length} valda
            </div>
            <div className="mt-1 text-xs text-text-muted">{matchingSeriesCount} matchar filter</div>
          </div>
        </div>
      </div>

      <div className="min-h-[420px]">
        {step === 0 && (
          <SeasonSelector
            selectedSeason={season}
            onSelect={(value) => {
              setSeason(value)
              localStorage.setItem('planner-season', value.replace('-', ' S').toUpperCase())
            }}
            seasons={seasonOptions}
          />
        )}
        {step === 1 && (
          <CategoryFilter
            selected={selectedCategoryIds}
            onToggle={toggleCategory}
            options={data.categories.map((category) => ({
              value: category.id,
              label: category.label,
            }))}
          />
        )}
        {step === 2 && (
          <ClassFilter
            classes={availableClasses}
            selected={selectedClassNames}
            onToggle={toggleClass}
          />
        )}
        {step === 3 && (
          <SeriesSelector
            series={filteredSeries}
            selectedSeriesIds={selectedSeriesIds}
            onToggleSeries={toggleSeries}
            onSelectMany={selectManySeries}
            onClearMany={clearManySeries}
            onClearAll={clearAllSeries}
            categoryLabelMap={categoryLabelMap}
          />
        )}
      </div>

      <div className="flex justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={handleBack} disabled={step === 0}>
            Tillbaka
          </Button>
          <Button variant="ghost" onClick={handleResetWizard}>
            Återställ wizard
          </Button>
        </div>
        <Button onClick={handleNext} disabled={seriesSelectionMissing}>
          {step === wizardSteps.length - 1 ? 'Fortsätt till Banor' : 'Nästa'}
        </Button>
      </div>
    </div>
  )
}
