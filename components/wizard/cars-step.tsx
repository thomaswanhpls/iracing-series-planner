'use client'

import { useState, useMemo } from 'react'
import { Check } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface CarsStepProps {
  allCars: string[]
  initialOwnedCarNames: string[]
  onNext: (ownedCarNames: string[]) => void
  onBack: () => void
  isPending: boolean
}

function normalize(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function CarsStep({
  allCars,
  initialOwnedCarNames,
  onNext,
  onBack,
  isPending,
}: CarsStepProps) {
  const t = useTranslations('wizard.cars')
  const tCommon = useTranslations('common')
  const [search, setSearch] = useState('')
  const [showOnlyOwned, setShowOnlyOwned] = useState(false)
  const [owned, setOwned] = useState<Set<string>>(new Set(initialOwnedCarNames))

  const filtered = useMemo(() => {
    const base = showOnlyOwned ? allCars.filter((c) => owned.has(c)) : allCars
    if (!search.trim()) return base
    const q = normalize(search)
    return base.filter((c) => normalize(c).includes(q))
  }, [allCars, search, showOnlyOwned, owned])

  function toggle(carName: string) {
    setOwned((prev) => {
      const next = new Set(prev)
      if (next.has(carName)) next.delete(carName)
      else next.add(carName)
      return next
    })
  }

  function toggleAll() {
    const allChecked = filtered.every((c) => owned.has(c))
    setOwned((prev) => {
      const next = new Set(prev)
      if (allChecked) {
        filtered.forEach((c) => next.delete(c))
      } else {
        filtered.forEach((c) => next.add(c))
      }
      return next
    })
  }

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-1">{t('title')}</h2>
        <p className="text-sm text-text-secondary">{t('subtitle')}</p>
      </div>

      <div className="flex items-center gap-3">
        <Input
          type="text"
          placeholder={t('search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <span className="text-xs text-text-muted">
          {t('ownedCount', { owned: owned.size, total: allCars.length })}
        </span>
        <button
          type="button"
          onClick={() => setShowOnlyOwned((v) => !v)}
          className={cn(
            'rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all',
            showOnlyOwned
              ? 'border-accent-cyan/50 bg-accent-cyan/10 text-accent-cyan'
              : 'border-border/50 text-text-muted hover:text-text-secondary'
          )}
        >
          {t('showOnlyOwned')}
        </button>
      </div>

      {filtered.length > 0 && (
        <button
          type="button"
          onClick={toggleAll}
          className="self-start text-xs text-accent-cyan/70 hover:text-accent-cyan transition-colors"
        >
          {filtered.every((c) => owned.has(c))
            ? tCommon('deselectFiltered')
            : tCommon('selectFiltered')}
        </button>
      )}

      <Card className="overflow-hidden p-2">
        <ul className="flex flex-col gap-1">
        {filtered.length === 0 && (
          <li className="py-4 text-center text-sm text-text-muted">{t('noResults')}</li>
        )}
        {filtered.map((carName) => {
          const isOwned = owned.has(carName)
          return (
            <li key={carName}>
              <button
                type="button"
                onClick={() => toggle(carName)}
                className={cn(
                  'flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors text-left',
                  isOwned
                    ? 'border border-[rgba(0,232,224,0.55)] bg-[rgba(0,232,224,0.18)] shadow-[inset_3px_0_0_rgba(0,232,224,0.7)]'
                    : 'border border-transparent hover:bg-white/[0.03]',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-sm border transition-all duration-150',
                    isOwned
                      ? 'border-accent-cyan bg-[rgba(0,255,255,0.15)] shadow-[0_0_8px_rgba(0,255,255,0.35)]'
                      : 'border-white/25 bg-white/[0.03]'
                  )}
                >
                  {isOwned && <Check className="h-3.5 w-3.5 stroke-[2.5]" style={{ color: '#00ffff' }} />}
                </span>
                <span className="flex-1 text-text-primary">{carName}</span>
              </button>
            </li>
          )
        })}
        </ul>
      </Card>

      </div>
      <div className="mt-auto sticky -bottom-[1px] -mx-3 md:-mx-6 flex items-center justify-between border-t border-border/30 bg-bg-base px-3 py-3 md:px-6">
        <Button variant="ghost" onClick={onBack}>
          {tCommon('back')}
        </Button>
        <Button onClick={() => onNext(Array.from(owned))} disabled={isPending}>
          {isPending ? tCommon('saving') : tCommon('next')}
        </Button>
      </div>
    </div>
  )
}
