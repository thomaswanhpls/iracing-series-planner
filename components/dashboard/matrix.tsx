'use client'

import { useMemo } from 'react'
import type { SeasonSchedule, Track } from '@/lib/iracing/types'
import { getSeriesById, getTrackById } from '@/lib/iracing/data-provider'
import { getOwnershipStatus, analyzeSchedule } from '@/lib/ownership/utils'
import { useOwnership } from '@/lib/ownership/context'
import { TrackCell } from './track-cell'
import { cn } from '@/lib/utils'

interface MatrixProps {
  schedules: SeasonSchedule[]
  tracks: Track[]
  crossSeriesCounts: Map<number, number>
}

export function Matrix({ schedules, tracks, crossSeriesCounts }: MatrixProps) {
  const { ownedTrackIds } = useOwnership()

  const weekNumbers = Array.from({ length: 12 }, (_, i) => i + 1)

  return (
    <div className="overflow-x-auto rounded-xl border border-border/40 bg-bg-surface/30 backdrop-blur-sm">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-[rgba(26,27,59,0.6)]">
            <th className="sticky left-0 z-10 bg-[rgba(26,27,59,0.9)] backdrop-blur-sm px-4 py-3 text-left font-display text-[10px] font-medium uppercase tracking-widest text-text-muted min-w-[180px] border-r border-border/30">
              Serie
            </th>
            {weekNumbers.map((w) => (
              <th
                key={w}
                className="px-2 py-3 text-center font-display text-[10px] font-medium uppercase tracking-widest text-text-muted min-w-[145px]"
              >
                V{w}
              </th>
            ))}
            <th className="px-3 py-3 text-center font-display text-[10px] font-medium uppercase tracking-widest text-text-muted min-w-[70px] border-l border-border/30">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {schedules.map((schedule, rowIdx) => {
            const seriesInfo = getSeriesById(schedule.series_id)
            const analysis = analyzeSchedule(schedule, ownedTrackIds, tracks)
            const accessibleCount = analysis.ownedCount + analysis.freeCount
            const percent = (accessibleCount / analysis.totalWeeks) * 100

            return (
              <tr
                key={schedule.series_id}
                className="border-t border-border/20 transition-colors hover:bg-white/[0.03]"
                style={{ animationDelay: `${rowIdx * 60}ms` }}
              >
                <td className="sticky left-0 z-10 bg-bg-surface/90 backdrop-blur-sm px-4 py-2.5 border-r border-border/30">
                  <div className="font-display text-xs font-semibold whitespace-nowrap">
                    {seriesInfo?.series_name ?? `Serie ${schedule.series_id}`}
                  </div>
                  {/* Mini progress bar under series name */}
                  <div className="mt-1.5 h-0.5 w-full rounded-full bg-bg-elevated">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        analysis.meetsThreshold
                          ? 'bg-gradient-to-r from-status-owned to-status-owned/50'
                          : 'bg-gradient-to-r from-status-missing to-status-missing/50'
                      )}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </td>
                {schedule.weeks.map((week) => {
                  const track = getTrackById(week.track_id)
                  const status = getOwnershipStatus(week.track_id, ownedTrackIds, tracks)
                  const crossCount = crossSeriesCounts.get(week.track_id) ?? 0

                  return (
                    <td key={week.week_num} className="px-1 py-1.5">
                      {track && (
                        <TrackCell
                          trackName={track.track_name}
                          configName={track.config_name}
                          status={status}
                          price={track.price}
                          crossSeriesCount={crossCount}
                        />
                      )}
                    </td>
                  )
                })}
                <td className="px-3 py-2.5 text-center border-l border-border/30">
                  <div
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1',
                      analysis.meetsThreshold
                        ? 'bg-status-owned/10 text-status-owned'
                        : 'bg-status-missing/10 text-status-missing'
                    )}
                  >
                    <div className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      analysis.meetsThreshold ? 'bg-status-owned' : 'bg-status-missing'
                    )} />
                    <span className="font-display text-xs font-bold">
                      {accessibleCount}/{analysis.totalWeeks}
                    </span>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
