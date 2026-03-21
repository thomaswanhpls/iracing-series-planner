import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Your iRacing season dashboard — track ownership matrix, cost analysis, and race conditions at a glance.',
}
import { getSession } from '@/lib/auth/session'
import {
  fetchSelectedSeriesNames,
  fetchOwnedTrackKeys,
  fetchOwnedCarNames,
  fetchUserProfile,
} from '@/lib/db/actions'
import { getAllSeries, CURRENT_SEASON } from '@/lib/iracing/season-data'
import { computeContentCost } from '@/lib/analysis/content-cost'
import { formatSeasonLabel } from '@/lib/iracing/format-season-label'
import { getCurrentWeekIndex } from '@/lib/iracing/current-week'
import { DashboardHub } from '@/components/dashboard/dashboard-hub'

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
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

  const { summary, recommendations, missingCarBySeries } = computeContentCost({ selectedSeries, ownedTrackKeys, ownedCarNames })

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
      recommendations={recommendations}
      missingCarBySeries={missingCarBySeries}
      selectedSeries={selectedSeries}
      ownedTrackKeys={ownedTrackKeys}
      currentWeekIndex={currentWeekIndex}
    />
  )
}
