// components/dashboard/my-series-widget.tsx
import Link from 'next/link'
import { makeTrackKey } from '@/lib/iracing/types'
import { getTrackPrice } from '@/lib/iracing/track-prices'
import type { IracingSeries } from '@/lib/iracing/types'

type TrackStatus = 'owned' | 'missing' | 'free'

function getTrackStatus(venue: string, config: string | null, ownedSet: Set<string>): TrackStatus {
  const key = makeTrackKey(venue, config)
  if (ownedSet.has(key)) return 'owned'
  if (getTrackPrice(key) === 0) return 'free'
  return 'missing'
}

const BADGE_STYLES: Record<TrackStatus, { label: string; color: string; bg: string }> = {
  owned: { label: 'Äger', color: '#50c878', bg: 'rgba(80,200,120,0.12)' },
  missing: { label: 'Saknar bana', color: '#ff6060', bg: 'rgba(255,80,80,0.1)' },
  free: { label: 'Inkluderad', color: '#60b8ff', bg: 'rgba(80,180,255,0.1)' },
}

const CATEGORY_LABELS: Record<string, string> = {
  SPORTS_CAR: 'Sports Car',
  FORMULA_CAR: 'Formula Car',
  OVAL: 'Oval',
  DIRT_ROAD: 'Dirt Road',
  DIRT_OVAL: 'Dirt Oval',
  UNRANKED: 'Unranked',
}

interface MySeriesWidgetProps {
  selectedSeries: IracingSeries[]
  ownedTrackKeys: string[]
  currentWeekIndex: number
}

export function MySeriesWidget({ selectedSeries, ownedTrackKeys, currentWeekIndex }: MySeriesWidgetProps) {
  const ownedSet = new Set(ownedTrackKeys)

  return (
    <div className="flex flex-col overflow-hidden min-h-0">
      <div className="flex shrink-0 items-center justify-between px-3.5 pb-2 pt-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Mina serier</span>
        <Link
          href="/setup"
          className="text-[10px] text-cyan-400/40 transition-colors hover:text-cyan-400/80"
        >
          Ändra urval →
        </Link>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto px-3.5 pb-3">
        {selectedSeries.map((s) => {
          const week = s.weeks[currentWeekIndex]
          const status = week ? getTrackStatus(week.venue, week.config, ownedSet) : 'owned'
          const badge = BADGE_STYLES[status]
          return (
            <div
              key={s.seriesName}
              className="shrink-0 rounded-md border px-2.5 py-2"
              style={{ borderColor: 'rgba(255,255,255,0.07)' }}
            >
              <div className="mb-1.5 flex items-start justify-between gap-2">
                <span className="text-[10px] font-semibold leading-snug text-white/60">{s.seriesName}</span>
                <span
                  className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold"
                  style={{ color: badge.color, background: badge.bg }}
                >
                  {badge.label}
                </span>
              </div>
              <div className="mb-1 flex flex-wrap gap-1">
                <span
                  className="rounded-[3px] border px-1.5 py-0.5 text-[9px] text-white/30"
                  style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.04)' }}
                >
                  {CATEGORY_LABELS[s.category] ?? s.category}
                </span>
                <span
                  className="rounded-[3px] border px-1.5 py-0.5 text-[9px] text-white/30"
                  style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.04)' }}
                >
                  {s.class}
                </span>
              </div>
              {week && (
                <div className="text-[9px] truncate" style={{ color: 'rgba(255,255,255,0.25)' }}>{week.track}</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
