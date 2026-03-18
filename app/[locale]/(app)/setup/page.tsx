import { setRequestLocale } from 'next-intl/server'
import { WizardShell } from '@/components/wizard/wizard-shell'
import { getAllSeries, getUniqueTracks, getAllCars, toSeasonScheduleData, CURRENT_SEASON } from '@/lib/iracing/season-data'
import { getSession } from '@/lib/auth/session'
import {
  fetchSelectedSeriesNames,
  fetchOwnedTrackKeys,
  fetchOwnedCarNames,
  fetchUserProfile,
} from '@/lib/db/actions'
import { redirect } from 'next/navigation'

export default async function SetupPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const session = await getSession()
  if (!session) redirect('/')

  const allSeries = getAllSeries()
  const seriesData = toSeasonScheduleData(allSeries)
  const allTracks = getUniqueTracks()
  const allCars = getAllCars()

  const [selectedSeriesNames, ownedTrackKeys, ownedCarNames, profile] = await Promise.all([
    fetchSelectedSeriesNames(session.userId, CURRENT_SEASON),
    fetchOwnedTrackKeys(session.userId),
    fetchOwnedCarNames(session.userId),
    fetchUserProfile(session.userId),
  ])

  return (
    <div className="h-full overflow-auto p-6">
      <WizardShell
        userId={session.userId}
        seriesData={seriesData}
        allTracks={allTracks}
        allCars={allCars}
        initialSeriesNames={selectedSeriesNames}
        initialTrackKeys={ownedTrackKeys}
        initialCarNames={ownedCarNames}
        initialProfile={profile ?? { name: '', licenseSportsCar: 'Rookie', licenseFormulaCar: 'Rookie', licenseOval: 'Rookie', licenseDirtRoad: 'Rookie', licenseDirtOval: 'Rookie' }}
      />
    </div>
  )
}
