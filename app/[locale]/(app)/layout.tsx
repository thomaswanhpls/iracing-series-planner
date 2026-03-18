import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { getSession } from '@/lib/auth/session'
import { getOwnedTrackIds } from '@/lib/db/queries'
import { AppShell } from '@/components/app-shell'

async function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/')

  const initialOwnedTrackIds = await getOwnedTrackIds(session.userId)

  return (
    <AppShell userId={session.userId} initialOwnedTrackIds={initialOwnedTrackIds}>
      {children}
    </AppShell>
  )
}

function AppLayoutFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-base text-sm text-text-secondary">
      Loading...
    </div>
  )
}

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <Suspense fallback={<AppLayoutFallback />}>
      <AppLayoutContent>{children}</AppLayoutContent>
    </Suspense>
  )
}
