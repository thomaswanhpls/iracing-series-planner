import type { IracingSeries } from '@/lib/iracing/types'
import { makeTrackKey } from '@/lib/iracing/types'
import { getTrackPrice } from '@/lib/iracing/track-prices'
import { getCarPrice } from '@/lib/iracing/car-prices'
import type { ContentPurchaseRecommendation, ContentCostSummary } from './types'

interface ComputeContentCostArgs {
  selectedSeries: IracingSeries[]
  ownedTrackKeys: string[]
  ownedCarNames: string[]
}

interface ContentCostResult {
  recommendations: ContentPurchaseRecommendation[]
  summary: ContentCostSummary
}

function iRacingDiscount(total: number): { tier: string; percent: number } {
  if (total >= 60) return { tier: 'Platinum', percent: 10 }
  if (total >= 40) return { tier: 'Gold', percent: 10 }
  if (total >= 20) return { tier: 'Silver', percent: 10 }
  return { tier: 'None', percent: 0 }
}

export function computeContentCost({
  selectedSeries,
  ownedTrackKeys,
  ownedCarNames,
}: ComputeContentCostArgs): ContentCostResult {
  const ownedTrackSet = new Set(ownedTrackKeys)
  const ownedCarSet = new Set(ownedCarNames)

  // Count how many series need each missing track
  const trackSeriesCount = new Map<string, number>()
  for (const s of selectedSeries) {
    const seen = new Set<string>()
    for (const w of s.weeks) {
      const key = makeTrackKey(w.venue, w.config)
      if (!ownedTrackSet.has(key) && !seen.has(key)) {
        seen.add(key)
        trackSeriesCount.set(key, (trackSeriesCount.get(key) ?? 0) + 1)
      }
    }
  }

  // Count how many series need each missing car
  const carSeriesCount = new Map<string, number>()
  for (const s of selectedSeries) {
    const carsThisSeries = new Set<string>()
    for (const car of s.cars) carsThisSeries.add(car)
    for (const w of s.weeks) {
      if (w.weekCars) for (const car of w.weekCars) carsThisSeries.add(car)
    }
    for (const car of carsThisSeries) {
      if (!ownedCarSet.has(car)) {
        carSeriesCount.set(car, (carSeriesCount.get(car) ?? 0) + 1)
      }
    }
  }

  // Build recommendations sorted by score desc
  const items: ContentPurchaseRecommendation[] = []

  for (const [key, count] of Array.from(trackSeriesCount.entries()).sort((a, b) => b[1] - a[1])) {
    items.push({
      item: { name: key, type: 'track', price: getTrackPrice(key), seriesCount: count },
      score: count,
      cumulativeCost: 0, // filled below
    })
  }

  for (const [name, count] of Array.from(carSeriesCount.entries()).sort((a, b) => b[1] - a[1])) {
    items.push({
      item: { name, type: 'car', price: getCarPrice(name), seriesCount: count },
      score: count,
      cumulativeCost: 0,
    })
  }

  // Fill cumulative cost
  let running = 0
  for (const rec of items) {
    running += rec.item.price
    rec.cumulativeCost = running
  }

  const totalBeforeDiscount = running
  const { tier, percent } = iRacingDiscount(totalBeforeDiscount)
  const discountAmount = totalBeforeDiscount * (percent / 100)

  const trackCount = Array.from(trackSeriesCount.keys()).length
  const carCount = Array.from(carSeriesCount.keys()).length

  const summary: ContentCostSummary = {
    totalBeforeDiscount,
    discountTier: tier,
    discountPercent: percent,
    discountAmount,
    totalAfterDiscount: totalBeforeDiscount - discountAmount,
    trackCount,
    carCount,
  }

  return { recommendations: items, summary }
}
