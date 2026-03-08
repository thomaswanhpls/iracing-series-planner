'use client'

import { useState } from 'react'
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

export default function Tracks() {
  const [search, setSearch] = useState('')
  const tracks = getAllTracks()
  const freeTracks = getFreeTracks()
  const { ownedTrackIds, toggle, bulkSet, clearAll } = useOwnership()

  const filtered = tracks.filter((t) =>
    !search || t.track_name.toLowerCase().includes(search.toLowerCase())
  )

  const grouped = filtered.reduce<Record<Category, typeof tracks>>((acc, track) => {
    if (!acc[track.category]) acc[track.category] = []
    acc[track.category].push(track)
    return acc
  }, {} as Record<Category, typeof tracks>)

  const handleMarkAllFree = () => {
    bulkSet(freeTracks.map((t) => t.track_id))
  }

  return (
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
        {ownedTrackIds.length} banor markerade som ägda
      </div>

      {(Object.entries(grouped) as [Category, typeof tracks][]).map(([category, categoryTracks]) => (
        <div key={category}>
          <h3 className="font-display text-sm font-semibold mb-2 text-text-secondary uppercase tracking-wider">
            {categoryLabels[category]}
          </h3>
          <div className="space-y-1">
            {categoryTracks.map((track) => {
              const owned = ownedTrackIds.includes(track.track_id)
              return (
                <label
                  key={track.track_id}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 cursor-pointer transition-colors',
                    owned ? 'bg-status-owned/10' : 'hover:bg-bg-hover'
                  )}
                >
                  <Checkbox
                    checked={owned || track.free_with_subscription}
                    disabled={track.free_with_subscription}
                    onChange={() => toggle(track.track_id)}
                  />
                  <span className="flex-1 text-sm">
                    {track.track_name}
                    {track.config_name && (
                      <span className="text-text-muted"> — {track.config_name}</span>
                    )}
                  </span>
                  {track.free_with_subscription ? (
                    <Badge variant="default">Gratis</Badge>
                  ) : (
                    <span className="text-xs text-text-muted">${track.price.toFixed(2)}</span>
                  )}
                </label>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
