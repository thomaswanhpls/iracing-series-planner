const IRACING_AUTH_BASE = 'https://oauth.iracing.com/oauth2'

export function getOAuthAuthorizationUrl(): string {
  const clientId = process.env.IRACING_CLIENT_ID
  const redirectUri = process.env.IRACING_REDIRECT_URI
  if (!clientId || !redirectUri) {
    throw new Error('iRacing OAuth not configured — set IRACING_CLIENT_ID and IRACING_REDIRECT_URI')
  }
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'openid',
    audience: 'data-server',
  })
  return `${IRACING_AUTH_BASE}/auth?${params}`
}

export interface TokenResponse {
  accessToken: string
  refreshToken: string
  expiresAt: Date
}

export async function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
  const clientId = process.env.IRACING_CLIENT_ID
  const clientSecret = process.env.IRACING_CLIENT_SECRET
  const redirectUri = process.env.IRACING_REDIRECT_URI
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      'iRacing OAuth not configured — set IRACING_CLIENT_ID, IRACING_CLIENT_SECRET, and IRACING_REDIRECT_URI'
    )
  }
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  })
  const res = await fetch(`${IRACING_AUTH_BASE}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  if (!res.ok) {
    throw new Error(`Token exchange failed: ${res.status} ${await res.text()}`)
  }
  const json = await res.json()
  return parseTokenResponse(json)
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const clientId = process.env.IRACING_CLIENT_ID
  const clientSecret = process.env.IRACING_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error('iRacing OAuth not configured — set IRACING_CLIENT_ID and IRACING_CLIENT_SECRET')
  }
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  })
  const res = await fetch(`${IRACING_AUTH_BASE}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  if (!res.ok) {
    throw new Error(`Token refresh failed: ${res.status} ${await res.text()}`)
  }
  const json = await res.json()
  return parseTokenResponse(json)
}

function parseTokenResponse(json: {
  access_token: string
  refresh_token: string
  expires_in: number
}): TokenResponse {
  const expiresAt = new Date(Date.now() + json.expires_in * 1000)
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresAt,
  }
}
