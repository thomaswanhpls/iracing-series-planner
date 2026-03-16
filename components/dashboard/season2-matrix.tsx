'use client'

import { useMemo } from 'react'
import { getOwnershipStatus } from '@/lib/ownership/utils'
import { matchSeason2TrackToCatalog } from '@/lib/analysis/season2-cost'
import type { Track } from '@/lib/iracing/types'
import type { SeasonSeries } from '@/lib/season-schedules/types'
import { TrackCell } from './track-cell'
import { cn } from '@/lib/utils'

interface Season2MatrixProps {
  selectedSeries: SeasonSeries[]
  tracks: Track[]
  ownedTrackIds: number[]
}

export function Season2Matrix({ selectedSeries, tracks, ownedTrackIds }: Season2MatrixProps) {
  const maxWeeks = useMemo(
    () => Math.max(0, ...selectedSeries.map((series) => series.weeks.length)),
    [selectedSeries]
  )
  const weekNumbers = Array.from({ length: maxWeeks }, (_, index) => index + 1)

  const crossSeriesCounts = useMemo(() => {
    const counts = new Map<number, number>()
    for (const series of selectedSeries) {
      for (const week of series.weeks) {
        const track = matchSeason2TrackToCatalog(week.track, tracks)
        if (!track) continue
        counts.set(track.track_id, (counts.get(track.track_id) ?? 0) + 1)
      }
    }
    return counts
  }, [selectedSeries, tracks])

  return (
    <div className="overflow-x-auto rounded-xl border border-border/40 bg-bg-surface/30 backdrop-blur-sm">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-[rgba(26,27,59,0.6)]">
            <th className="sticky left-0 z-10 min-w-[220px] border-r border-border/30 bg-[rgba(26,27,59,0.9)] px-4 py-3 text-left font-display text-[10px] font-medium uppercase tracking-widest text-text-muted backdrop-blur-sm">
              Serie
            </th>
            {weekNumbers.map((weekNumber) => (
              <th
                key={weekNumber}
                className="min-w-[145px] px-2 py-3 text-center font-display text-[10px] font-medium uppercase tracking-widest text-text-muted"
              >
                V{weekNumber}
              </th>
            ))}
            <th className="min-w-[70px] border-l border-border/30 px-3 py-3 text-center font-display text-[10px] font-medium uppercase tracking-widest text-text-muted">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {selectedSeries.map((series, rowIndex) => {
            const accessibleWeeks = series.weeks.reduce((count, week) => {
              const matchedTrack = matchSeason2TrackToCatalog(week.track, tracks)
              if (!matchedTrack) return count
              const status = getOwnershipStatus(matchedTrack.track_id, ownedTrackIds, tracks)
              return status === 'missing' ? count : count + 1
            }, 0)
            const percent = series.weeks.length > 0 ? (accessibleWeeks / series.weeks.length) * 100 : 0

            return (
              <tr
                key={series.id}
                className="border-t border-border/20 transition-colors hover:bg-white/[0.03]"
                style={{ animationDelay: `${rowIndex * 60}ms` }}
              >
                <td className="sticky left-0 z-10 border-r border-border/30 bg-bg-surface/90 px-4 py-2.5 backdrop-blur-sm">
                  <div className="font-display text-xs font-semibold whitespace-nowrap">{series.title}</div>
                  <div className="mt-1.5 h-0.5 w-full rounded-full bg-bg-elevated">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        accessibleWeeks >= 8
                          ? 'bg-gradient-to-r from-status-owned to-status-owned/50'
                          : 'bg-gradient-to-r from-status-missing to-status-missing/50'
                      )}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </td>
                {weekNumbers.map((weekNumber) => {
                  const week = series.weeks[weekNumber - 1]
                  if (!week) return <td key={`${series.id}-week-${weekNumber}`} className="px-1 py-1.5" />

                  const matchedTrack = matchSeason2TrackToCatalog(week.track, tracks)
                  if (!matchedTrack) {
                    return (
                      <td key={`${series.id}-week-${weekNumber}`} className="px-1 py-1.5">
                        <div className="truncate rounded-md border border-border/50 bg-[rgba(26,27,59,0.3)] px-2 py-1.5 text-xs text-text-muted">
                          {week.track}
                        </div>
                      </td>
                    )
                  }

                  const status = getOwnershipStatus(matchedTrack.track_id, ownedTrackIds, tracks)
                  const crossCount = crossSeriesCounts.get(matchedTrack.track_id) ?? 0

                  return (
                    <td key={`${series.id}-week-${weekNumber}`} className="px-1 py-1.5">
                      <TrackCell
                        trackName={matchedTrack.track_name}
                        configName={matchedTrack.config_name}
                        status={status}
                        price={matchedTrack.price}
                        crossSeriesCount={crossCount}
                      />
                    </td>
                  )
                })}
                <td className="border-l border-border/30 px-3 py-2.5 text-center">
                  <span className="font-display text-xs font-bold">
                    {accessibleWeeks}/{series.weeks.length}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
