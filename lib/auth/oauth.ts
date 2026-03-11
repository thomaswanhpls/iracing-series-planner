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

export async function exchangeCodeForTokens(_code: string): Promise<never> {
  throw new Error('iRacing OAuth token exchange not yet implemented')
}
