import { redirect } from 'next/navigation'
import { Car, MapPin } from 'lucide-react'
import { getSession } from '@/lib/auth/session'
import { fetchSelectedSeriesNames, fetchOwnedTrackKeys, fetchOwnedCarNames } from '@/lib/db/actions'
import { getAllSeries, CURRENT_SEASON } from '@/lib/iracing/season-data'
import { computeContentCost } from '@/lib/analysis/content-cost'

function formatTrackKey(key: string): string {
  const pipe = key.indexOf('|')
  if (pipe === -1) return key
  const venue = key.slice(0, pipe)
  const config = key.slice(pipe + 1)
  return config ? `${venue} — ${config}` : venue
}

export default async function CostsPage() {
  const session = await getSession()
  if (!session) redirect('/')

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

  const tracks = recommendations.filter((r) => r.item.type === 'track')

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mb-6">
        <h1 className="text-lg font-bold text-text-primary">Kostnadsanalys</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Baserat på {selectedSeries.length} valda serier för {CURRENT_SEASON}
        </p>
      </div>

      {/* Summary */}
      <div className="mb-6 rounded-lg border border-border-subtle bg-bg-glass p-5">
        <div className="text-4xl font-bold tabular-nums text-accent-orange">
          ${summary.totalAfterDiscount.toFixed(2)}
        </div>
        <div className="mt-1 text-sm text-text-secondary">
          {summary.trackCount} saknade banor · {summary.carCount} serier saknar bil
        </div>
        {summary.discountPercent > 0 && (
          <div className="mt-2 text-xs text-text-muted">
            {summary.discountTier}-rabatt {summary.discountPercent}% tillämpad
            (${summary.discountAmount.toFixed(2)})
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Missing tracks */}
        {tracks.length > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-text-muted">
              <MapPin size={12} />
              Saknade banor
            </div>
            <div className="flex flex-col gap-1.5">
              {tracks.map((rec) => (
                <div
                  key={rec.item.name}
                  className="flex items-center justify-between rounded-lg border border-border-subtle px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-text-primary">
                      {formatTrackKey(rec.item.name)}
                    </div>
                    <div className="text-xs text-text-secondary">
                      {rec.item.seriesCount} {rec.item.seriesCount === 1 ? 'serie' : 'serier'}
                    </div>
                  </div>
                  <span
                    className="ml-4 shrink-0 text-sm font-bold tabular-nums"
                    style={{ color: rec.item.price === 0 ? 'var(--color-accent-cyan)' : 'var(--color-accent-orange)' }}
                  >
                    {rec.item.price === 0 ? 'Inkl.' : `$${rec.item.price.toFixed(2)}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Series missing a car */}
        {missingCarBySeries.length > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-text-muted">
              <Car size={12} />
              Bil saknas
            </div>
            <div className="flex flex-col gap-1.5">
              {missingCarBySeries.map((entry) => (
                <div
                  key={entry.seriesName}
                  className="flex items-center justify-between rounded-lg border border-border-subtle px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-text-primary">{entry.seriesName}</div>
                    <div className="truncate text-xs text-text-secondary">{entry.cheapestCar}</div>
                  </div>
                  <span
                    className="ml-4 shrink-0 text-sm font-bold tabular-nums"
                    style={{ color: entry.price === 0 ? 'var(--color-accent-cyan)' : 'var(--color-accent-magenta)' }}
                  >
                    {entry.price === 0 ? 'Inkl.' : `$${entry.price.toFixed(2)}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tracks.length === 0 && missingCarBySeries.length === 0 && (
          <div className="text-sm text-text-secondary">Allt content ägt — inga inköp behövs ✓</div>
        )}
      </div>
    </div>
  )
}
