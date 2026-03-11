import { type NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth/session'
import { baseUrl } from '@/lib/url'

export async function proxy(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  if (!session) {
    return NextResponse.redirect(new URL('/', baseUrl(request)))
  }
  // pass through — authenticated
}

export const config = {
  matcher: ['/dashboard/:path*', '/setup/:path*', '/tracks/:path*', '/settings/:path*'],
}
