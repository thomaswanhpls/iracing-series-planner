/**
 * iRacing Data API client.
 *
 * All /data endpoints return a redirect link rather than direct data.
 * This client handles the two-step fetch automatically.
 *
 * Token refresh is handled transparently: when a 401 is received, the
 * refresh token is used to get a new access token, and the original
 * request is retried once.
 */

import { refreshAccessToken } from '@/lib/auth/oauth'
import { getUserTokens, saveUserTokens } from '@/lib/db/queries'

const IRACING_DATA_BASE = 'https://members-ng.iracing.com/data'

export class IracingApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message)
    this.name = 'IracingApiError'
  }
}

/** Follow the iRacing two-step redirect pattern and return parsed JSON. */
async function fetchIracingEndpoint<T>(endpoint: string, accessToken: string): Promise<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fetchOptions: any = { headers: { Authorization: `Bearer ${accessToken}` }, next: { revalidate: 0 } }
  const res = await fetch(`${IRACING_DATA_BASE}${endpoint}`, fetchOptions)
  if (!res.ok) {
    throw new IracingApiError(`iRacing API error on ${endpoint}`, res.status)
  }
  const { link } = (await res.json()) as { link: string; expires: string }
  const dataRes = await fetch(link)
  if (!dataRes.ok) {
    throw new IracingApiError(`iRacing data fetch failed for ${endpoint}`, dataRes.status)
  }
  return dataRes.json() as Promise<T>
}

/**
 * Get a valid access token for the given user, refreshing if expired.
 * Throws if no tokens are stored for the user.
 */
export async function getValidAccessToken(userId: string): Promise<string> {
  const tokens = await getUserTokens(userId)
  if (!tokens) {
    throw new IracingApiError('No iRacing tokens for user', 401)
  }
  // Refresh 5 minutes before expiry
  if (tokens.expiresAt.getTime() - Date.now() < 5 * 60 * 1000) {
    const refreshed = await refreshAccessToken(tokens.refreshToken)
    await saveUserTokens(userId, refreshed)
    return refreshed.accessToken
  }
  return tokens.accessToken
}

/** Call an iRacing API endpoint, refreshing the token once on 401. */
async function callApi<T>(userId: string, endpoint: string): Promise<T> {
  const accessToken = await getValidAccessToken(userId)
  try {
    return await fetchIracingEndpoint<T>(endpoint, accessToken)
  } catch (err) {
    if (err instanceof IracingApiError && err.status === 401) {
      // Token may have been revoked — attempt a refresh and retry once
      const tokens = await getUserTokens(userId)
      if (!tokens) throw err
      const refreshed = await refreshAccessToken(tokens.refreshToken)
      await saveUserTokens(userId, refreshed)
      return fetchIracingEndpoint<T>(endpoint, refreshed.accessToken)
    }
    throw err
  }
}

// ── Member data ───────────────────────────────────────────────────────────────

export interface MemberInfo {
  cust_id: number
  display_name: string
  licenses: MemberLicense[]
}

export interface MemberLicense {
  category_id: number
  category: string
  license_level: number
  safety_rating: number
  irating: number
  group_name: string
}

export async function getMemberInfo(userId: string): Promise<MemberInfo> {
  return callApi<MemberInfo>(userId, '/member/info')
}

// ── Owned content (hybrid detection) ─────────────────────────────────────────

export interface RaceResult {
  track: { track_id: number; track_name: string }
  series_id: number
  season_id: number
}

/**
 * Return track IDs the user has raced on (proving ownership).
 * Searches the last 4 seasons of race history.
 */
export async function getRacedTrackIds(userId: string): Promise<number[]> {
  const results = await callApi<RaceResult[]>(
    userId,
    '/results/search_series?season_year=2025&season_quarter=1&finish_range_begin=1'
  )
  const trackIds = new Set<number>()
  for (const r of results) {
    if (r.track?.track_id) trackIds.add(r.track.track_id)
  }
  return Array.from(trackIds)
}
