import type { OwnershipStatus, SeasonSchedule, Track } from '@/lib/iracing/types'
import { PARTICIPATION_THRESHOLD } from '@/lib/iracing/types'

export function getOwnershipStatus(
  trackId: number,
  ownedTrackIds: number[],
  tracks: Track[]
): OwnershipStatus {
  const track = tracks.find((t) => t.track_id === trackId)
  if (track?.free_with_subscription) return 'free'
  if (ownedTrackIds.includes(trackId)) return 'owned'
  return 'missing'
}

export interface ScheduleAnalysis {
  ownedCount: number
  missingCount: number
  freeCount: number
  totalWeeks: number
  meetsThreshold: boolean
  missingTrackIds: number[]
}

export function analyzeSchedule(
  schedule: SeasonSchedule,
  ownedTrackIds: number[],
  tracks: Track[]
): ScheduleAnalysis {
  let ownedCount = 0
  let missingCount = 0
  let freeCount = 0
  const missingTrackIds: number[] = []

  for (const week of schedule.weeks) {
    const status = getOwnershipStatus(week.track_id, ownedTrackIds, tracks)
    if (status === 'owned') ownedCount++
    else if (status === 'free') freeCount++
    else {
      missingCount++
      missingTrackIds.push(week.track_id)
    }
  }

  const accessibleCount = ownedCount + freeCount

  return {
    ownedCount,
    missingCount,
    freeCount,
    totalWeeks: schedule.weeks.length,
    meetsThreshold: accessibleCount >= PARTICIPATION_THRESHOLD,
    missingTrackIds,
  }
}
