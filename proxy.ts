import { type NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth/session'

export async function proxy(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  if (!session) {
    return NextResponse.redirect(new URL('/', request.url))
  }
  return undefined // pass through
}
