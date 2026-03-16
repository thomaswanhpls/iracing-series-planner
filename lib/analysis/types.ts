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

// ── JSON-native cost types ────────────────────────────────────────────────────

export interface ContentItem {
  name: string            // venue+config string for tracks, car name for cars
  type: 'track' | 'car'
  price: number           // USD
  seriesCount: number     // how many selected series need this item
}

export interface ContentPurchaseRecommendation {
  item: ContentItem
  score: number           // = seriesCount (for sorting)
  cumulativeCost: number  // running total including this item
}

export interface ContentCostSummary {
  totalBeforeDiscount: number
  discountTier: string
  discountPercent: number
  discountAmount: number
  totalAfterDiscount: number
  trackCount: number
  carCount: number
}
