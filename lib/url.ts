import type { NextRequest } from 'next/server'

export function baseUrl(request: NextRequest): string {
  const host = request.headers.get('host') ?? new URL(request.url).host
  const proto = request.headers.get('x-forwarded-proto') ?? 'http'
  return `${proto}://${host}`
}
