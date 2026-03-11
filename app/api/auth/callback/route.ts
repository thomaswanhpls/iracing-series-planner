import { type NextRequest, NextResponse } from 'next/server'

// OAuth callback — placeholder until iRacing approves OAuth registration.
// Will exchange the `code` param for tokens, upsert user, and create a session.
export async function GET(request: NextRequest) {
  const _code = new URL(request.url).searchParams.get('code')
  // TODO: implement token exchange in lib/auth/oauth.ts
  return NextResponse.redirect(new URL('/', request.url))
}
