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

const STATUS_COLORS: Record<CellStatus, string> = {
  owned: 'rgba(80,200,120,0.35)',
  missing: 'rgba(255,80,80,0.3)',
  free: 'rgba(80,180,255,0.25)',
}
const STATUS_LABELS: Record<CellStatus, string> = {
  owned: 'Äger',
  missing: 'Saknas',
  free: 'Inkl.',
}
const STATUS_TEXT: Record<CellStatus, string> = {
  owned: '#50c878',
  missing: '#ff6060',
  free: '#60b8ff',
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
    <div className="flex flex-col overflow-hidden min-h-0">
      <div className="flex shrink-0 items-center justify-between px-3.5 pb-2 pt-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
          Track Matrix · v{currentWeekIndex + 1}
        </span>
        <Link
          href="/dashboard/matrix"
          className="text-[10px] text-cyan-400/40 transition-colors hover:text-cyan-400/80"
        >
          Full matris →
        </Link>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-3.5 pb-3">
        {/* This week */}
        <div>
          <div className="mb-1.5 text-[9px] font-semibold uppercase tracking-widest text-white/25">
            Denna vecka
          </div>
          <div className="flex flex-col gap-[3px]">
            {selectedSeries.map((s) => {
              const week = s.weeks[currentWeekIndex]
              if (!week) return null
              const status = getStatus(week.venue, week.config, ownedSet)
              return (
                <div
                  key={s.seriesName}
                  className="flex items-center gap-2 rounded px-2 py-1.5"
                  style={{ background: 'rgba(255,255,255,0.025)' }}
                >
                  <span
                    className="h-[7px] w-[7px] shrink-0 rounded-full"
                    style={{ background: STATUS_TEXT[status] }}
                  />
                  <div className="flex flex-1 min-w-0 flex-col">
                    <span className="truncate text-[10px] text-white/50">{s.seriesName}</span>
                    <span className="truncate text-[9px] text-white/30">{week.track}</span>
                  </div>
                  <span className="shrink-0 text-[9px] font-semibold" style={{ color: STATUS_TEXT[status] }}>
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
            <div className="mb-1.5 text-[9px] font-semibold uppercase tracking-widest text-white/25">
              Kommande veckor
            </div>
            {/* Week labels */}
            <div className="mb-1 flex gap-[2px] pl-[108px]">
              {upcomingWeekIndices.map((wi) => (
                <div key={wi} className="w-4 text-center text-[8px] text-white/20">
                  v{wi + 1}
                </div>
              ))}
            </div>
            {/* Rows */}
            {selectedSeries.map((s) => (
              <div key={s.seriesName} className="mb-[2px] flex items-center gap-[2px]">
                <span className="w-[104px] shrink-0 truncate text-[9px] text-white/30">{s.seriesName}</span>
                {upcomingWeekIndices.map((wi) => {
                  const week = s.weeks[wi]
                  if (!week) return <div key={wi} className="h-[10px] w-4 rounded-[2px]" />
                  const status = getStatus(week.venue, week.config, ownedSet)
                  return (
                    <div
                      key={wi}
                      className="h-[10px] w-4 shrink-0 rounded-[2px]"
                      style={{ background: STATUS_COLORS[status] }}
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
