import { SeriesSetup } from '@/components/wizard/series-setup'
import { getSeason2Schedules } from '@/lib/season-schedules/markdown'

export default async function SetupPage() {
  const seasonData = await getSeason2Schedules()

  return <SeriesSetup data={seasonData} />
}
