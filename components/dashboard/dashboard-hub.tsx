'use client'

import type { IracingSeries } from '@/lib/iracing/types'
import type { ContentCostSummary } from '@/lib/analysis/types'
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
  seriesCosts: Record<string, number>  // Map is not JSON-serializable across server→client
  // Shared series data
  selectedSeries: IracingSeries[]
  ownedTrackKeys: string[]
  currentWeekIndex: number
}

// Shared widget panel styling — glass card matching the app's design system
const PANEL = [
  'relative min-h-0 overflow-hidden rounded-lg',
  'bg-bg-glass backdrop-blur-md',
  'border border-[rgba(0,255,255,0.1)]',
  // Subtle neon glow
  'shadow-[0_0_0_1px_rgba(0,255,255,0.04),inset_0_1px_0_rgba(0,255,255,0.07)]',
  // Cyan shimmer on top edge (always-on, dimmer than hover state)
  'before:absolute before:top-0 before:inset-x-0 before:h-px before:content-[""]',
  'before:bg-[linear-gradient(90deg,transparent_0%,rgba(0,255,255,0.3)_50%,transparent_100%)]',
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
  seriesCosts,
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
        className="grid flex-1 overflow-hidden p-3"
        style={{
          gridTemplateColumns: '1fr 1fr 1fr',
          gridTemplateRows: '2fr 1fr',
          gap: '10px',
        }}
      >
        {/* Top row: Cost · My Series · Race Conditions */}
        <div className={PANEL}>
          <CostWidget summary={summary} seriesCosts={seriesCosts} />
        </div>
        <div className={PANEL}>
          <MySeriesWidget
            selectedSeries={selectedSeries}
            ownedTrackKeys={ownedTrackKeys}
            currentWeekIndex={currentWeekIndex}
          />
        </div>
        <div className={PANEL}>
          <RaceConditionsWidget
            selectedSeries={selectedSeries}
            currentWeekIndex={currentWeekIndex}
          />
        </div>
        {/* Bottom row: Matrix spanning full width */}
        <div className={`col-span-3 ${PANEL}`}>
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
