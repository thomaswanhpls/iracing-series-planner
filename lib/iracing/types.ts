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
