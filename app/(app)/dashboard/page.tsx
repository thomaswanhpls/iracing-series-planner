import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import {
  fetchSelectedSeriesNames,
  fetchOwnedTrackKeys,
  fetchOwnedCarNames,
  fetchUserProfile,
} from '@/lib/db/actions'
import { getAllSeries, toSeasonScheduleData } from '@/lib/iracing/season-data'
import { computeContentCost } from '@/lib/analysis/content-cost'
import { ProfileWidget } from '@/components/dashboard/profile-widget'
import { CostWidget } from '@/components/dashboard/cost-widget'
import { SeriesWidget } from '@/components/dashboard/series-widget'
import { DashboardContent } from '@/components/dashboard/dashboard-content'
import { getSeason2Schedules } from '@/lib/season-schedules/markdown'

function getNextRaceDate(selectedSeriesNames: string[]): string | null {
  const today = new Date().toISOString().split('T')[0]
  const allSeries = getAllSeries()
  const selected = allSeries.filter((s) => selectedSeriesNames.includes(s.seriesName))
  let earliest: string | null = null
  for (const s of selected) {
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
      fetchSelectedSeriesNames(session.userId, '2026-2'),
      fetchOwnedTrackKeys(session.userId),
      fetchOwnedCarNames(session.userId),
      fetchUserProfile(session.userId),
      getSeason2Schedules(), // for the legacy Matrix widget
    ])

  const allSeries = getAllSeries()
  const selectedSeries = allSeries.filter((s) => selectedSeriesNames.includes(s.seriesName))
  const selectedSeriesData = toSeasonScheduleData(selectedSeries)

  const { recommendations, summary } = computeContentCost({
    selectedSeries,
    ownedTrackKeys,
    ownedCarNames,
  })

  const nextRaceDate = getNextRaceDate(selectedSeriesNames)

  const resolvedProfile = profile ?? { name: '', licenseClass: 'Rookie' }

  return (
    <div className="flex flex-col gap-6">
      {/* Top row: 2 columns */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ProfileWidget
          name={resolvedProfile.name}
          licenseClass={resolvedProfile.licenseClass}
          selectedSeriesCount={selectedSeriesNames.length}
        />
        <CostWidget recommendations={recommendations} summary={summary} />
      </div>

      {/* Matrix: full width */}
      <DashboardContent seasonData={matrixSeasonData} />

      {/* Series schedule: full width, expandable */}
      <SeriesWidget seriesData={selectedSeriesData} nextRaceDate={nextRaceDate} />
    </div>
  )
}
