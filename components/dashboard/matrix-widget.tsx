// components/dashboard/matrix-widget.tsx
'use client'

import Link from 'next/link'
import { makeTrackKey } from '@/lib/iracing/types'
import { getTrackPrice } from '@/lib/iracing/track-prices'
import type { IracingSeries } from '@/lib/iracing/types'

type CellStatus = 'owned' | 'missing' | 'free'

function getStatus(venue: string, config: string | null, ownedSet: Set<string>): CellStatus {
  const key = makeTrackKey(venue, config)
  if (ownedSet.has(key)) return 'owned'
  if (getTrackPrice(key) === 0) return 'free'
  return 'missing'
}

const STATUS_CELL_BG: Record<CellStatus, string> = {
  owned:   'rgba(0,255,255,0.18)',
  missing: 'rgba(255,0,255,0.15)',
  free:    'rgba(255,140,0,0.18)',
}

const STATUS_LABELS: Record<CellStatus, string> = {
  owned:   'Äger',
  missing: 'Saknas',
  free:    'Inkl.',
}

interface MatrixWidgetProps {
  selectedSeries: IracingSeries[]
  ownedTrackKeys: string[]
  currentWeekIndex: number
}

export function MatrixWidget({ selectedSeries, ownedTrackKeys, currentWeekIndex }: MatrixWidgetProps) {
  const ownedSet = new Set(ownedTrackKeys)
  const allWeekIndices = (selectedSeries[0]?.weeks ?? []).map((_, i) => i)

  return (
    <div className="flex h-full flex-col min-h-0">
      <div className="flex shrink-0 items-center justify-between px-5 pb-2 pt-3">
        <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
          Track Matrix · v{currentWeekIndex + 1}
        </span>
        <Link
          href="/dashboard/matrix"
          className="text-xs text-accent-cyan/40 transition-colors hover:text-accent-cyan/80"
        >
          Full matris →
        </Link>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto px-5 pb-4">
        {/* Week column headers */}
        <div className="mb-1.5 flex pl-[180px] pr-1">
          {allWeekIndices.map((wi) => (
            <div
              key={wi}
              className="flex-1 text-center text-xs font-medium"
              style={{
                color: wi === currentWeekIndex ? 'var(--color-accent-cyan)' : 'var(--color-text-muted)',
                opacity: wi === currentWeekIndex ? 1 : 0.5,
              }}
            >
              {wi + 1}
            </div>
          ))}
        </div>

        {/* Series rows */}
        <div className="flex flex-col gap-1">
          {selectedSeries.map((s) => (
            <div key={s.seriesName} className="flex items-center">
              <span className="w-[180px] shrink-0 truncate pr-3 text-sm text-text-secondary">
                {s.seriesName}
              </span>
              <div className="flex flex-1 gap-0.5 pr-1">
                {allWeekIndices.map((wi) => {
                  const week = s.weeks[wi]
                  const isCurrent = wi === currentWeekIndex
                  if (!week) return (
                    <div
                      key={wi}
                      className="h-5 flex-1 rounded-[3px]"
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                    />
                  )
                  const status = getStatus(week.venue, week.config, ownedSet)
                  return (
                    <div
                      key={wi}
                      className="h-5 flex-1 rounded-[3px]"
                      style={{
                        background: STATUS_CELL_BG[status],
                        outline: isCurrent ? '2px solid var(--color-accent-cyan)' : undefined,
                        outlineOffset: isCurrent ? '-1px' : undefined,
                      }}
                      title={`v${wi + 1} · ${week.track} — ${STATUS_LABELS[status]}`}
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 flex gap-5">
          {[
            { label: 'Äger', bg: 'rgba(0,255,255,0.18)',  color: 'var(--color-accent-cyan)' },
            { label: 'Saknas', bg: 'rgba(255,0,255,0.15)', color: 'var(--color-accent-magenta)' },
            { label: 'Inkl.', bg: 'rgba(255,140,0,0.18)',  color: 'var(--color-accent-orange)' },
          ].map(({ label, bg, color }) => (
            <span key={label} className="flex items-center gap-2 text-xs">
              <span className="h-4 w-7 rounded-[3px]" style={{ background: bg }} />
              <span style={{ color }}>{label}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
