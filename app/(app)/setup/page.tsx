'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Category } from '@/lib/iracing/types'
import { getSeriesList } from '@/lib/iracing/data-provider'
import { StepIndicator } from '@/components/wizard/step-indicator'
import { SeasonSelector } from '@/components/wizard/season-selector'
import { CategoryFilter } from '@/components/wizard/category-filter'
import { SeriesSelector } from '@/components/wizard/series-selector'
import { Button } from '@/components/ui/button'

export default function Setup() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [season, setSeason] = useState('2026-1')
  const [categories, setCategories] = useState<Category[]>(['road'])
  const [selectedSeriesIds, setSelectedSeriesIds] = useState<number[]>([])

  const allSeries = getSeriesList()

  const toggleCategory = (cat: Category) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    )
  }

  const toggleSeries = (id: number) => {
    setSelectedSeriesIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1)
    } else {
      const params = new URLSearchParams()
      params.set('series', selectedSeriesIds.join(','))
      router.push(`/dashboard?${params.toString()}`)
    }
  }

  const handleBack = () => {
    if (step > 0) setStep(step - 1)
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h2 className="font-display text-xl font-bold mb-4">Season Setup</h2>
        <StepIndicator currentStep={step} />
      </div>

      <div className="min-h-[300px]">
        {step === 0 && (
          <SeasonSelector selectedSeason={season} onSelect={setSeason} />
        )}
        {step === 1 && (
          <CategoryFilter selected={categories} onToggle={toggleCategory} />
        )}
        {step === 2 && (
          <SeriesSelector
            series={allSeries}
            selectedCategories={categories}
            selectedSeriesIds={selectedSeriesIds}
            onToggleSeries={toggleSeries}
          />
        )}
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={handleBack} disabled={step === 0}>
          Tillbaka
        </Button>
        <Button
          onClick={handleNext}
          disabled={step === 2 && selectedSeriesIds.length === 0}
        >
          {step === 2 ? 'Visa Dashboard' : 'Nästa'}
        </Button>
      </div>
    </div>
  )
}
