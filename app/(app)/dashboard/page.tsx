import { Suspense } from 'react'
import { DashboardContent } from '@/components/dashboard/dashboard-content'
import { Skeleton } from '@/components/ui/skeleton'
import { getSeason2Schedules } from '@/lib/season-schedules/markdown'

export default async function Dashboard() {
  const seasonData = await getSeason2Schedules()

  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      }
    >
      <DashboardContent seasonData={seasonData} />
    </Suspense>
  )
}
