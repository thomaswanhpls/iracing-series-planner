import type { Track } from '@/lib/iracing/types'

export interface PurchaseRecommendation {
  track: Track
  score: number // number of series-weeks this track covers
  seriesCovered: Array<number | string> // series IDs/keys where this track appears
  seriesLabelsById?: Record<string, string>
  cumulativeCost: number // running total including this track
}

export interface CostSummary {
  totalBeforeDiscount: number
  discountTier: string
  discountPercent: number
  discountAmount: number
  totalAfterDiscount: number
  trackCount: number
}
