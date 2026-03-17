import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import {
  fetchSelectedSeriesNames,
  fetchOwnedTrackKeys,
  fetchOwnedCarNames,
  fetchUserProfile,
} from '@/lib/db/actions'
import { getAllSeries, toSeasonScheduleData, CURRENT_SEASON } from '@/lib/iracing/season-data'
import type { IracingSeries } from '@/lib/iracing/types'
import { computeContentCost } from '@/lib/analysis/content-cost'
import { ProfileWidget } from '@/components/dashboard/profile-widget'
import { CostWidget } from '@/components/dashboard/cost-widget'
import { SeriesWidget } from '@/components/dashboard/series-widget'
import { DashboardContent } from '@/components/dashboard/dashboard-content'
import { getSeason2Schedules } from '@/lib/season-schedules/markdown'

function getNextRaceDate(selectedSeries: IracingSeries[]): string | null {
  const today = new Date().toISOString().split('T')[0]
  let earliest: string | null = null
  for (const s of selectedSeries) {
    for (const w of s.weeks) {
      if (w.startDate >= today) {
        if (!earliest || w.startDate < earliest) earliest = w.startDate
      }
    }
  }
  return earliest
}

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/')

  const [selectedSeriesNames, ownedTrackKeys, ownedCarNames, profile, matrixSeasonData] =
    await Promise.all([
      fetchSelectedSeriesNames(session.userId, CURRENT_SEASON),
      fetchOwnedTrackKeys(session.userId),
      fetchOwnedCarNames(session.userId),
      fetchUserProfile(session.userId),
      getSeason2Schedules(), // for the legacy Matrix widget
    ])

  const allSeries = getAllSeries()
  const selectedSeries = allSeries.filter((s) => selectedSeriesNames.includes(s.seriesName))
  const selectedSeriesData = toSeasonScheduleData(selectedSeries)

  const { summary } = computeContentCost({
    selectedSeries,
    ownedTrackKeys,
    ownedCarNames,
  })

  // Per-series cost: sum of missing track prices for each series
  const { makeTrackKey } = await import('@/lib/iracing/types')
  const { getTrackPrice } = await import('@/lib/iracing/track-prices')
  const ownedTrackSet = new Set(ownedTrackKeys)
  const seriesCosts: Record<string, number> = {}
  for (const s of selectedSeries) {
    const seen = new Set<string>()
    let cost = 0
    for (const w of s.weeks) {
      const key = makeTrackKey(w.venue, w.config)
      if (!ownedTrackSet.has(key) && !seen.has(key)) {
        seen.add(key)
        cost += getTrackPrice(key)
      }
    }
    seriesCosts[s.seriesName] = cost
  }

  const nextRaceDate = getNextRaceDate(selectedSeries)

  const resolvedProfile = profile ?? {
    name: '',
    licenseClass: 'Rookie',
    licenseSportsCar: 'Rookie',
    licenseFormulaCar: 'Rookie',
    licenseOval: 'Rookie',
    licenseDirtRoad: 'Rookie',
    licenseDirtOval: 'Rookie',
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top row: 2 columns */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ProfileWidget
          name={resolvedProfile.name}
          licenseSportsCar={resolvedProfile.licenseSportsCar}
          licenseFormulaCar={resolvedProfile.licenseFormulaCar}
          licenseOval={resolvedProfile.licenseOval}
          licenseDirtRoad={resolvedProfile.licenseDirtRoad}
          licenseDirtOval={resolvedProfile.licenseDirtOval}
          selectedSeriesCount={selectedSeriesNames.length}
        />
        <CostWidget summary={summary} seriesCosts={seriesCosts} />
      </div>

      {/* Matrix: full width */}
      <DashboardContent seasonData={matrixSeasonData} />

      {/* Series schedule: full width, expandable */}
      <SeriesWidget seriesData={selectedSeriesData} nextRaceDate={nextRaceDate} />
    </div>
  )
}
