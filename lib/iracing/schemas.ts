import { z } from 'zod'

export const categorySchema = z.enum(['road', 'oval', 'dirt_road', 'dirt_oval'])

export const licenseGroupSchema = z.enum(['rookie', 'd', 'c', 'b', 'a', 'pro'])

export const trackSchema = z.object({
  track_id: z.number(),
  track_name: z.string(),
  config_name: z.string(),
  category: categorySchema,
  free_with_subscription: z.boolean(),
  price: z.number(),
  sku: z.number(),
})

export const carSchema = z.object({
  car_id: z.number(),
  car_name: z.string(),
  free_with_subscription: z.boolean(),
  price: z.number(),
  car_class_id: z.number(),
})

export const seriesSchema = z.object({
  series_id: z.number(),
  series_name: z.string(),
  category: categorySchema,
  license_group: licenseGroupSchema,
  car_class_ids: z.array(z.number()),
  fixed_setup: z.boolean(),
})

export const weekScheduleSchema = z.object({
  week_num: z.number(),
  track_id: z.number(),
})

export const seasonScheduleSchema = z.object({
  series_id: z.number(),
  season_year: z.number(),
  season_quarter: z.number(),
  weeks: z.array(weekScheduleSchema),
})
