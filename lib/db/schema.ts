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

export const userOwnedTrackKeys = sqliteTable(
  'user_owned_track_keys',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    trackKey: text('track_key').notNull(), // "venue|config", config="" if null
  },
  (t) => [primaryKey({ columns: [t.userId, t.trackKey] })]
)

export const userSelectedSeriesKeys = sqliteTable(
  'user_selected_series_keys',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    seriesName: text('series_name').notNull(),
    season: text('season').notNull(), // hardcoded to '2026-2' for this dataset
  },
  (t) => [primaryKey({ columns: [t.userId, t.seriesName, t.season] })]
)

export const userOwnedCars = sqliteTable(
  'user_owned_cars',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    carName: text('car_name').notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.carName] })]
)

export const userProfile = sqliteTable('user_profile', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull().default(''),
  licenseClass: text('license_class').notNull().default('Rookie'),
})
