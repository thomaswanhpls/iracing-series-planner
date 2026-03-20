// components/dashboard/cost-widget.tsx
'use client'

import Link from 'next/link'
import { ArrowRight, Car, MapPin } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ContentCostSummary, ContentPurchaseRecommendation, MissingCarForSeries } from '@/lib/analysis/types'

type FocusState =
  | { kind: 'track'; key: string }
  | { kind: 'series'; name: string }
  | null

interface CostWidgetProps {
  summary: ContentCostSummary
  recommendations: ContentPurchaseRecommendation[]
  missingCarBySeries: MissingCarForSeries[]
  focus: FocusState
  onFocusTrack: (key: string) => void
  onFocusSeries: (name: string) => void
}

/** "Spa|Grand Prix" → "Spa — Grand Prix", "Spa|" → "Spa" */
function formatTrackKey(key: string): string {
  const pipe = key.indexOf('|')
  if (pipe === -1) return key
  const venue = key.slice(0, pipe)
  const config = key.slice(pipe + 1)
  return config ? `${venue} — ${config}` : venue
}

export function CostWidget({ summary, recommendations, missingCarBySeries, focus, onFocusTrack, onFocusSeries }: CostWidgetProps) {
  const t = useTranslations('dashboard.costs')
  const tracks = recommendations.filter((r) => r.item.type === 'track')

  return (
    <div className="flex h-full flex-col min-h-0 max-md:h-auto">
      <div className="shrink-0 px-4 pb-2 pt-3">
        <span className="text-xs font-bold uppercase tracking-widest text-text-muted">{t('widgetTitle')}</span>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-3 max-md:flex-none max-md:overflow-visible">
        {/* Total */}
        <div className="mb-4">
          <div className="text-3xl font-bold leading-none tabular-nums text-accent-orange">
            ${summary.totalAfterDiscount.toFixed(2)}
          </div>
          <div className="mt-1.5 text-xs text-text-secondary">
            {summary.trackCount} {t('tracks')} · {t('series', { count: summary.carCount })} {t('carMissing').toLowerCase()}
          </div>
        </div>

        {/* Missing tracks */}
        {tracks.length > 0 && (
          <div className="mb-3">
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-text-muted">
              <MapPin size={10} />
              {t('tracks')}
            </div>
            <div className="flex flex-col gap-1">
              {tracks.map((rec) => (
                <button
                  key={rec.item.name}
                  type="button"
                  onClick={() => onFocusTrack(rec.item.name)}
                  className={[
                    'flex items-center justify-between rounded-md border border-border-subtle px-3 py-2 cursor-pointer text-left w-full',
                    focus?.kind === 'track' && focus.key === rec.item.name
                      ? 'ring-1 ring-accent-cyan/60 bg-[rgba(0,232,224,0.07)]'
                      : '',
                  ].join(' ')}
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm text-text-primary">
                      {formatTrackKey(rec.item.name)}
                    </div>
                    {rec.item.seriesCount > 1 && (
                      <div className="text-xs text-text-secondary">{t('series', { count: rec.item.seriesCount })}</div>
                    )}
                  </div>
                  <span
                    className="ml-3 shrink-0 text-sm font-semibold tabular-nums"
                    title={rec.item.price === 0 ? 'Ingår i iRacing-prenumerationen' : undefined}
                    style={{ color: rec.item.price === 0 ? 'var(--color-accent-green)' : 'var(--color-accent-orange)' }}
                  >
                    {rec.item.price === 0 ? t('included') : `$${rec.item.price.toFixed(2)}`}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Series missing a car */}
        {missingCarBySeries.length > 0 && (
          <div>
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-text-muted">
              <Car size={10} />
              {t('carMissing')}
            </div>
            <div className="flex flex-col gap-1">
              {missingCarBySeries.map((entry) => (
                <button
                  key={entry.seriesName}
                  type="button"
                  onClick={() => onFocusSeries(entry.seriesName)}
                  className={[
                    'flex items-center justify-between rounded-md border border-border-subtle px-3 py-2 cursor-pointer text-left w-full',
                    focus?.kind === 'series' && focus.name === entry.seriesName
                      ? 'ring-1 ring-accent-cyan/60 bg-[rgba(0,232,224,0.07)]'
                      : '',
                  ].join(' ')}
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm text-text-primary">{entry.seriesName}</div>
                    <div className="truncate text-xs text-text-secondary">{entry.cheapestCar}</div>
                  </div>
                  <span
                    className="ml-3 shrink-0 text-sm font-semibold tabular-nums"
                    title={entry.price === 0 ? 'Ingår i iRacing-prenumerationen' : undefined}
                    style={{ color: entry.price === 0 ? 'var(--color-accent-green)' : 'var(--color-accent-magenta)' }}
                  >
                    {entry.price === 0 ? t('included') : `$${entry.price.toFixed(2)}`}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {tracks.length === 0 && missingCarBySeries.length === 0 && (
          <div className="text-sm text-text-muted">{t('allOwned')}</div>
        )}
      </div>
      <Link
        href="/dashboard/costs"
        className="group shrink-0 flex items-center justify-center gap-2 border-t border-[rgba(0,232,224,0.2)] py-3 text-sm font-medium text-accent-cyan transition-all hover:bg-[rgba(0,232,224,0.07)]"
      >
        {t('fullAnalysis')}
        <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  )
}
