import { eq, and } from 'drizzle-orm'
import { getDb } from './index'
import {
  users,
  userOwnedTracks,
  userSelectedSeries,
  userOwnedTrackKeys,
  userSelectedSeriesKeys,
  userOwnedCars,
  userProfile,
} from './schema'

// --- Users ---

export async function createUser(id: string, iracingCustomerId?: number) {
  await getDb().insert(users).values({
    id,
    createdAt: new Date(),
    iracingCustomerId: iracingCustomerId ?? null,
  })
}

export async function getUserById(id: string) {
  return getDb().query.users.findFirst({ where: eq(users.id, id) })
}

export async function linkIracingAccount(userId: string, iracingCustomerId: number) {
  await getDb()
    .update(users)
    .set({ iracingCustomerId })
    .where(eq(users.id, userId))
}

// --- Owned tracks ---

export async function getOwnedTrackIds(userId: string): Promise<number[]> {
  const rows = await getDb()
    .select({ trackId: userOwnedTracks.trackId })
    .from(userOwnedTracks)
    .where(eq(userOwnedTracks.userId, userId))
  return rows.map((r) => r.trackId)
}

export async function setTrackOwned(userId: string, trackId: number, owned: boolean) {
  if (owned) {
    await getDb()
      .insert(userOwnedTracks)
      .values({ userId, trackId })
      .onConflictDoNothing()
  } else {
    await getDb()
      .delete(userOwnedTracks)
      .where(and(eq(userOwnedTracks.userId, userId), eq(userOwnedTracks.trackId, trackId)))
  }
}

export async function bulkSetTracksOwned(userId: string, trackIds: number[]) {
  if (trackIds.length === 0) return
  await getDb()
    .insert(userOwnedTracks)
    .values(trackIds.map((trackId) => ({ userId, trackId })))
    .onConflictDoNothing()
}

export async function clearOwnedTracks(userId: string) {
  await getDb().delete(userOwnedTracks).where(eq(userOwnedTracks.userId, userId))
}

// --- Selected series ---

export async function getSelectedSeriesIds(userId: string, season: string): Promise<number[]> {
  const rows = await getDb()
    .select({ seriesId: userSelectedSeries.seriesId })
    .from(userSelectedSeries)
    .where(
      and(eq(userSelectedSeries.userId, userId), eq(userSelectedSeries.season, season))
    )
  return rows.map((r) => r.seriesId)
}

export async function setSelectedSeries(userId: string, season: string, seriesIds: number[]) {
  await getDb()
    .delete(userSelectedSeries)
    .where(
      and(eq(userSelectedSeries.userId, userId), eq(userSelectedSeries.season, season))
    )
  if (seriesIds.length > 0) {
    await getDb()
      .insert(userSelectedSeries)
      .values(seriesIds.map((seriesId) => ({ userId, seriesId, season })))
  }
}

// ── Track keys (JSON-native) ─────────────────────────────────────────────────

export async function getOwnedTrackKeys(userId: string): Promise<string[]> {
  const rows = await getDb()
    .select({ trackKey: userOwnedTrackKeys.trackKey })
    .from(userOwnedTrackKeys)
    .where(eq(userOwnedTrackKeys.userId, userId))
  return rows.map((r) => r.trackKey)
}

export async function setOwnedTrackKeys(userId: string, trackKeys: string[]): Promise<void> {
  await getDb().delete(userOwnedTrackKeys).where(eq(userOwnedTrackKeys.userId, userId))
  if (trackKeys.length > 0) {
    await getDb()
      .insert(userOwnedTrackKeys)
      .values(trackKeys.map((trackKey) => ({ userId, trackKey })))
  }
}

// ── Selected series keys (JSON-native) ───────────────────────────────────────

export async function getSelectedSeriesNames(userId: string, season: string): Promise<string[]> {
  const rows = await getDb()
    .select({ seriesName: userSelectedSeriesKeys.seriesName })
    .from(userSelectedSeriesKeys)
    .where(
      and(
        eq(userSelectedSeriesKeys.userId, userId),
        eq(userSelectedSeriesKeys.season, season)
      )
    )
  return rows.map((r) => r.seriesName)
}

export async function setSelectedSeriesNames(
  userId: string,
  season: string,
  seriesNames: string[]
): Promise<void> {
  await getDb()
    .delete(userSelectedSeriesKeys)
    .where(
      and(
        eq(userSelectedSeriesKeys.userId, userId),
        eq(userSelectedSeriesKeys.season, season)
      )
    )
  if (seriesNames.length > 0) {
    await getDb()
      .insert(userSelectedSeriesKeys)
      .values(seriesNames.map((seriesName) => ({ userId, seriesName, season })))
  }
}

// ── Owned cars (JSON-native) ─────────────────────────────────────────────────

export async function getOwnedCarNames(userId: string): Promise<string[]> {
  const rows = await getDb()
    .select({ carName: userOwnedCars.carName })
    .from(userOwnedCars)
    .where(eq(userOwnedCars.userId, userId))
  return rows.map((r) => r.carName)
}

export async function setOwnedCarNames(userId: string, carNames: string[]): Promise<void> {
  await getDb().delete(userOwnedCars).where(eq(userOwnedCars.userId, userId))
  if (carNames.length > 0) {
    await getDb()
      .insert(userOwnedCars)
      .values(carNames.map((carName) => ({ userId, carName })))
  }
}

// ── User profile ─────────────────────────────────────────────────────────────

export async function getUserProfile(
  userId: string
): Promise<{ name: string; licenseClass: string } | null> {
  const row = await getDb().query.userProfile.findFirst({
    where: eq(userProfile.userId, userId),
  })
  return row ? { name: row.name, licenseClass: row.licenseClass } : null
}

export async function setUserProfile(
  userId: string,
  name: string,
  licenseClass: string
): Promise<void> {
  await getDb()
    .insert(userProfile)
    .values({ userId, name, licenseClass })
    .onConflictDoUpdate({
      target: userProfile.userId,
      set: { name, licenseClass },
    })
}
