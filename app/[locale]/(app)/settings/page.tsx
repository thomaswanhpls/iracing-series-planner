import { getTranslations, setRequestLocale } from 'next-intl/server'

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('settings')

  return (
    <div className="h-full overflow-auto p-6">
      <h2 className="font-display text-xl font-bold mb-4">{t('title')}</h2>
      <p className="text-text-secondary">{t('comingSoon')}</p>
    </div>
  )
}
