import { sqliteTable, integer, text, primaryKey } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: text('id').primaryKey(), // UUID, anonymous or linked to iRacing
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  iracingCustomerId: integer('iracing_customer_id'), // null for anonymous users
})

export const userOwnedTracks = sqliteTable(
  'user_owned_tracks',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    trackId: integer('track_id').notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.trackId] })]
)

export const userSelectedSeries = sqliteTable(
  'user_selected_series',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    seriesId: integer('series_id').notNull(),
    season: text('season').notNull(), // e.g. '2026-1'
  },
  (t) => [primaryKey({ columns: [t.userId, t.seriesId, t.season] })]
)
