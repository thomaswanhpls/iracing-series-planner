import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import {
  fetchSelectedSeriesNames,
  fetchOwnedTrackKeys,
  fetchOwnedCarNames,
  fetchUserProfile,
} from '@/lib/db/actions'
import { getAllSeries, CURRENT_SEASON } from '@/lib/iracing/season-data'
import { computeContentCost } from '@/lib/analysis/content-cost'
import { computeSeriesCost } from '@/lib/analysis/series-cost'
import { formatSeasonLabel } from '@/lib/iracing/format-season-label'
import { getCurrentWeekIndex } from '@/lib/iracing/current-week'
import { DashboardHub } from '@/components/dashboard/dashboard-hub'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/')

  const [selectedSeriesNames, ownedTrackKeys, ownedCarNames, profile] = await Promise.all([
    fetchSelectedSeriesNames(session.userId, CURRENT_SEASON),
    fetchOwnedTrackKeys(session.userId),
    fetchOwnedCarNames(session.userId),
    fetchUserProfile(session.userId),
  ])

  const allSeries = getAllSeries()
  const selectedSeries = allSeries.filter((s) => selectedSeriesNames.includes(s.seriesName))

  const { summary } = computeContentCost({ selectedSeries, ownedTrackKeys, ownedCarNames })
  const seriesCosts = Object.fromEntries(computeSeriesCost(selectedSeries, ownedTrackKeys))

  const currentWeekIndex = selectedSeries[0]
    ? getCurrentWeekIndex(selectedSeries[0].weeks)
    : 0

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
    <DashboardHub
      name={resolvedProfile.name}
      licenseSportsCar={resolvedProfile.licenseSportsCar}
      licenseFormulaCar={resolvedProfile.licenseFormulaCar}
      licenseOval={resolvedProfile.licenseOval}
      licenseDirtRoad={resolvedProfile.licenseDirtRoad}
      licenseDirtOval={resolvedProfile.licenseDirtOval}
      seasonLabel={formatSeasonLabel(CURRENT_SEASON)}
      summary={summary}
      seriesCosts={seriesCosts}
      selectedSeries={selectedSeries}
      ownedTrackKeys={ownedTrackKeys}
      currentWeekIndex={currentWeekIndex}
    />
  )
}
