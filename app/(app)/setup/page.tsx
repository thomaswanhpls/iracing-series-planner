import { WizardShell } from '@/components/wizard/wizard-shell'
import { getAllSeries, getUniqueTracks, getAllCars, toSeasonScheduleData } from '@/lib/iracing/season-data'
import { getSession } from '@/lib/auth/session'
import {
  fetchSelectedSeriesNames,
  fetchOwnedTrackKeys,
  fetchOwnedCarNames,
  fetchUserProfile,
} from '@/lib/db/actions'
import { redirect } from 'next/navigation'

export default async function SetupPage() {
  const session = await getSession()
  if (!session) redirect('/')

  const allSeries = getAllSeries()
  const seriesData = toSeasonScheduleData(allSeries)
  const allTracks = getUniqueTracks()
  const allCars = getAllCars()

  const [selectedSeriesNames, ownedTrackKeys, ownedCarNames, profile] = await Promise.all([
    fetchSelectedSeriesNames(session.userId, '2026-2'),
    fetchOwnedTrackKeys(session.userId),
    fetchOwnedCarNames(session.userId),
    fetchUserProfile(session.userId),
  ])

  return (
    <WizardShell
      userId={session.userId}
      seriesData={seriesData}
      allTracks={allTracks}
      allCars={allCars}
      initialSeriesNames={selectedSeriesNames}
      initialTrackKeys={ownedTrackKeys}
      initialCarNames={ownedCarNames}
      initialProfile={profile ?? { name: '', licenseClass: 'Rookie' }}
    />
  )
}
