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
  owned: {
    label: 'Äger',
    color: 'var(--color-accent-cyan)',
    bg: 'var(--color-status-owned)',
  },
  missing: {
    label: 'Saknar bana',
    color: 'var(--color-accent-magenta)',
    bg: 'var(--color-status-alert)',
  },
  free: {
    label: 'Inkluderad',
    color: 'var(--color-accent-green)',
    bg: 'var(--color-status-free)',
  },
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
    <div className="flex h-full flex-col min-h-0">
      <div className="flex shrink-0 items-center justify-between px-4 pb-2 pt-3">
        <span className="text-xs font-bold uppercase tracking-widest text-text-muted">Mina serier</span>
        <Link
          href="/setup"
          className="text-xs text-accent-cyan/60 transition-colors hover:text-accent-cyan/80"
        >
          Ändra urval →
        </Link>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 pb-3">
        {selectedSeries.map((s) => {
          const week = s.weeks[currentWeekIndex]
          const status = week ? getTrackStatus(week.venue, week.config, ownedSet) : 'owned'
          const badge = BADGE_STYLES[status]
          return (
            <div
              key={s.seriesName}
              className="shrink-0 rounded-md border border-border-subtle px-3 py-2.5"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <span className="text-sm font-semibold leading-snug text-text-primary">{s.seriesName}</span>
                <span
                  className="shrink-0 rounded px-2 py-0.5 text-xs font-semibold"
                  style={{ color: badge.color, background: badge.bg }}
                >
                  {badge.label}
                </span>
              </div>
              <div className="mb-1.5 flex flex-wrap gap-1.5">
                <span className="rounded border border-border-subtle bg-bg-base px-2 py-0.5 text-xs text-text-secondary">
                  {CATEGORY_LABELS[s.category] ?? s.category}
                </span>
                <span className="rounded border border-border-subtle bg-bg-base px-2 py-0.5 text-xs text-text-secondary">
                  {s.class}
                </span>
              </div>
              {week && (
                <div className="truncate text-xs text-text-secondary">{week.track}</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
