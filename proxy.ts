import type { NextRequest } from 'next/server'

// Auth guard skeleton — allows all requests for now.
// Will be wired up in Step 11 to check session cookies
// and redirect unauthenticated users to /.
export function proxy(request: NextRequest) {
  return undefined // pass through — no auth check yet
}
