import { SetupWizard } from '@/components/wizard/setup-wizard'
import { getSeason2Schedules } from '@/lib/season-schedules/markdown'

export default async function SetupPage() {
  const seasonData = await getSeason2Schedules()

  return <SetupWizard data={seasonData} />
}
