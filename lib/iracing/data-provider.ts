import type { Track, Series, SeasonSchedule } from './types'
import { tracks, series, schedules } from './static-data'

// Data provider abstraction.
// Currently reads from static-data.ts.
// Will be replaced with iRacing API + cache when available.

export function getAllTracks(): Track[] {
  return tracks
}

export function getTrackById(trackId: number): Track | undefined {
  return tracks.find((t) => t.track_id === trackId)
}

export function getFreeTracks(): Track[] {
  return tracks.filter((t) => t.free_with_subscription)
}

export function getSeriesList(): Series[] {
  return series
}

export function getSeriesById(seriesId: number): Series | undefined {
  return series.find((s) => s.series_id === seriesId)
}

export function getSeasonSchedule(seriesId: number): SeasonSchedule | undefined {
  return schedules.find((s) => s.series_id === seriesId)
}

export function getAllSchedules(): SeasonSchedule[] {
  return schedules
}
