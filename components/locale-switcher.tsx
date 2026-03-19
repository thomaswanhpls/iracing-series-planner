'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/navigation'

export function LocaleSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const next = locale === 'en' ? 'sv' : 'en'

  return (
    <button
      onClick={() => router.replace(pathname, { locale: next })}
      className="font-mono text-[11px] uppercase tracking-widest text-white/40 hover:text-white/80 transition-colors px-2 py-1 rounded border border-white/[0.08] hover:border-white/20"
      title={next === 'sv' ? 'Switch to Swedish' : 'Byt till engelska'}
    >
      {next === 'sv' ? 'SV' : 'EN'}
    </button>
  )
}
