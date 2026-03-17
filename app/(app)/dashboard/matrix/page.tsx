import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { getSeason2Schedules } from '@/lib/season-schedules/markdown'
import { DashboardContent } from '@/components/dashboard/dashboard-content'

export default async function MatrixPage() {
  const session = await getSession()
  if (!session) redirect('/')

  const seasonData = await getSeason2Schedules()

  return (
    <div className="h-full overflow-auto p-6">
      <h1 className="mb-4 text-lg font-semibold text-white/80">Track Matrix</h1>
      <DashboardContent seasonData={seasonData} />
    </div>
  )
}
