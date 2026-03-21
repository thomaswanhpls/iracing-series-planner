import type { Metadata } from 'next'
import { SeasonScheduleBrowser } from '@/components/season-schedule-browser'

export const metadata: Metadata = {
  title: 'Series Browser',
  description: 'Browse iRacing series schedules — explore tracks, conditions, and weekly schedules for the current season.',
}
import { getSeason2Schedules } from '@/lib/season-schedules/markdown'

export default async function SeriesPage() {
  const data = await getSeason2Schedules()

  return (
    <div className="h-full overflow-auto p-3 md:p-6">
      <SeasonScheduleBrowser data={data} />
    </div>
  )
}