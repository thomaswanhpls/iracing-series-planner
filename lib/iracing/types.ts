export type Category = 'road' | 'oval' | 'dirt_road' | 'dirt_oval'

export type LicenseGroup = 'rookie' | 'd' | 'c' | 'b' | 'a' | 'pro'

export type OwnershipStatus = 'owned' | 'missing' | 'free'

export interface Track {
  track_id: number
  track_name: string
  config_name: string
  category: Category
  free_with_subscription: boolean
  price: number
  sku: number
}

export interface Car {
  car_id: number
  car_name: string
  free_with_subscription: boolean
  price: number
  car_class_id: number
}

export interface Series {
  series_id: number
  series_name: string
  category: Category
  license_group: LicenseGroup
  car_class_ids: number[]
  fixed_setup: boolean
}

export interface WeekSchedule {
  week_num: number
  track_id: number
}

export interface SeasonSchedule {
  series_id: number
  season_year: number
  season_quarter: number
  weeks: WeekSchedule[]
}

export interface TrackOwnership {
  track_id: number
  status: OwnershipStatus
}

export const WEEKS_PER_SEASON = 12
export const PARTICIPATION_THRESHOLD = 8

// ── JSON-native types (season-2026-s2.json) ──────────────────────────────────

export type IracingCategory =
  | 'OVAL'
  | 'SPORTS_CAR'
  | 'FORMULA_CAR'
  | 'DIRT_OVAL'
  | 'DIRT_ROAD'
  | 'UNRANKED'

export interface IracingWeek {
  week: number
  startDate: string
  track: string           // full combined string e.g. "Charlotte Motor Speedway - Oval"
  venue: string           // venue only e.g. "Charlotte Motor Speedway"
  config: string | null   // config only e.g. "Oval", or null
  raceLength: string
  referenceSession: string
  notes: string
  weekCars?: string[]     // overrides series.cars for rotating-car series when present
}

export interface IracingSeries {
  category: IracingCategory
  class: string
  seriesName: string
  cars: string[]
  license: string
  scheduleFrequency: string
  minEntries: number
  splitAt: number
  drops: number
  incidentRules: string
  weeks: IracingWeek[]
}

export interface IracingTrackPopularity {
  seriesCount: number
  weekCount: number
  popularityScore: number
}

export interface IracingSeason {
  season: string
  generatedAt: string
  totalSeries: number
  cars: string[]
  venuePopularity: Record<string, IracingTrackPopularity>
  trackPopularity: Record<string, IracingTrackPopularity>
  series: IracingSeries[]
}

export interface IracingTrack {
  venue: string
  config: string | null
  popularityScore: number
}

/** Canonical track key: `"${venue}|${config ?? ''}"` */
export function makeTrackKey(venue: string, config: string | null): string {
  return `${venue}|${config ?? ''}`
}
