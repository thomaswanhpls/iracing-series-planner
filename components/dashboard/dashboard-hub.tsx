'use client'

import { useState } from 'react'
import type { IracingSeries } from '@/lib/iracing/types'
import type { ContentCostSummary, ContentPurchaseRecommendation, MissingCarForSeries } from '@/lib/analysis/types'
import { ProfileStrip } from './profile-strip'
import { CostWidget } from './cost-widget'
import { MatrixWidget } from './matrix-widget'
import { MySeriesWidget } from './my-series-widget'
import { RaceConditionsWidget } from './race-conditions-widget'

type FocusState =
  | { kind: 'track'; key: string }
  | { kind: 'series'; name: string }
  | null

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
  recommendations: ContentPurchaseRecommendation[]
  missingCarBySeries: MissingCarForSeries[]
  // Shared series data
  selectedSeries: IracingSeries[]
  ownedTrackKeys: string[]
  currentWeekIndex: number
}

// Desktop panel: fixed-height grid cell, widget scrolls internally
const PANEL_DESKTOP = [
  'relative min-h-0 overflow-hidden rounded-lg',
  'bg-bg-glass backdrop-blur-md',
  'border border-[rgba(0,232,224,0.1)]',
  'shadow-[0_0_0_1px_rgba(0,232,224,0.04),inset_0_1px_0_rgba(0,232,224,0.07)]',
  'before:absolute before:top-0 before:inset-x-0 before:h-px before:content-[""]',
  'before:bg-[linear-gradient(90deg,transparent_0%,rgba(0,232,224,0.3)_50%,transparent_100%)]',
].join(' ')

// Mobile panel: auto height, no overflow clip so widget can grow freely
const PANEL_MOBILE = [
  'relative rounded-lg overflow-visible',
  'bg-bg-glass backdrop-blur-md',
  'border border-[rgba(0,232,224,0.1)]',
  'shadow-[0_0_0_1px_rgba(0,232,224,0.04),inset_0_1px_0_rgba(0,232,224,0.07)]',
  'before:absolute before:top-0 before:inset-x-0 before:h-px before:content-[""]',
  'before:bg-[linear-gradient(90deg,transparent_0%,rgba(0,232,224,0.3)_50%,transparent_100%)]',
].join(' ')

export function DashboardHub({
  name,
  licenseSportsCar,
  licenseFormulaCar,
  licenseOval,
  licenseDirtRoad,
  licenseDirtOval,
  seasonLabel,
  summary,
  recommendations,
  missingCarBySeries,
  selectedSeries,
  ownedTrackKeys,
  currentWeekIndex,
}: DashboardHubProps) {
  const [focus, setFocus] = useState<FocusState>(null)

  function handleFocusTrack(key: string) {
    setFocus((prev) => prev?.kind === 'track' && prev.key === key ? null : { kind: 'track', key })
  }
  function handleFocusSeries(name: string) {
    setFocus((prev) => prev?.kind === 'series' && prev.name === name ? null : { kind: 'series', name })
  }

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

      {/* ── Mobile layout: simple scrollable column, widgets expand to content height ── */}
      <div className="flex flex-1 flex-col gap-[10px] overflow-y-auto p-3 md:hidden">
        <div className={PANEL_MOBILE}>
          <CostWidget summary={summary} recommendations={recommendations} missingCarBySeries={missingCarBySeries} focus={focus} onFocusTrack={handleFocusTrack} onFocusSeries={handleFocusSeries} />
        </div>
        <div className={PANEL_MOBILE}>
          <MySeriesWidget selectedSeries={selectedSeries} ownedTrackKeys={ownedTrackKeys} currentWeekIndex={currentWeekIndex} focus={focus} onFocusSeries={handleFocusSeries} />
        </div>
        <div className={PANEL_MOBILE}>
          <RaceConditionsWidget selectedSeries={selectedSeries} currentWeekIndex={currentWeekIndex} focus={focus} onFocusSeries={handleFocusSeries} />
        </div>
        <div className={PANEL_MOBILE}>
          <MatrixWidget selectedSeries={selectedSeries} ownedTrackKeys={ownedTrackKeys} currentWeekIndex={currentWeekIndex} focus={focus} onFocusSeries={handleFocusSeries} onFocusTrack={handleFocusTrack} />
        </div>
      </div>

      {/* ── Desktop layout: fixed 3-col grid, widgets scroll internally ── */}
      <div className="hidden md:grid md:flex-1 md:grid-cols-3 md:overflow-hidden md:p-3 md:gap-[10px] md:[grid-template-rows:2fr_1fr]">
        <div className={PANEL_DESKTOP}>
          <CostWidget summary={summary} recommendations={recommendations} missingCarBySeries={missingCarBySeries} focus={focus} onFocusTrack={handleFocusTrack} onFocusSeries={handleFocusSeries} />
        </div>
        <div className={PANEL_DESKTOP}>
          <MySeriesWidget selectedSeries={selectedSeries} ownedTrackKeys={ownedTrackKeys} currentWeekIndex={currentWeekIndex} focus={focus} onFocusSeries={handleFocusSeries} />
        </div>
        <div className={PANEL_DESKTOP}>
          <RaceConditionsWidget selectedSeries={selectedSeries} currentWeekIndex={currentWeekIndex} focus={focus} onFocusSeries={handleFocusSeries} />
        </div>
        <div className={`col-span-3 ${PANEL_DESKTOP}`}>
          <MatrixWidget selectedSeries={selectedSeries} ownedTrackKeys={ownedTrackKeys} currentWeekIndex={currentWeekIndex} focus={focus} onFocusSeries={handleFocusSeries} onFocusTrack={handleFocusTrack} />
        </div>
      </div>
    </div>
  )
}
