'use client'

import { useState, useMemo } from 'react'
import type { IracingTrack } from '@/lib/iracing/types'
import { makeTrackKey } from '@/lib/iracing/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'

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
  // Check if this venue starts with a known base venue + space
  // e.g. "Mount Panorama Circuit FIA F4" → "Mount Panorama Circuit"
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
    // Store with config = original venue suffix if it was a sub-variant
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
  const [search, setSearch] = useState('')
  const [owned, setOwned] = useState<Set<string>>(new Set(initialOwnedTrackKeys))

  const venueGroups = useMemo(() => buildVenueGroups(allTracks), [allTracks])

  const filtered = useMemo(() => {
    if (!search.trim()) return venueGroups
    const q = normalize(search)
    return venueGroups.filter((g) => normalize(g.venue).includes(q))
  }, [venueGroups, search])

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
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-1">Dina banor</h2>
        <p className="text-sm text-text-secondary">
          Markera de banor du redan äger. Omarkerade banor räknas som köpbehov i kostnadskalkylerna.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Input
          type="text"
          placeholder="Sök bana..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <span className="text-xs text-text-muted">
          {ownedVenueCount} / {totalVenues} ägda
        </span>
      </div>

      {filtered.length > 0 && (
        <button
          type="button"
          onClick={toggleAll}
          className="self-start text-xs text-accent-cyan/70 hover:text-accent-cyan transition-colors"
        >
          {filtered.every((g) => g.configKeys.some((k) => owned.has(k)))
            ? 'Avmarkera filtrerade'
            : 'Markera filtrerade'}
        </button>
      )}

      <div
        className="flex flex-col gap-1 overflow-y-auto rounded-md border border-border-subtle bg-bg-glass p-2"
        style={{ maxHeight: '50vh' }}
      >
        {filtered.length === 0 && (
          <p className="py-4 text-center text-sm text-text-muted">Inga banor hittades.</p>
        )}
        {filtered.map((group) => {
          const isOwned = group.configKeys.some((k) => owned.has(k))
          const configs = group.tracks.map((t) => t.config).filter(Boolean) as string[]
          return (
            <div
              key={group.venue}
              role="button"
              tabIndex={0}
              onClick={() => toggleVenue(group)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  toggleVenue(group)
                }
              }}
              className={[
                'flex cursor-pointer items-start gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
                isOwned
                  ? 'border border-[rgba(0,232,224,0.55)] bg-[rgba(0,232,224,0.08)]'
                  : 'border border-transparent hover:bg-white/[0.03]',
              ].join(' ')}
            >
              <Checkbox checked={isOwned} readOnly aria-hidden className="mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-text-primary">{group.venue}</span>
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
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={onBack}>
          ← Tillbaka
        </Button>
        <Button onClick={() => onNext(Array.from(owned))} disabled={isPending}>
          {isPending ? 'Sparar...' : 'Nästa →'}
        </Button>
      </div>
    </div>
  )
}
