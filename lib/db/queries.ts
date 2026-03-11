import { eq, and } from 'drizzle-orm'
import { getDb } from './index'
import { users, userOwnedTracks, userSelectedSeries } from './schema'

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
