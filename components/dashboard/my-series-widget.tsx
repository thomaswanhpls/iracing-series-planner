// components/dashboard/my-series-widget.tsx
'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
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

const BADGE_COLORS: Record<TrackStatus, { color: string; bg: string }> = {
  owned:   { color: 'var(--color-accent-cyan)',    bg: 'var(--color-status-owned)' },
  missing: { color: 'var(--color-accent-magenta)', bg: 'var(--color-status-alert)' },
  free:    { color: 'var(--color-accent-green)',   bg: 'var(--color-status-free)'  },
}

type FocusState =
  | { kind: 'track'; key: string }
  | { kind: 'series'; name: string }
  | null

interface MySeriesWidgetProps {
  selectedSeries: IracingSeries[]
  ownedTrackKeys: string[]
  currentWeekIndex: number
  focus: FocusState
  onFocusSeries: (name: string) => void
}

export function MySeriesWidget({ selectedSeries, ownedTrackKeys, currentWeekIndex, focus, onFocusSeries }: MySeriesWidgetProps) {
  const t = useTranslations('dashboard.mySeries')
  const ownedSet = new Set(ownedTrackKeys)

  const statusLabels: Record<TrackStatus, string> = {
    owned:   t('statusOwned'),
    missing: t('statusMissing'),
    free:    t('statusIncluded'),
  }

  return (
    <div className="flex h-full flex-col min-h-0 max-md:h-auto">
      <div className="shrink-0 px-4 pb-2 pt-3">
        <span className="text-xs font-bold uppercase tracking-widest text-text-muted">{t('widgetTitle')}</span>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 pb-3 max-md:flex-none max-md:overflow-visible">
        {selectedSeries.map((s) => {
          const week = s.weeks[currentWeekIndex]
          const status = week ? getTrackStatus(week.venue, week.config, ownedSet) : 'owned'
          const colors = BADGE_COLORS[status]
          const isFocusedSeries = focus?.kind === 'series' && focus.name === s.seriesName
          const hasTrack = focus?.kind === 'track' && s.weeks.some(w => w && makeTrackKey(w.venue, w.config) === focus.key)
          const dimmed = focus !== null && !isFocusedSeries && !hasTrack
          return (
            <button
              key={s.seriesName}
              type="button"
              onClick={() => onFocusSeries(s.seriesName)}
              className={[
                'shrink-0 rounded-md border border-border-subtle px-3 py-2.5 transition-all text-left w-full',
                isFocusedSeries ? 'ring-1 ring-accent-cyan/70 bg-[rgba(0,232,224,0.06)]' : '',
                hasTrack ? 'ring-1 ring-accent-orange/60 bg-[rgba(255,140,0,0.05)]' : '',
                dimmed ? 'opacity-40' : '',
              ].join(' ')}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <span className="text-sm font-semibold leading-snug text-text-primary">{s.seriesName}</span>
                <span
                  className="shrink-0 rounded px-2 py-0.5 text-xs font-semibold"
                  style={{ color: colors.color, background: colors.bg }}
                >
                  {statusLabels[status]}
                </span>
              </div>
              <div className="mb-1.5 flex flex-wrap gap-1.5">
                <span className="rounded border border-border-subtle bg-bg-base px-2 py-0.5 text-xs text-text-secondary">
                  {t(`categories.${s.category}` as Parameters<typeof t>[0]) ?? s.category}
                </span>
                <span className="rounded border border-border-subtle bg-bg-base px-2 py-0.5 text-xs text-text-secondary">
                  {s.class}
                </span>
              </div>
              {week && (
                <div className="truncate text-xs text-text-secondary">{week.track}</div>
              )}
            </button>
          )
        })}
      </div>
      <Link
        href="/setup"
        className="group shrink-0 flex items-center justify-center gap-2 border-t border-[rgba(0,232,224,0.2)] py-3 text-sm font-medium text-accent-cyan transition-all hover:bg-[rgba(0,232,224,0.07)]"
      >
        {t('editSeries')}
        <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  )
}
