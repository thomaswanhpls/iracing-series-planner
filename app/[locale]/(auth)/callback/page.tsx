import { setRequestLocale } from 'next-intl/server'

export default async function AuthCallback({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-text-secondary">Processing login...</p>
    </div>
  )
}
