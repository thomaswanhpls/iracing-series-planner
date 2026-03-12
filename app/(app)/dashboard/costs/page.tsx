import { Suspense } from 'react'
import { CostsContent } from '@/components/dashboard/costs-content'
import { Skeleton } from '@/components/ui/skeleton'
import { getSeason2Schedules } from '@/lib/season-schedules/markdown'

export default async function Costs() {
  const seasonData = await getSeason2Schedules()

  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64" />
        </div>
      }
    >
      <CostsContent seasonData={seasonData} />
    </Suspense>
  )
}
