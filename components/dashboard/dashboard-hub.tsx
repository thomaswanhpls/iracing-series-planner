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
        className="grid flex-1 overflow-hidden"
        style={{
          gridTemplateColumns: '2fr 3fr',
          gridTemplateRows: '1fr 1fr',
          gap: '1px',
          background: 'var(--color-border-subtle)',
        }}
      >
        {/* Top-left: Cost */}
        <div className="min-h-0 overflow-hidden bg-bg-surface">
          <CostWidget summary={summary} seriesCosts={seriesCosts} />
        </div>
        {/* Top-right: My Series */}
        <div className="min-h-0 overflow-hidden bg-bg-surface">
          <MySeriesWidget
            selectedSeries={selectedSeries}
            ownedTrackKeys={ownedTrackKeys}
            currentWeekIndex={currentWeekIndex}
          />
        </div>
        {/* Bottom-left: Matrix */}
        <div className="min-h-0 overflow-hidden bg-bg-surface">
          <MatrixWidget
            selectedSeries={selectedSeries}
            ownedTrackKeys={ownedTrackKeys}
            currentWeekIndex={currentWeekIndex}
          />
        </div>
        {/* Bottom-right: Race Conditions */}
        <div className="min-h-0 overflow-hidden bg-bg-surface">
          <RaceConditionsWidget
            selectedSeries={selectedSeries}
            currentWeekIndex={currentWeekIndex}
          />
        </div>
      </div>
    </div>
  )
}
