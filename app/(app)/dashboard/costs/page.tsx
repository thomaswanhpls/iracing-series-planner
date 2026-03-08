import { Suspense } from 'react'
import { CostsContent } from '@/components/dashboard/costs-content'
import { Skeleton } from '@/components/ui/skeleton'

export default function Costs() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64" />
        </div>
      }
    >
      <CostsContent />
    </Suspense>
  )
}
