import type { IracingWeek } from './types'

/**
 * Returns the 0-based index of the current week.
 * Accepts an optional `today` date string (YYYY-MM-DD) for testability;
 * defaults to the actual current date.
 */
export function getCurrentWeekIndex(weeks: IracingWeek[], today?: string): number {
  const date = today ?? new Date().toISOString().split('T')[0]
  let lastPast = 0
  for (let i = 0; i < weeks.length; i++) {
    if (weeks[i].startDate <= date) lastPast = i
  }
  return lastPast
}
