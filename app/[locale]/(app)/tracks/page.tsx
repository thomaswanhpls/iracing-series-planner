'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { getAllTracks, getFreeTracks } from '@/lib/iracing/data-provider'
import { useOwnership } from '@/lib/ownership/context'
import type { Category } from '@/lib/iracing/types'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const categoryLabels: Record<Category, string> = {
  road: 'Road',
  oval: 'Oval',
  dirt_road: 'Dirt Road',
  dirt_oval: 'Dirt Oval',
}

type OwnershipFilter = 'all' | 'owned' | 'missing' | 'free'
interface RecentOwnershipChange {
  venueKey: string
  venueName: string
  action: 'owned' | 'removed'
}
interface MergedTrackEntry {
  venueKey: string
  venueName: string
  category: Category
  trackIds: number[]
  paidTrackIds: number[]
  configLabels: string[]
  minPrice: number
}

function normalizeVenueName(value: string): string {
  return value
    .replace('[Legacy] ', '')
    .split(' - ')[0]
    .trim()
}

export default function Tracks() {
  const searchParams = useSearchParams()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'all' | Category>('all')
  const [ownershipFilter, setOwnershipFilter] = useState<OwnershipFilter>('all')
  const [recentChanges, setRecentChanges] = useState<RecentOwnershipChange[]>([])
  const tracks = getAllTracks()
  const freeTracks = getFreeTracks()
  const { ownedTrackIds, setOwned, bulkSet, clearAll } = useOwnership()
  const freeTrackIds = new Set(freeTracks.map((track) => track.track_id))
  const mergedTracks = useMemo(() => {
    const byVenue = new Map<string, MergedTrackEntry>()
    for (const track of tracks) {
      const venueName = normalizeVenueName(track.track_name)
      const venueKey = venueName.toLowerCase()
      const existing = byVenue.get(venueKey)
      if (!existing) {
        byVenue.set(venueKey, {
          venueKey,
          venueName,
          category: track.category,
          trackIds: [track.track_id],
          paidTrackIds: track.free_with_subscription ? [] : [track.track_id],
          configLabels: track.config_name ? [track.config_name] : [],
          minPrice: track.free_with_subscription ? Number.POSITIVE_INFINITY : track.price,
        })
        continue
      }

      existing.trackIds.push(track.track_id)
      if (!track.free_with_subscription) {
        existing.paidTrackIds.push(track.track_id)
        existing.minPrice = Math.min(existing.minPrice, track.price)
      }
      if (track.config_name) {
        existing.configLabels.push(track.config_name)
      }
    }

    return Array.from(byVenue.values()).map((entry) => ({
      ...entry,
      configLabels: Array.from(new Set(entry.configLabels)).sort((a, b) => a.localeCompare(b)),
      minPrice: Number.isFinite(entry.minPrice) ? entry.minPrice : 0,
    }))
  }, [tracks])

  const ownedPaidTrackCount = useMemo(
    () => ownedTrackIds.filter((trackId) => !freeTrackIds.has(trackId)).length,
    [freeTrackIds, ownedTrackIds]
  )
  const ownedMergedVenues = useMemo(
    () =>
      mergedTracks.filter((entry) => {
        if (entry.paidTrackIds.length === 0) return false
        return entry.paidTrackIds.every((trackId) => ownedTrackIds.includes(trackId))
      }),
    [mergedTracks, ownedTrackIds]
  )

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    return mergedTracks.filter((track) => {
      const configSearch = track.configLabels.join(' ').toLowerCase()
      if (
        normalizedSearch &&
        !track.venueName.toLowerCase().includes(normalizedSearch) &&
        !configSearch.includes(normalizedSearch)
      ) {
        return false
      }

      if (categoryFilter !== 'all' && track.category !== categoryFilter) {
        return false
      }

      const isFree = track.paidTrackIds.length === 0
      const ownedPaidConfigs = track.paidTrackIds.filter((trackId) => ownedTrackIds.includes(trackId)).length
      const isOwned = isFree || (track.paidTrackIds.length > 0 && ownedPaidConfigs === track.paidTrackIds.length)

      if (ownershipFilter === 'owned' && !isOwned) return false
      if (ownershipFilter === 'missing' && isOwned) return false
      if (ownershipFilter === 'free' && !isFree) return false

      return true
    })
  }, [categoryFilter, mergedTracks, ownedTrackIds, ownershipFilter, search])

  const grouped = useMemo(
    () =>
      filtered.reduce<Record<Category, MergedTrackEntry[]>>((acc, track) => {
        if (!acc[track.category]) acc[track.category] = []
        acc[track.category].push(track)
        return acc
      }, {} as Record<Category, MergedTrackEntry[]>),
    [filtered]
  )

  const pushRecentChange = (entry: RecentOwnershipChange) => {
    setRecentChanges((previous) => {
      const next = [entry, ...previous.filter((item) => item.venueKey !== entry.venueKey)]
      return next.slice(0, 8)
    })
  }

  const handleMarkAllFree = () => {
    bulkSet(freeTracks.map((t) => t.track_id))
  }

  const seriesParam = searchParams.get('series')
  const seriesHref = seriesParam ? `/series?series=${seriesParam}` : '/series'
  const costsHref = seriesParam ? `/dashboard/costs?series=${seriesParam}` : '/dashboard/costs'

  return (
    <div className="h-full overflow-auto p-6">
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold">Banor</h2>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleMarkAllFree} className="text-xs">
            Markera alla gratis
          </Button>
          <Button variant="ghost" onClick={clearAll} className="text-xs">
            Rensa alla
          </Button>
        </div>
      </div>

      <Input
        placeholder="Sök banor..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="text-sm text-text-secondary">
        {ownedPaidTrackCount} köpta banor markerade som ägda • {freeTracks.length} ingår med medlemskap
      </div>

      <div className="rounded-lg border border-border bg-bg-surface/40 p-3">
        <div className="mb-2 text-xs uppercase tracking-wider text-text-muted">Nyligen ändrat</div>
        {recentChanges.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {recentChanges.map((entry) => (
              <Badge key={`change-${entry.venueKey}`} variant="default">
                {entry.action === 'owned' ? 'Lagd till' : 'Borttagen'}: {entry.venueName}
              </Badge>
            ))}
          </div>
        ) : (
          <div className="text-xs text-text-muted">
            Inga ändringar ännu i denna session.
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border bg-bg-surface/40 p-3">
        <div className="mb-2 text-xs uppercase tracking-wider text-text-muted">Review: Dina köpta banor</div>
        {ownedMergedVenues.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {ownedMergedVenues
              .slice()
              .sort((a, b) => a.venueName.localeCompare(b.venueName))
              .map((track) => (
                <Badge key={`owned-${track.venueKey}`} variant="default">
                  {track.venueName}
                </Badge>
              ))}
          </div>
        ) : (
          <div className="text-xs text-text-muted">Inga köpta banor markerade ännu.</div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-bg-surface/40 p-3">
        <span className="text-xs text-text-muted">Kategori:</span>
        <Button
          variant={categoryFilter === 'all' ? 'secondary' : 'ghost'}
          className="h-7 px-2 text-xs"
          onClick={() => setCategoryFilter('all')}
        >
          Alla
        </Button>
        {(Object.keys(categoryLabels) as Category[]).map((category) => (
          <Button
            key={category}
            variant={categoryFilter === category ? 'secondary' : 'ghost'}
            className="h-7 px-2 text-xs"
            onClick={() => setCategoryFilter(category)}
          >
            {categoryLabels[category]}
          </Button>
        ))}
        <span className="ml-2 text-xs text-text-muted">Status:</span>
        {(
          [
            ['all', 'Alla'],
            ['owned', 'Ägda'],
            ['missing', 'Saknas'],
            ['free', 'Gratis'],
          ] as Array<[OwnershipFilter, string]>
        ).map(([value, label]) => (
          <Button
            key={value}
            variant={ownershipFilter === value ? 'secondary' : 'ghost'}
            className="h-7 px-2 text-xs"
            onClick={() => setOwnershipFilter(value)}
          >
            {label}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-bg-surface/40 p-3">
        <Link href={seriesHref}>
          <Button variant="ghost" className="text-xs">
            Valfritt: Granska Seriescheman
          </Button>
        </Link>
        <Link href={costsHref}>
          <Button className="text-xs">Fortsätt till Kostnader</Button>
        </Link>
      </div>

      {(Object.entries(grouped) as [Category, MergedTrackEntry[]][]).map(([category, categoryTracks]) => (
        <div key={category}>
          <h3 className="font-display text-sm font-semibold mb-2 text-text-secondary uppercase tracking-wider">
            {categoryLabels[category]} • {categoryTracks.length}
          </h3>
          <div className="space-y-1">
            {categoryTracks.map((track) => {
              const ownedPaidConfigs = track.paidTrackIds.filter((trackId) => ownedTrackIds.includes(trackId)).length
              const isFree = track.paidTrackIds.length === 0
              const isOwned = isFree || (track.paidTrackIds.length > 0 && ownedPaidConfigs === track.paidTrackIds.length)
              const isPartial = !isFree && ownedPaidConfigs > 0 && ownedPaidConfigs < track.paidTrackIds.length
              return (
                <label
                  key={track.venueKey}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 cursor-pointer transition-colors',
                    isOwned ? 'bg-status-owned/10' : 'hover:bg-bg-hover'
                  )}
                >
                  <Checkbox
                    checked={isOwned}
                    disabled={isFree}
                    onChange={() => {
                      const nextOwned = !isOwned
                      for (const trackId of track.paidTrackIds) {
                        setOwned(trackId, nextOwned)
                      }
                      pushRecentChange({
                        venueKey: track.venueKey,
                        venueName: track.venueName,
                        action: nextOwned ? 'owned' : 'removed',
                      })
                    }}
                  />
                  <span className="flex-1 text-sm">
                    {track.venueName}
                    {track.configLabels.length > 0 && (
                      <span className="text-text-muted"> — {track.configLabels.length} configs</span>
                    )}
                  </span>
                  {isPartial && (
                    <Badge variant="default">
                      Delvis ägd ({ownedPaidConfigs}/{track.paidTrackIds.length})
                    </Badge>
                  )}
                  {!isFree && isOwned && (
                    <Badge variant="default">Ägd</Badge>
                  )}
                  {isFree ? (
                    <Badge variant="default">Gratis</Badge>
                  ) : (
                    <span className="text-xs text-text-muted">fr. ${track.minPrice.toFixed(2)}</span>
                  )}
                </label>
              )
            })}
          </div>
        </div>
      ))}
      {filtered.length === 0 && (
        <div className="rounded-lg border border-border p-4 text-sm text-text-secondary">
          Inga banor matchar dina filter.
        </div>
      )}
    </div>
    </div>
  )
}
