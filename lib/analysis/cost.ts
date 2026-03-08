import type { SeasonSchedule, Track } from '@/lib/iracing/types'
import { PARTICIPATION_THRESHOLD } from '@/lib/iracing/types'
import { getOwnershipStatus } from '@/lib/ownership/utils'
import type { PurchaseRecommendation, CostSummary } from './types'

export function getUniqueMissingTracks(
  schedules: SeasonSchedule[],
  ownedTrackIds: number[],
  tracks: Track[]
): Track[] {
  const missingIds = new Set<number>()
  for (const schedule of schedules) {
    for (const week of schedule.weeks) {
      const status = getOwnershipStatus(week.track_id, ownedTrackIds, tracks)
      if (status === 'missing') {
        missingIds.add(week.track_id)
      }
    }
  }
  return [...missingIds]
    .map((id) => tracks.find((t) => t.track_id === id))
    .filter((t): t is Track => t != null)
}

export function getDiscountTier(itemCount: number): { tier: string; percent: number } {
  if (itemCount >= 40) return { tier: '40+', percent: 20 }
  if (itemCount >= 6) return { tier: '6+', percent: 15 }
  if (itemCount >= 3) return { tier: '3-5', percent: 10 }
  return { tier: 'Ingen', percent: 0 }
}

export function calculateCostSummary(missingTracks: Track[]): CostSummary {
  const totalBeforeDiscount = missingTracks.reduce((sum, t) => sum + t.price, 0)
  const { tier, percent } = getDiscountTier(missingTracks.length)
  const discountAmount = totalBeforeDiscount * (percent / 100)

  return {
    totalBeforeDiscount,
    discountTier: tier,
    discountPercent: percent,
    discountAmount,
    totalAfterDiscount: totalBeforeDiscount - discountAmount,
    trackCount: missingTracks.length,
  }
}

export function rankByValue(
  missingTracks: Track[],
  schedules: SeasonSchedule[],
  ownedTrackIds: number[],
  tracks: Track[]
): PurchaseRecommendation[] {
  const missingIds = new Set(missingTracks.map((t) => t.track_id))

  // For each missing track, count how many series-weeks it covers
  const trackScores = new Map<number, { score: number; seriesIds: Set<number> }>()

  for (const schedule of schedules) {
    for (const week of schedule.weeks) {
      if (missingIds.has(week.track_id)) {
        const existing = trackScores.get(week.track_id) ?? { score: 0, seriesIds: new Set() }
        existing.score++
        existing.seriesIds.add(schedule.series_id)
        trackScores.set(week.track_id, existing)
      }
    }
  }

  // Sort by score descending
  const ranked = missingTracks
    .map((track) => {
      const info = trackScores.get(track.track_id) ?? { score: 0, seriesIds: new Set() }
      return {
        track,
        score: info.score,
        seriesCovered: [...info.seriesIds],
        cumulativeCost: 0,
      }
    })
    .sort((a, b) => b.score - a.score)

  // Calculate cumulative cost
  let running = 0
  for (const rec of ranked) {
    running += rec.track.price
    rec.cumulativeCost = running
  }

  return ranked
}

export function findMinimumPurchaseSet(
  schedules: SeasonSchedule[],
  ownedTrackIds: number[],
  tracks: Track[]
): PurchaseRecommendation[] {
  // Greedy: keep picking the missing track that covers the most
  // series-weeks until all series meet 8/12 threshold
  const purchased = new Set<number>()
  const result: PurchaseRecommendation[] = []
  const simulatedOwned = [...ownedTrackIds]

  const allMissing = getUniqueMissingTracks(schedules, ownedTrackIds, tracks)
  const missingIds = new Set(allMissing.map((t) => t.track_id))

  let running = 0

  for (let iteration = 0; iteration < allMissing.length; iteration++) {
    // Check if all series already meet threshold
    const allMet = schedules.every((schedule) => {
      const accessible = schedule.weeks.filter((w) => {
        const track = tracks.find((t) => t.track_id === w.track_id)
        return (
          track?.free_with_subscription ||
          simulatedOwned.includes(w.track_id)
        )
      }).length
      return accessible >= PARTICIPATION_THRESHOLD
    })

    if (allMet) break

    // Find best next purchase
    let bestTrack: Track | null = null
    let bestScore = 0
    let bestSeries: number[] = []

    for (const track of allMissing) {
      if (purchased.has(track.track_id)) continue

      let score = 0
      const seriesIds: number[] = []
      for (const schedule of schedules) {
        for (const week of schedule.weeks) {
          if (week.track_id === track.track_id) {
            score++
            if (!seriesIds.includes(schedule.series_id)) {
              seriesIds.push(schedule.series_id)
            }
          }
        }
      }

      if (score > bestScore) {
        bestScore = score
        bestTrack = track
        bestSeries = seriesIds
      }
    }

    if (!bestTrack) break

    purchased.add(bestTrack.track_id)
    simulatedOwned.push(bestTrack.track_id)
    running += bestTrack.price

    result.push({
      track: bestTrack,
      score: bestScore,
      seriesCovered: bestSeries,
      cumulativeCost: running,
    })
  }

  return result
}
