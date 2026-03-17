import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { fetchSelectedSeriesNames, fetchOwnedTrackKeys } from '@/lib/db/actions'
import { getAllSeries, CURRENT_SEASON } from '@/lib/iracing/season-data'
import { getCurrentWeekIndex } from '@/lib/iracing/current-week'
import { makeTrackKey } from '@/lib/iracing/types'
import { getTrackPrice } from '@/lib/iracing/track-prices'

type CellStatus = 'owned' | 'missing' | 'free'

function getStatus(venue: string, config: string | null, ownedSet: Set<string>): CellStatus {
  const key = makeTrackKey(venue, config)
  if (ownedSet.has(key)) return 'owned'
  if (getTrackPrice(key) === 0) return 'free'
  return 'missing'
}

const CELL_BG: Record<CellStatus, string> = {
  owned:   'rgba(0,255,255,0.18)',
  missing: 'rgba(255,0,255,0.15)',
  free:    'rgba(255,140,0,0.18)',
}

export default async function MatrixPage() {
  const session = await getSession()
  if (!session) redirect('/')

  const [selectedSeriesNames, ownedTrackKeys] = await Promise.all([
    fetchSelectedSeriesNames(session.userId, CURRENT_SEASON),
    fetchOwnedTrackKeys(session.userId),
  ])

  const allSeries = getAllSeries()
  const selectedSeries = allSeries.filter((s) => selectedSeriesNames.includes(s.seriesName))
  const ownedSet = new Set(ownedTrackKeys)
  const currentWeekIndex = selectedSeries[0]
    ? getCurrentWeekIndex(selectedSeries[0].weeks)
    : 0

  const allWeekIndices = (selectedSeries[0]?.weeks ?? []).map((_, i) => i)

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mb-6">
        <h1 className="text-lg font-bold text-text-primary">Track Matrix</h1>
        <p className="mt-1 text-sm text-text-secondary">
          {selectedSeries.length} serier · vecka {currentWeekIndex + 1} markerad
        </p>
      </div>

      <div className="overflow-x-auto">
        {/* Week column headers */}
        <div className="mb-2 flex pl-[220px] pr-1">
          {allWeekIndices.map((wi) => (
            <div
              key={wi}
              className="flex-1 text-center text-xs font-medium"
              style={{
                color: wi === currentWeekIndex ? 'var(--color-accent-cyan)' : 'var(--color-text-muted)',
              }}
            >
              {wi + 1}
            </div>
          ))}
        </div>

        {/* Series rows */}
        <div className="flex flex-col gap-1.5">
          {selectedSeries.map((s) => (
            <div key={s.seriesName} className="flex items-center">
              <span className="w-[220px] shrink-0 truncate pr-4 text-sm text-text-primary">
                {s.seriesName}
              </span>
              <div className="flex flex-1 gap-0.5 pr-1">
                {allWeekIndices.map((wi) => {
                  const week = s.weeks[wi]
                  if (!week) return (
                    <div
                      key={wi}
                      className="h-6 flex-1 rounded-sm"
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                    />
                  )
                  const status = getStatus(week.venue, week.config, ownedSet)
                  return (
                    <div
                      key={wi}
                      className="h-6 flex-1 rounded-sm"
                      style={{
                        background: CELL_BG[status],
                        outline: wi === currentWeekIndex ? '2px solid var(--color-accent-cyan)' : undefined,
                        outlineOffset: wi === currentWeekIndex ? '-1px' : undefined,
                      }}
                      title={`v${wi + 1} · ${week.track}`}
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 flex gap-6">
          {[
            { label: 'Äger', bg: 'rgba(0,255,255,0.18)',  color: 'var(--color-accent-cyan)' },
            { label: 'Saknas', bg: 'rgba(255,0,255,0.15)', color: 'var(--color-accent-magenta)' },
            { label: 'Inkl.', bg: 'rgba(255,140,0,0.18)',  color: 'var(--color-accent-orange)' },
          ].map(({ label, bg, color }) => (
            <span key={label} className="flex items-center gap-2 text-sm">
              <span className="h-4 w-8 rounded-sm" style={{ background: bg }} />
              <span style={{ color }}>{label}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
