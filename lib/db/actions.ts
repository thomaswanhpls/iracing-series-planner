'use server'

import {
  getOwnedTrackIds,
  setTrackOwned,
  bulkSetTracksOwned,
  clearOwnedTracks,
  getSelectedSeriesIds,
  setSelectedSeries,
  getOwnedTrackKeys,
  setOwnedTrackKeys,
  getSelectedSeriesNames,
  setSelectedSeriesNames,
  getOwnedCarNames,
  setOwnedCarNames,
  getUserProfile,
  setUserProfile,
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

// ── JSON-native actions ───────────────────────────────────────────────────────

export async function fetchOwnedTrackKeys(userId: string) {
  return getOwnedTrackKeys(userId)
}

export async function saveOwnedTrackKeys(userId: string, trackKeys: string[]) {
  await setOwnedTrackKeys(userId, trackKeys)
}

export async function fetchSelectedSeriesNames(userId: string, season: string) {
  return getSelectedSeriesNames(userId, season)
}

export async function saveSelectedSeriesNames(
  userId: string,
  season: string,
  seriesNames: string[]
) {
  await setSelectedSeriesNames(userId, season, seriesNames)
}

export async function fetchOwnedCarNames(userId: string) {
  return getOwnedCarNames(userId)
}

export async function saveOwnedCarNames(userId: string, carNames: string[]) {
  await setOwnedCarNames(userId, carNames)
}

export async function fetchUserProfile(userId: string) {
  return getUserProfile(userId)
}

export async function saveUserProfile(userId: string, name: string, licenseClass: string) {
  await setUserProfile(userId, name, licenseClass)
}
