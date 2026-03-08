import type { Track } from '@/lib/iracing/types'

export interface PurchaseRecommendation {
  track: Track
  score: number // number of series-weeks this track covers
  seriesCovered: number[] // series_ids where this track appears
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
