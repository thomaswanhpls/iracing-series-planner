'use server'

import {
  getOwnedTrackIds,
  setTrackOwned,
  bulkSetTracksOwned,
  clearOwnedTracks,
  getSelectedSeriesIds,
  setSelectedSeries,
} from './queries'

export async function fetchOwnedTrackIds(userId: string) {
  return getOwnedTrackIds(userId)
}

export async function toggleTrackOwnedInDb(userId: string, trackId: number, owned: boolean) {
  await setTrackOwned(userId, trackId, owned)
}

export async function bulkSetOwnedInDb(userId: string, trackIds: number[]) {
  await bulkSetTracksOwned(userId, trackIds)
}

export async function clearAllOwnedInDb(userId: string) {
  await clearOwnedTracks(userId)
}

export async function fetchSelectedSeriesIds(userId: string, season: string) {
  return getSelectedSeriesIds(userId, season)
}

export async function saveSelectedSeries(userId: string, season: string, seriesIds: number[]) {
  await setSelectedSeries(userId, season, seriesIds)
}
