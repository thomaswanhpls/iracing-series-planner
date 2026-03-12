import { SeasonScheduleBrowser } from '@/components/season-schedule-browser'
import { getSeason2Schedules } from '@/lib/season-schedules/markdown'

export default async function SeriesPage() {
  const data = await getSeason2Schedules()

  return <SeasonScheduleBrowser data={data} />
}