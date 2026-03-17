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

// Mini-matrix cell backgrounds — subtle tints aligned to design system accents
const STATUS_CELL_BG: Record<CellStatus, string> = {
  owned: 'rgba(0,255,255,0.18)',   // cyan — accent-cyan
  missing: 'rgba(255,0,255,0.15)', // magenta — accent-magenta
  free: 'rgba(255,140,0,0.18)',    // orange — accent-orange
}
const STATUS_LABELS: Record<CellStatus, string> = {
  owned: 'Äger',
  missing: 'Saknas',
  free: 'Inkl.',
}
const STATUS_DOT: Record<CellStatus, string> = {
  owned: 'var(--color-accent-cyan)',
  missing: 'var(--color-accent-magenta)',
  free: 'var(--color-accent-orange)',
}

interface MatrixWidgetProps {
  selectedSeries: IracingSeries[]
  ownedTrackKeys: string[]
  currentWeekIndex: number
}

export function MatrixWidget({ selectedSeries, ownedTrackKeys, currentWeekIndex }: MatrixWidgetProps) {
  const ownedSet = new Set(ownedTrackKeys)
  const upcomingWeekIndices = (selectedSeries[0]?.weeks ?? [])
    .map((_, i) => i)
    .filter((i) => i > currentWeekIndex)
    .slice(0, 8)

  return (
    <div className="flex h-full flex-col min-h-0">
      <div className="flex shrink-0 items-center justify-between px-4 pb-2 pt-3">
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
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 pb-3">
        {/* This week */}
        <div>
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-text-muted/60">
            Denna vecka
          </div>
          <div className="flex flex-col gap-1">
            {selectedSeries.map((s) => {
              const week = s.weeks[currentWeekIndex]
              if (!week) return null
              const status = getStatus(week.venue, week.config, ownedSet)
              return (
                <div
                  key={s.seriesName}
                  className="flex items-center gap-2.5 rounded-md border border-border-subtle px-3 py-2"
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: STATUS_DOT[status] }}
                  />
                  <div className="flex flex-1 min-w-0 flex-col gap-0.5">
                    <span className="truncate text-sm text-text-secondary">{s.seriesName}</span>
                    <span className="truncate text-xs text-text-muted">{week.track}</span>
                  </div>
                  <span className="shrink-0 text-xs font-semibold" style={{ color: STATUS_DOT[status] }}>
                    {STATUS_LABELS[status]}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Upcoming weeks mini-matrix */}
        {upcomingWeekIndices.length > 0 && (
          <div>
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-text-muted/60">
              Kommande veckor
            </div>
            {/* Week labels */}
            <div className="mb-1 flex gap-0.5 pl-[120px]">
              {upcomingWeekIndices.map((wi) => (
                <div key={wi} className="w-5 text-center text-[10px] text-text-muted/40">
                  v{wi + 1}
                </div>
              ))}
            </div>
            {/* Rows */}
            {selectedSeries.map((s) => (
              <div key={s.seriesName} className="mb-0.5 flex items-center gap-0.5">
                <span className="w-[116px] shrink-0 truncate text-xs text-text-muted">{s.seriesName}</span>
                {upcomingWeekIndices.map((wi) => {
                  const week = s.weeks[wi]
                  if (!week) return <div key={wi} className="h-3 w-5 rounded-[2px]" />
                  const status = getStatus(week.venue, week.config, ownedSet)
                  return (
                    <div
                      key={wi}
                      className="h-3 w-5 shrink-0 rounded-[2px]"
                      style={{ background: STATUS_CELL_BG[status] }}
                      title={`${week.track} — ${STATUS_LABELS[status]}`}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
