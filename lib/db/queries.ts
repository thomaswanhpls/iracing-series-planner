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

export interface UserProfileData {
  name: string
  licenseClass: string
  licenseSportsCar: string
  licenseFormulaCar: string
  licenseOval: string
  licenseDirtRoad: string
  licenseDirtOval: string
}

export async function getUserProfile(userId: string): Promise<UserProfileData | null> {
  const rows = await getDb()
    .select({
      name: userProfile.name,
      licenseClass: userProfile.licenseClass,
      licenseSportsCar: userProfile.licenseSportsCar,
      licenseFormulaCar: userProfile.licenseFormulaCar,
      licenseOval: userProfile.licenseOval,
      licenseDirtRoad: userProfile.licenseDirtRoad,
      licenseDirtOval: userProfile.licenseDirtOval,
    })
    .from(userProfile)
    .where(eq(userProfile.userId, userId))
    .limit(1)
  return rows[0] ?? null
}

export async function setUserProfile(userId: string, data: Omit<UserProfileData, 'licenseClass'>): Promise<void> {
  const licenseClass = data.licenseSportsCar // keep compat field in sync with sports car license
  await getDb()
    .insert(userProfile)
    .values({ userId, licenseClass, ...data })
    .onConflictDoUpdate({
      target: userProfile.userId,
      set: { licenseClass, ...data },
    })
}
