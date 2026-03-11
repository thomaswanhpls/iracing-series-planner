import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import * as schema from './schema'

function createDb() {
  const url = process.env.TURSO_DATABASE_URL
  if (!url) {
    // Return null during build when env vars are not available
    return null
  }
  const client = createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })
  return drizzle(client, { schema })
}

// Singleton to avoid multiple connections in dev (hot reload)
const globalForDb = globalThis as unknown as { db: ReturnType<typeof createDb> | undefined }

const _db = globalForDb.db ?? createDb()

if (process.env.NODE_ENV !== 'production' && _db) {
  globalForDb.db = _db
}

export function getDb() {
  if (!_db) {
    throw new Error('TURSO_DATABASE_URL is not set')
  }
  return _db
}

/** @deprecated Use getDb() for lazy access */
export const db = _db!
