import { randomUUID } from 'crypto'
import { type NextRequest, NextResponse } from 'next/server'
import { createSessionToken, getSessionFromRequest, setSessionCookie } from '@/lib/auth/session'
import { getOAuthAuthorizationUrl } from '@/lib/auth/oauth'
import { createUser } from '@/lib/db/queries'

export async function GET(request: NextRequest) {
  // Already authenticated — send back to setup
  const existing = await getSessionFromRequest(request)
  if (existing) {
    return NextResponse.redirect(new URL('/setup', request.url))
  }

  // OAuth if configured
  if (process.env.IRACING_CLIENT_ID) {
    try {
      return NextResponse.redirect(getOAuthAuthorizationUrl())
    } catch {
      // OAuth env incomplete — fall through to anonymous
    }
  }

  // Anonymous session
  const userId = randomUUID()
  await createUser(userId)
  const token = await createSessionToken({ userId })
  const response = NextResponse.redirect(new URL('/setup', request.url))
  setSessionCookie(response, token)
  return response
}
