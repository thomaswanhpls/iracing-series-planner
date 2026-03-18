import type { IracingSeries } from '../iracing/types'
import { makeTrackKey } from '../iracing/types'
import { getTrackPrice } from '../iracing/track-prices'

/**
 * Returns a map of seriesName → total cost of missing paid tracks for that series.
 * Tracks with price 0 (free) are excluded. Each unique track key counted once per series.
 */
export function computeSeriesCost(
  selectedSeries: IracingSeries[],
  ownedTrackKeys: string[],
): Map<string, number> {
  const ownedSet = new Set(ownedTrackKeys)
  const result = new Map<string, number>()

  for (const s of selectedSeries) {
    const seen = new Set<string>()
    let total = 0
    for (const w of s.weeks) {
      const key = makeTrackKey(w.venue, w.config)
      if (seen.has(key)) continue
      seen.add(key)
      if (!ownedSet.has(key)) {
        const price = getTrackPrice(key)
        if (price > 0) total += price
      }
    }
    result.set(s.seriesName, total)
  }

  return result
}
