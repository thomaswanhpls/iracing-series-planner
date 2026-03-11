import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { getOwnedTrackIds } from '@/lib/db/queries'
import { AppShell } from '@/components/app-shell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/')

  const initialOwnedTrackIds = await getOwnedTrackIds(session.userId)

  return (
    <AppShell userId={session.userId} initialOwnedTrackIds={initialOwnedTrackIds}>
      {children}
    </AppShell>
  )
}
