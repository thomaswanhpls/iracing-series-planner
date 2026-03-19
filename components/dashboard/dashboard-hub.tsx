'use client'

import type { IracingSeries } from '@/lib/iracing/types'
import type { ContentCostSummary, ContentPurchaseRecommendation, MissingCarForSeries } from '@/lib/analysis/types'
import { ProfileStrip } from './profile-strip'
import { CostWidget } from './cost-widget'
import { MatrixWidget } from './matrix-widget'
import { MySeriesWidget } from './my-series-widget'
import { RaceConditionsWidget } from './race-conditions-widget'

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

// Shared widget panel styling — glass card matching the app's design system
const PANEL = [
  'relative min-h-0 overflow-hidden rounded-lg',
  'bg-bg-glass backdrop-blur-md',
  'border border-[rgba(0,232,224,0.1)]',
  // Subtle teal glow
  'shadow-[0_0_0_1px_rgba(0,232,224,0.04),inset_0_1px_0_rgba(0,232,224,0.07)]',
  // Teal shimmer on top edge
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
      <div
        className="grid flex-1 p-3 gap-[10px] grid-cols-1 overflow-y-auto md:grid-cols-3 md:overflow-hidden md:[grid-template-rows:2fr_1fr]"
      >
        {/* Top row: Cost · My Series · Race Conditions */}
        <div className={`min-h-[250px] md:min-h-0 ${PANEL}`}>
          <CostWidget summary={summary} recommendations={recommendations} missingCarBySeries={missingCarBySeries} />
        </div>
        <div className={`min-h-[250px] md:min-h-0 ${PANEL}`}>
          <MySeriesWidget
            selectedSeries={selectedSeries}
            ownedTrackKeys={ownedTrackKeys}
            currentWeekIndex={currentWeekIndex}
          />
        </div>
        <div className={`min-h-[250px] md:min-h-0 ${PANEL}`}>
          <RaceConditionsWidget
            selectedSeries={selectedSeries}
            currentWeekIndex={currentWeekIndex}
          />
        </div>
        {/* Bottom row: Matrix spanning full width on desktop */}
        <div className={`min-h-[250px] md:min-h-0 md:col-span-3 ${PANEL}`}>
          <MatrixWidget
            selectedSeries={selectedSeries}
            ownedTrackKeys={ownedTrackKeys}
            currentWeekIndex={currentWeekIndex}
          />
        </div>
      </div>
    </div>
  )
}
