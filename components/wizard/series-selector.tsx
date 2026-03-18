'use client'

import { useState } from 'react'
import type { Category, Series } from '@/lib/iracing/types'
import { getSeasonSchedule } from '@/lib/iracing/data-provider'
import { analyzeSchedule } from '@/lib/ownership/utils'
import { useOwnership } from '@/lib/ownership/context'
import { getAllTracks } from '@/lib/iracing/data-provider'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface SeriesSelectorProps {
  series: Series[]
  selectedCategories: Category[]
  selectedSeriesIds: number[]
  onToggleSeries: (seriesId: number) => void
}

export function SeriesSelector({
  series,
  selectedCategories,
  selectedSeriesIds,
  onToggleSeries,
}: SeriesSelectorProps) {
  const [search, setSearch] = useState('')
  const { ownedTrackIds } = useOwnership()
  const tracks = getAllTracks()

  const searchLower = search.trim().toLowerCase()
  const filtered = series.filter((s) => {
    if (selectedCategories.length > 0 && !selectedCategories.includes(s.category)) return false
    if (searchLower && !(s.series_name ?? '').toLowerCase().includes(searchLower)) return false
    return true
  })

  return (
    <div className="space-y-3">
      <h3 className="font-display text-lg font-semibold">Välj serier</h3>
      <Input
        placeholder="Sök serier..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((s) => {
          const schedule = getSeasonSchedule(s.series_id)
          const analysis = schedule
            ? analyzeSchedule(schedule, ownedTrackIds, tracks)
            : null
          const selected = selectedSeriesIds.includes(s.series_id)
          const accessibleCount = analysis
            ? analysis.ownedCount + analysis.freeCount
            : 0

          return (
            <button
              key={s.series_id}
              onClick={() => onToggleSeries(s.series_id)}
              className={cn(
                'group relative flex flex-col gap-3 rounded-xl border p-4 text-left transition-all duration-200',
                selected
                  ? 'border-accent-primary/40 bg-accent-primary/5 shadow-[0_0_20px_rgba(233,69,96,0.08)]'
                  : 'border-border/40 bg-bg-surface/60 hover:border-accent-primary/20 hover:bg-bg-surface/80'
              )}
            >
              {/* Selected glow indicator */}
              {selected && (
                <div className="absolute -top-px left-4 right-4 h-px bg-gradient-to-r from-transparent via-accent-primary/50 to-transparent" />
              )}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-display text-sm font-semibold">{s.series_name}</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge variant={s.category === 'road' ? 'road' : s.category === 'oval' ? 'oval' : 'default'}>
                      {(s.category ?? '').replace('_', ' ')}
                    </Badge>
                    <Badge variant={s.license_group as 'rookie' | 'd' | 'c' | 'b' | 'a' | 'pro'}>
                      {(s.license_group ?? '').toUpperCase()}
                    </Badge>
                    {s.fixed_setup && <Badge>Fixed</Badge>}
                  </div>
                </div>
                <Checkbox
                  checked={selected}
                  onChange={() => onToggleSeries(s.series_id)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              {analysis && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-text-secondary">{accessibleCount}/{analysis.totalWeeks} banor</span>
                    {analysis.meetsThreshold && (
                      <span className="font-display text-[10px] font-bold text-status-owned">8/12</span>
                    )}
                  </div>
                  <div className="h-1 w-full rounded-full bg-bg-elevated/80">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        analysis.meetsThreshold
                          ? 'bg-gradient-to-r from-status-owned to-status-owned/60'
                          : 'bg-gradient-to-r from-accent-primary to-accent-primary/60'
                      )}
                      style={{
                        width: `${analysis.totalWeeks > 0 ? (accessibleCount / analysis.totalWeeks) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
