'use client'

import { useState, useMemo } from 'react'
import type { IracingTrack } from '@/lib/iracing/types'
import { makeTrackKey } from '@/lib/iracing/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'

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

export function TracksStep({
  allTracks,
  initialOwnedTrackKeys,
  onNext,
  onBack,
  isPending,
}: TracksStepProps) {
  const [search, setSearch] = useState('')
  const [owned, setOwned] = useState<Set<string>>(new Set(initialOwnedTrackKeys))

  const filtered = useMemo(() => {
    if (!search.trim()) return allTracks
    const q = normalize(search)
    return allTracks.filter((t) => normalize(t.venue).includes(q))
  }, [allTracks, search])

  function toggle(track: IracingTrack) {
    const key = makeTrackKey(track.venue, track.config)
    setOwned((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function toggleAll() {
    const filteredKeys = filtered.map((t) => makeTrackKey(t.venue, t.config))
    const allChecked = filteredKeys.every((k) => owned.has(k))
    setOwned((prev) => {
      const next = new Set(prev)
      if (allChecked) {
        filteredKeys.forEach((k) => next.delete(k))
      } else {
        filteredKeys.forEach((k) => next.add(k))
      }
      return next
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-1">Dina banor</h2>
        <p className="text-sm text-text-secondary">
          Markera de banor du redan äger. Omarkerade banor räknas som köpbehov i
          kostnadskalkylerna.
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
          {owned.size} / {allTracks.length} ägda
        </span>
      </div>

      {/* Select all for filtered results */}
      {filtered.length > 0 && (
        <button
          type="button"
          onClick={toggleAll}
          className="self-start text-xs text-accent-cyan/70 hover:text-accent-cyan transition-colors"
        >
          {filtered.every((t) => owned.has(makeTrackKey(t.venue, t.config)))
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
        {filtered.map((track) => {
          const key = makeTrackKey(track.venue, track.config)
          const isOwned = owned.has(key)
          return (
            <div
              key={key}
              role="button"
              tabIndex={0}
              onClick={() => toggle(track)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  toggle(track)
                }
              }}
              className={[
                'flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
                isOwned
                  ? 'border border-[rgba(0,255,255,0.55)] bg-[rgba(0,255,255,0.08)]'
                  : 'border border-transparent hover:bg-white/[0.03]',
              ].join(' ')}
            >
              <Checkbox checked={isOwned} readOnly aria-hidden />
              <span className="flex-1 text-text-primary">{track.venue}</span>
              {track.config && (
                <Badge variant="default" className="text-xs">
                  {track.config}
                </Badge>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={() => onNext(Array.from(owned))} disabled={isPending}>
          {isPending ? 'Sparar...' : 'Nästa →'}
        </Button>
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-text-muted hover:text-text-primary transition-colors"
        >
          ← Tillbaka
        </button>
      </div>
    </div>
  )
}
