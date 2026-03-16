'use client'

import type { SeasonSchedule, Track } from '@/lib/iracing/types'
import { analyzeSchedule } from '@/lib/ownership/utils'
import { PARTICIPATION_THRESHOLD } from '@/lib/iracing/types'
import { Card } from '@/components/ui/card'
import { MapPin, DollarSign, Trophy, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SummaryCardsProps {
  schedules: SeasonSchedule[]
  ownedTrackIds: number[]
  tracks: Track[]
  crossSeriesCounts: Map<number, number>
}

export function SummaryCards({ schedules, ownedTrackIds, tracks, crossSeriesCounts }: SummaryCardsProps) {
  // Aggregate stats
  const analyses = schedules.map((s) => analyzeSchedule(s, ownedTrackIds, tracks))

  const uniqueTrackIds = new Set(schedules.flatMap((s) => s.weeks.map((w) => w.track_id)))
  const uniqueOwned = [...uniqueTrackIds].filter((id) => {
    const track = tracks.find((t) => t.track_id === id)
    return track?.free_with_subscription || ownedTrackIds.includes(id)
  }).length

  const allMissingIds = new Set(analyses.flatMap((a) => a.missingTrackIds))
  const estimatedCost = [...allMissingIds].reduce((sum, id) => {
    const track = tracks.find((t) => t.track_id === id)
    return sum + (track?.price ?? 0)
  }, 0)

  const seriesMeetingThreshold = analyses.filter((a) => a.meetsThreshold).length

  // Best value: missing track appearing in most series
  let bestValueTrack: Track | null = null
  let bestValueCount = 0
  for (const [trackId, count] of crossSeriesCounts) {
    if (allMissingIds.has(trackId) && count > bestValueCount) {
      bestValueCount = count
      bestValueTrack = tracks.find((t) => t.track_id === trackId) ?? null
    }
  }

  const ownedPercent = uniqueTrackIds.size > 0 ? (uniqueOwned / uniqueTrackIds.size) * 100 : 0

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
      <Card>
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-status-owned/10">
            <MapPin className="h-5 w-5 text-status-owned" />
          </div>
          <div className="flex-1">
            <div className="font-display text-2xl font-bold">{uniqueOwned}<span className="text-sm text-text-muted">/{uniqueTrackIds.size}</span></div>
            <div className="text-xs text-text-secondary">banor tillgängliga</div>
          </div>
        </div>
        {/* Mini progress bar */}
        <div className="mt-3 h-1 w-full rounded-full bg-bg-elevated">
          <div
            className="h-full rounded-full bg-gradient-to-r from-status-owned to-status-owned/60 transition-all duration-500"
            style={{ width: `${ownedPercent}%` }}
          />
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-status-missing/10">
            <DollarSign className="h-5 w-5 text-status-missing" />
          </div>
          <div>
            <div className="font-display text-2xl font-bold">${estimatedCost.toFixed(0)}</div>
            <div className="text-xs text-text-secondary">uppskattad kostnad</div>
          </div>
        </div>
        <div className="mt-3 text-[10px] font-display text-text-muted">
          {allMissingIds.size} banor saknas
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-status-eligible/10">
            <Trophy className="h-5 w-5 text-status-eligible" />
          </div>
          <div>
            <div className="font-display text-2xl font-bold">
              {seriesMeetingThreshold}<span className="text-sm text-text-muted">/{schedules.length}</span>
            </div>
            <div className="text-xs text-text-secondary">serier ≥{PARTICIPATION_THRESHOLD}/12</div>
          </div>
        </div>
        <div className="mt-3 flex gap-1">
          {analyses.map((a, i) => (
            <div
              key={i}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-colors',
                a.meetsThreshold ? 'bg-status-eligible' : 'bg-bg-elevated'
              )}
            />
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-status-free/10">
            <Star className="h-5 w-5 text-status-free" />
          </div>
          <div className="min-w-0 flex-1">
            {bestValueTrack ? (
              <>
                <div className="font-display text-sm font-bold truncate">{bestValueTrack.track_name}</div>
                <div className="text-xs text-text-secondary">bästa köp — {bestValueCount} serier</div>
              </>
            ) : (
              <>
                <div className="font-display text-lg font-bold text-status-owned">Komplett!</div>
                <div className="text-xs text-text-secondary">inga saknade banor</div>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
