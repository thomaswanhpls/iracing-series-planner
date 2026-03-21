import { randomUUID } from 'crypto'
import { type NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForTokens } from '@/lib/auth/oauth'
import { createSessionToken, setSessionCookie } from '@/lib/auth/session'
import { createUser, saveUserTokens, getUserById } from '@/lib/db/queries'
import { baseUrl } from '@/lib/url'

const IRACING_DATA_BASE = 'https://members-ng.iracing.com/data'

async function fetchMemberInfo(
  accessToken: string
): Promise<{ cust_id: number; display_name: string } | null> {
  const res = await fetch(`${IRACING_DATA_BASE}/member/info`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) return null
  const { link } = (await res.json()) as { link: string }
  const dataRes = await fetch(link)
  if (!dataRes.ok) return null
  return dataRes.json() as Promise<{ cust_id: number; display_name: string }>
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const origin = baseUrl(request)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(new URL(`/?error=${error ?? 'missing_code'}`, origin))
  }

  try {
    const tokens = await exchangeCodeForTokens(code)

    const memberInfo = await fetchMemberInfo(tokens.accessToken)
    const custId = memberInfo?.cust_id
    const userId = custId ? `iracing:${custId}` : randomUUID()

    const existing = await getUserById(userId)
    if (!existing) {
      await createUser(userId, custId)
    }

    await saveUserTokens(userId, tokens)

    const sessionToken = await createSessionToken({ userId })
    const response = NextResponse.redirect(new URL('/setup', origin))
    setSessionCookie(response, sessionToken)
    return response
  } catch (err) {
    console.error('[auth/callback] OAuth error:', err)
    return NextResponse.redirect(new URL('/?error=oauth_failed', origin))
  }
}
