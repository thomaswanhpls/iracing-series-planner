import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Car, MapPin, TrendingDown } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Cost Analysis',
  description: 'Analyze track and car purchase costs for your iRacing season — volume discounts, recommendations, and savings.',
}
import { getSession } from '@/lib/auth/session'
import { fetchSelectedSeriesNames, fetchOwnedTrackKeys, fetchOwnedCarNames } from '@/lib/db/actions'
import { getAllSeries, CURRENT_SEASON } from '@/lib/iracing/season-data'
import { computeContentCost } from '@/lib/analysis/content-cost'
import { makeTrackKey } from '@/lib/iracing/types'
import { getTrackPrice } from '@/lib/iracing/track-prices'
import { getCarPrice } from '@/lib/iracing/car-prices'

function formatTrackKey(key: string): string {
  const pipe = key.indexOf('|')
  if (pipe === -1) return key
  const venue = key.slice(0, pipe)
  const config = key.slice(pipe + 1)
  return config ? `${venue} — ${config}` : venue
}

export default async function CostsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const session = await getSession()
  if (!session) redirect('/')
  const t = await getTranslations('dashboard.costs')

  const [selectedSeriesNames, ownedTrackKeys, ownedCarNames] = await Promise.all([
    fetchSelectedSeriesNames(session.userId, CURRENT_SEASON),
    fetchOwnedTrackKeys(session.userId),
    fetchOwnedCarNames(session.userId),
  ])

  const allSeries = getAllSeries()
  const selectedSeries = allSeries.filter((s) => selectedSeriesNames.includes(s.seriesName))
  const { summary, recommendations, missingCarBySeries } = computeContentCost({
    selectedSeries,
    ownedTrackKeys,
    ownedCarNames,
  })

  const ownedTrackSet = new Set(ownedTrackKeys)
  const ownedCarSet = new Set(ownedCarNames)

  // Build trackToSeries: which selected series need each missing track
  const trackToSeries = new Map<string, string[]>()
  for (const s of selectedSeries) {
    const seen = new Set<string>()
    for (const w of s.weeks) {
      const key = makeTrackKey(w.venue, w.config)
      if (!ownedTrackSet.has(key) && !seen.has(key)) {
        seen.add(key)
        const existing = trackToSeries.get(key) ?? []
        existing.push(s.seriesName)
        trackToSeries.set(key, existing)
      }
    }
  }

  // Build allCarsBySeries: for series where no car is owned, all cars sorted by price
  const allCarsBySeries: Array<{ seriesName: string; cars: Array<{ name: string; price: number }> }> = []
  for (const s of selectedSeries) {
    const carsThisSeries = new Set<string>(s.cars)
    for (const w of s.weeks) {
      if (w.weekCars) for (const car of w.weekCars) carsThisSeries.add(car)
    }
    const hasAnyCar = Array.from(carsThisSeries).some((car) => ownedCarSet.has(car))
    if (hasAnyCar) continue

    const cars = Array.from(carsThisSeries)
      .map((name) => ({ name, price: getCarPrice(name) }))
      .sort((a, b) => a.price - b.price)
    if (cars.length > 0) {
      allCarsBySeries.push({ seriesName: s.seriesName, cars })
    }
  }

  // Build perSeriesMissing: for each selected series with missing content
  interface SeriesMissingItem {
    seriesName: string
    missingTracks: Array<{ key: string; price: number }>
    cheapestCar: { name: string; price: number } | null
  }
  const perSeriesMissing: SeriesMissingItem[] = []
  for (const s of selectedSeries) {
    const seenTracks = new Set<string>()
    const missingTracks: Array<{ key: string; price: number }> = []
    for (const w of s.weeks) {
      const key = makeTrackKey(w.venue, w.config)
      if (!ownedTrackSet.has(key) && !seenTracks.has(key)) {
        seenTracks.add(key)
        missingTracks.push({ key, price: getTrackPrice(key) })
      }
    }

    const carsThisSeries = new Set<string>(s.cars)
    for (const w of s.weeks) {
      if (w.weekCars) for (const car of w.weekCars) carsThisSeries.add(car)
    }
    const hasAnyCar = Array.from(carsThisSeries).some((car) => ownedCarSet.has(car))
    let cheapestCar: { name: string; price: number } | null = null
    if (!hasAnyCar) {
      let minPrice = Infinity
      let minName = ''
      for (const car of carsThisSeries) {
        const p = getCarPrice(car)
        if (p < minPrice) { minPrice = p; minName = car }
      }
      if (minName) cheapestCar = { name: minName, price: minPrice }
    }

    if (missingTracks.length > 0 || cheapestCar !== null) {
      perSeriesMissing.push({ seriesName: s.seriesName, missingTracks, cheapestCar })
    }
  }

  // Tracks sorted by seriesCount desc (from recommendations)
  const priorityTracks = recommendations.filter((r) => r.item.type === 'track')

  return (
    <div className="h-full overflow-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-lg font-bold text-text-primary">{t('pageTitle')}</h1>
        <p className="mt-1 text-sm text-text-secondary">
          {t('pageSubtitle', { count: selectedSeries.length, season: CURRENT_SEASON })}
        </p>
      </div>

      {/* Summary */}
      <div className="mb-8 rounded-lg border border-border-subtle bg-bg-glass p-5">
        <div className="flex flex-wrap items-end gap-6">
          <div>
            <div className="text-4xl font-bold tabular-nums text-accent-orange">
              ${summary.totalAfterDiscount.toFixed(2)}
            </div>
            <div className="mt-1 text-sm text-text-secondary">
              {t('missingTracks', { count: summary.trackCount, trackWord: summary.trackCount === 1 ? t('track') : t('tracks_plural') })}
              {' · '}
              {t('missingCars', { count: summary.carCount, seriesWord: t('seriesWord') })}
            </div>
          </div>
          {summary.discountPercent > 0 && (
            <div className="flex items-center gap-2 rounded-md border border-border-subtle px-3 py-2 text-xs text-text-secondary">
              <TrendingDown size={12} className="text-accent-cyan" />
              <span>
                {t('discountApplied', { tier: summary.discountTier, percent: summary.discountPercent, amount: summary.discountAmount.toFixed(2) })}
              </span>
            </div>
          )}
        </div>
      </div>

      {priorityTracks.length === 0 && missingCarBySeries.length === 0 && (
        <div className="text-sm text-text-secondary">{t('allOwned')}</div>
      )}

      <div className="flex flex-col gap-10">
        {/* Köpprioritet — tracks sorted by seriesCount desc, with which series need each */}
        {priorityTracks.length > 0 && (
          <section>
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-text-muted">
              <MapPin size={12} />
              {t('purchasePriority')}
            </div>
            <div className="flex flex-col gap-2">
              {priorityTracks.map((rec) => {
                const seriesForTrack = trackToSeries.get(rec.item.name) ?? []
                return (
                  <div
                    key={rec.item.name}
                    className="rounded-lg border border-border-subtle bg-bg-glass px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-text-primary">
                          {formatTrackKey(rec.item.name)}
                        </div>
                        <div className="mt-0.5 text-xs text-text-secondary">
                          {rec.item.seriesCount === 1 ? t('seriesNeedOne') : t('seriesNeed', { count: rec.item.seriesCount })}
                        </div>
                      </div>
                      <span
                        className="shrink-0 text-sm font-bold tabular-nums"
                        style={{
                          color:
                            rec.item.price === 0 ? 'var(--color-accent-cyan)' : 'var(--color-accent-orange)',
                        }}
                      >
                        {rec.item.price === 0 ? t('included') : `$${rec.item.price.toFixed(2)}`}
                      </span>
                    </div>
                    {seriesForTrack.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {seriesForTrack.map((name) => (
                          <span
                            key={name}
                            className="rounded border border-border-subtle px-2 py-0.5 text-[10px] text-text-muted"
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Alla bilalternativ per serie — all cars sorted by price */}
        {allCarsBySeries.length > 0 && (
          <section>
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-text-muted">
              <Car size={12} />
              {t('allCarOptions')}
            </div>
            <div className="flex flex-col gap-3">
              {allCarsBySeries.map(({ seriesName, cars }) => (
                <div
                  key={seriesName}
                  className="rounded-lg border border-border-subtle bg-bg-glass px-4 py-3"
                >
                  <div className="mb-2 text-sm font-medium text-text-primary">{seriesName}</div>
                  <div className="flex flex-col gap-1">
                    {cars.map((car, i) => (
                      <div key={car.name} className="flex items-center justify-between gap-4">
                        <span className="text-xs text-text-secondary">
                          {i === 0 && (
                            <span className="mr-1.5 rounded bg-accent-green/10 px-1 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent-green">
                              {t('cheapest')}
                            </span>
                          )}
                          {car.name}
                        </span>
                        <span
                          className="shrink-0 text-xs font-bold tabular-nums"
                          style={{
                            color:
                              car.price === 0 ? 'var(--color-accent-green)' : 'var(--color-accent-orange)',
                          }}
                        >
                          {car.price === 0 ? t('included') : `$${car.price.toFixed(2)}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Per serie — compact view of what each series needs */}
        {perSeriesMissing.length > 0 && (
          <section>
            <div className="mb-3 text-xs font-bold uppercase tracking-widest text-text-muted">
              {t('perSeriesNeeds')}
            </div>
            <div className="flex flex-col gap-2">
              {perSeriesMissing.map(({ seriesName, missingTracks, cheapestCar }) => (
                <div
                  key={seriesName}
                  className="rounded-lg border border-border-subtle bg-bg-glass px-4 py-3"
                >
                  <div className="mb-2 text-sm font-medium text-text-primary">{seriesName}</div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {missingTracks.map(({ key, price }) => (
                      <span
                        key={key}
                        className="flex items-center gap-1 rounded-full border border-border-subtle px-2 py-0.5 text-[11px]"
                        style={{
                          borderColor:
                            price === 0 ? 'rgba(45,217,168,0.3)' : 'rgba(255,140,0,0.35)',
                          color:
                            price === 0 ? 'var(--color-accent-green)' : 'var(--color-accent-orange)',
                        }}
                      >
                        <MapPin size={9} />
                        {formatTrackKey(key)}
                        {price > 0 && (
                          <span className="ml-1 opacity-70">${price.toFixed(2)}</span>
                        )}
                      </span>
                    ))}
                    {cheapestCar && (
                      <span
                        className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]"
                        style={{
                          borderColor: 'rgba(255,45,138,0.3)',
                          color: 'var(--color-accent-magenta)',
                        }}
                      >
                        <Car size={9} />
                        {cheapestCar.name}
                        {cheapestCar.price > 0 && (
                          <span className="ml-1 opacity-70">${cheapestCar.price.toFixed(2)}</span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
