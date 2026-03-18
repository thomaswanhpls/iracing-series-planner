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

const BADGE_STYLE: Record<CellStatus, { bg: string; color: string; label: string }> = {
  owned:   { bg: 'rgba(0,255,255,0.15)',   color: 'var(--color-accent-cyan)',    label: 'Äger' },
  missing: { bg: 'rgba(255,0,255,0.12)',   color: 'var(--color-accent-magenta)', label: 'Saknas' },
  free:    { bg: 'rgba(255,140,0,0.15)',   color: 'var(--color-accent-orange)',  label: 'Inkl.' },
}

function formatWeekDate(startDate: string): string {
  const d = new Date(startDate + 'T12:00:00Z')
  return d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })
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
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-lg font-bold text-text-primary">Track Matrix</h1>
        <p className="mt-1 text-sm text-text-secondary">
          {selectedSeries.length} serier · vecka {currentWeekIndex + 1} markerad · {CURRENT_SEASON}
        </p>
      </div>

      {/* "Denna vecka" panel */}
      {selectedSeries.length > 0 && (
        <section className="mb-8">
          <div className="mb-3 text-xs font-bold uppercase tracking-widest text-text-muted">
            Denna vecka (v{currentWeekIndex + 1})
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {selectedSeries.map((s) => {
              const week = s.weeks[currentWeekIndex]
              if (!week) return null
              const status = getStatus(week.venue, week.config, ownedSet)
              const badge = BADGE_STYLE[status]
              return (
                <div
                  key={s.seriesName}
                  className="rounded-lg border border-border-subtle bg-bg-glass px-4 py-3"
                >
                  <div className="mb-1.5 truncate text-sm font-medium text-text-primary">
                    {s.seriesName}
                  </div>
                  <div className="mb-2 truncate text-xs text-text-secondary">
                    {week.config ? `${week.venue} — ${week.config}` : week.venue}
                  </div>
                  <span
                    className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                    style={{ background: badge.bg, color: badge.color }}
                  >
                    {badge.label}
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Matrix table */}
      <div className="overflow-x-auto">
        {/* Week column headers with dates */}
        <div className="mb-2 flex pl-[220px] pr-1">
          {allWeekIndices.map((wi) => {
            const week = selectedSeries[0]?.weeks[wi]
            const isCurrent = wi === currentWeekIndex
            return (
              <div
                key={wi}
                className="flex flex-1 flex-col items-center"
                style={{ color: isCurrent ? 'var(--color-accent-cyan)' : 'var(--color-text-muted)' }}
              >
                <span className="text-xs font-medium">{wi + 1}</span>
                {week?.startDate && (
                  <span className="mt-0.5 text-[9px] leading-none opacity-70">
                    {formatWeekDate(week.startDate)}
                  </span>
                )}
              </div>
            )
          })}
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
                      className="h-10 flex-1 overflow-hidden rounded-sm"
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                    />
                  )
                  const status = getStatus(week.venue, week.config, ownedSet)
                  return (
                    <div
                      key={wi}
                      className="relative h-10 flex-1 overflow-hidden rounded-sm"
                      style={{
                        background: CELL_BG[status],
                        outline: wi === currentWeekIndex ? '2px solid var(--color-accent-cyan)' : undefined,
                        outlineOffset: wi === currentWeekIndex ? '-1px' : undefined,
                      }}
                      title={`v${wi + 1} · ${week.track}`}
                    >
                      <span className="absolute inset-x-0 bottom-0 truncate px-1 pb-0.5 text-[10px] leading-tight text-white/70">
                        {week.venue}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 flex gap-6">
          {[
            { label: 'Äger',   bg: 'rgba(0,255,255,0.18)',  color: 'var(--color-accent-cyan)' },
            { label: 'Saknas', bg: 'rgba(255,0,255,0.15)',  color: 'var(--color-accent-magenta)' },
            { label: 'Inkl.',  bg: 'rgba(255,140,0,0.18)',  color: 'var(--color-accent-orange)' },
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
