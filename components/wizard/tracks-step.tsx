'use client'

import { useState, useMemo } from 'react'
import { Check } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { IracingTrack } from '@/lib/iracing/types'
import { makeTrackKey } from '@/lib/iracing/types'
import { getTrackPrice } from '@/lib/iracing/track-prices'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface VenueGroup {
  venue: string
  tracks: IracingTrack[]
  popularityScore: number
  configKeys: string[]
}

interface TracksStepProps {
  allTracks: IracingTrack[]
  initialOwnedTrackKeys: string[]
  onNext: (ownedTrackKeys: string[]) => void
  onBack: () => void
  isPending: boolean
}

function normalize(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/** Venues that are car-specific variants included with a base venue purchase */
function resolveBaseVenue(venue: string, venueSet: Set<string>): string {
  for (const base of venueSet) {
    if (base !== venue && venue.startsWith(base + ' ')) return base
  }
  return venue
}

function buildVenueGroups(tracks: IracingTrack[]): VenueGroup[] {
  const venueSet = new Set(tracks.map((t) => t.venue))
  const map = new Map<string, IracingTrack[]>()
  for (const t of tracks) {
    const base = resolveBaseVenue(t.venue, venueSet)
    const existing = map.get(base)
    const effectiveTrack: IracingTrack =
      base !== t.venue
        ? { ...t, venue: base, config: t.venue.slice(base.length + 1) }
        : t
    if (existing) existing.push(effectiveTrack)
    else map.set(base, [effectiveTrack])
  }
  return Array.from(map.entries()).map(([venue, ts]) => ({
    venue,
    tracks: ts,
    popularityScore: Math.max(...ts.map((t) => t.popularityScore)),
    configKeys: ts.map((t) => makeTrackKey(t.venue, t.config)),
  }))
}

export function TracksStep({
  allTracks,
  initialOwnedTrackKeys,
  onNext,
  onBack,
  isPending,
}: TracksStepProps) {
  const t = useTranslations('wizard.tracks')
  const tCommon = useTranslations('common')
  const freeTrackKeys = useMemo(
    () => new Set(allTracks.map((t) => makeTrackKey(t.venue, t.config)).filter((k) => getTrackPrice(k) === 0)),
    [allTracks]
  )

  const [search, setSearch] = useState('')
  const [showOnlyOwned, setShowOnlyOwned] = useState(false)
  const [owned, setOwned] = useState<Set<string>>(() => {
    const initial = new Set(initialOwnedTrackKeys)
    for (const k of freeTrackKeys) initial.add(k)
    return initial
  })

  const venueGroups = useMemo(() => buildVenueGroups(allTracks), [allTracks])

  const filtered = useMemo(() => {
    const base = showOnlyOwned
      ? venueGroups.filter((g) => g.configKeys.some((k) => owned.has(k)))
      : venueGroups
    if (!search.trim()) return base
    const q = normalize(search)
    return base.filter((g) => normalize(g.venue).includes(q))
  }, [venueGroups, search, showOnlyOwned, owned])

  const totalVenues = venueGroups.length
  const ownedVenueCount = venueGroups.filter((g) =>
    g.configKeys.some((k) => owned.has(k))
  ).length

  function toggleVenue(group: VenueGroup) {
    const anyOwned = group.configKeys.some((k) => owned.has(k))
    setOwned((prev) => {
      const next = new Set(prev)
      if (anyOwned) {
        group.configKeys.forEach((k) => next.delete(k))
      } else {
        group.configKeys.forEach((k) => next.add(k))
      }
      return next
    })
  }

  function toggleAll() {
    const allChecked = filtered.every((g) => g.configKeys.some((k) => owned.has(k)))
    setOwned((prev) => {
      const next = new Set(prev)
      for (const g of filtered) {
        if (allChecked) {
          g.configKeys.forEach((k) => next.delete(k))
        } else {
          g.configKeys.forEach((k) => next.add(k))
        }
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
          {t('ownedCount', { owned: ownedVenueCount, total: totalVenues })}
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

      <p className="text-[11px] text-text-muted rounded-md border border-border/40 bg-bg-elevated/50 px-3 py-2">
        {t('freeTracksNote')}
      </p>

      {filtered.length > 0 && (
        <button
          type="button"
          onClick={toggleAll}
          className="self-start text-xs text-accent-cyan/70 hover:text-accent-cyan transition-colors"
        >
          {filtered.every((g) => g.configKeys.some((k) => owned.has(k)))
            ? tCommon('deselectFiltered')
            : tCommon('selectFiltered')}
        </button>
      )}

      <Card className="overflow-hidden p-2">
        <ul className="flex flex-col gap-1">
        {filtered.length === 0 && (
          <li className="py-4 text-center text-sm text-text-muted">{t('noResults')}</li>
        )}
        {filtered.map((group) => {
          const isOwned = group.configKeys.some((k) => owned.has(k))
          const isFree = group.configKeys.some((k) => freeTrackKeys.has(k))
          const configs = group.tracks.map((t) => t.config).filter(Boolean) as string[]
          return (
            <li key={group.venue}>
              <button
                type="button"
                onClick={() => toggleVenue(group)}
                className={cn(
                  'flex w-full cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors text-left',
                  isFree
                    ? 'border border-[rgba(45,217,168,0.4)] bg-[rgba(45,217,168,0.07)]'
                    : isOwned
                    ? 'border border-[rgba(0,232,224,0.55)] bg-[rgba(0,232,224,0.18)] shadow-[inset_3px_0_0_rgba(0,232,224,0.7)]'
                    : 'border border-transparent hover:bg-white/[0.03]',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'mt-0.5 inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-sm border transition-all duration-150',
                    isOwned
                      ? 'border-accent-cyan bg-[rgba(0,255,255,0.15)] shadow-[0_0_8px_rgba(0,255,255,0.35)]'
                      : 'border-white/25 bg-white/[0.03]'
                  )}
                >
                  {isOwned && <Check className="h-3.5 w-3.5 stroke-[2.5]" style={{ color: '#00ffff' }} />}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-text-primary">{group.venue}</span>
                    {isFree && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                        style={{ color: 'var(--color-accent-green)', background: 'rgba(45,217,168,0.12)' }}>
                        {t('includedBadge')}
                      </span>
                    )}
                  </div>
                  {configs.length > 0 && (
                    <div className="text-[11px] text-text-muted mt-0.5 truncate">
                      {configs.join(' · ')}
                    </div>
                  )}
                </div>
                {group.popularityScore > 0 && (
                  <span className="text-[11px] text-text-muted tabular-nums shrink-0 mt-0.5">
                    {group.popularityScore}p
                  </span>
                )}
              </button>
            </li>
          )
        })}
        </ul>
      </Card>

      </div>
      <div className="mt-auto sticky -bottom-[1px] -mx-3 md:-mx-6 flex items-center justify-between border-t border-border/30 bg-bg-base px-3 py-3 md:px-6">
        <Button variant="ghost" onClick={onBack}>{tCommon('back')}</Button>
        <Button onClick={() => onNext(Array.from(owned))} disabled={isPending}>
          {isPending ? tCommon('saving') : tCommon('next')}
        </Button>
      </div>
    </div>
  )
}
