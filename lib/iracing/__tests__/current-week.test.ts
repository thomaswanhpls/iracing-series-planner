import { getCurrentWeekIndex } from '../current-week'
import type { IracingWeek } from '../types'

function makeWeeks(startDates: string[]): IracingWeek[] {
  return startDates.map((startDate, i) => ({
    week: i,
    startDate,
    track: 'Test Track',
    venue: 'Test',
    config: null,
    raceLength: '30 min',
    referenceSession: '2026-03-28 13:00 1x',
    notes: '70°F/21°C, Rain chance None, Rolling start.',
  }))
}

describe('getCurrentWeekIndex', () => {
  it('returns index of week that contains today', () => {
    const weeks = makeWeeks(['2026-03-10', '2026-03-17', '2026-03-24'])
    // "today" = 2026-03-20 is within week starting 2026-03-17
    expect(getCurrentWeekIndex(weeks, '2026-03-20')).toBe(1)
  })
  it('returns index of week whose startDate equals today', () => {
    const weeks = makeWeeks(['2026-03-10', '2026-03-17', '2026-03-24'])
    expect(getCurrentWeekIndex(weeks, '2026-03-17')).toBe(1)
  })
  it('returns 0 if today is before all weeks', () => {
    const weeks = makeWeeks(['2026-04-01', '2026-04-08'])
    expect(getCurrentWeekIndex(weeks, '2026-03-17')).toBe(0)
  })
  it('returns last index if today is past all weeks', () => {
    const weeks = makeWeeks(['2026-01-01', '2026-01-08'])
    expect(getCurrentWeekIndex(weeks, '2026-06-01')).toBe(1)
  })
})
