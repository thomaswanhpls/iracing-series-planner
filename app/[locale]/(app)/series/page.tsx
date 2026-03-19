import { SeasonScheduleBrowser } from '@/components/season-schedule-browser'
import { getSeason2Schedules } from '@/lib/season-schedules/markdown'

export default async function SeriesPage() {
  const data = await getSeason2Schedules()

  return (
    <div className="h-full overflow-auto p-6">
      <SeasonScheduleBrowser data={data} />
    </div>
  )
}