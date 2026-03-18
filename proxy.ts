import { type NextRequest, NextResponse } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { getSessionFromRequest } from '@/lib/auth/session'
import { baseUrl } from '@/lib/url'
import { routing } from '@/i18n/routing'

const intlMiddleware = createMiddleware(routing)

/** Paths that are protected (require auth) regardless of locale prefix */
function isProtectedPath(pathname: string): boolean {
  const stripped = pathname.replace(/^\/(sv)/, '') || '/'
  return (
    stripped.startsWith('/dashboard') ||
    stripped.startsWith('/setup') ||
    stripped.startsWith('/tracks') ||
    stripped.startsWith('/settings') ||
    stripped.startsWith('/series')
  )
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Let intl middleware handle locale routing first
  const intlResponse = intlMiddleware(request)

  if (isProtectedPath(pathname)) {
    const session = await getSessionFromRequest(request)
    if (!session) {
      return NextResponse.redirect(new URL('/', baseUrl(request)))
    }
  }

  return intlResponse
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon\\.ico|favicon\\.svg|icon\\.svg).*)',
  ],
}
