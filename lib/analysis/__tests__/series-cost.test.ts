import { computeSeriesCost } from '../series-cost'
import type { IracingSeries } from '../../iracing/types'

function makeSeries(name: string, venues: Array<{ venue: string; config: string | null }>): IracingSeries {
  return {
    category: 'SPORTS_CAR',
    class: 'C',
    seriesName: name,
    cars: [],
    license: 'C',
    scheduleFrequency: 'Weekly',
    minEntries: 8,
    splitAt: 40,
    drops: 4,
    incidentRules: '',
    weeks: venues.map((v, i) => ({
      week: i,
      startDate: `2026-03-${17 + i}`,
      track: v.venue,
      venue: v.venue,
      config: v.config,
      raceLength: '30 min',
      referenceSession: '2026-03-28 13:00 1x',
      notes: '70°F/21°C, Rain chance None, Rolling start.',
    })),
  }
}

describe('computeSeriesCost', () => {
  it('returns 0 for a series where all tracks are owned', () => {
    const series = makeSeries('GT3', [{ venue: 'Spa', config: 'Grand Prix' }])
    const result = computeSeriesCost([series], ['Spa|Grand Prix'])
    expect(result.get('GT3')).toBe(0)
  })

  it('returns 0 for a series where all tracks are free', () => {
    // Lime Rock Park is price 0 in track-prices
    const series = makeSeries('Skip Barber', [{ venue: 'Lime Rock Park', config: 'Grand Prix' }])
    const result = computeSeriesCost([series], [])
    expect(result.get('Skip Barber')).toBe(0)
  })

  it('returns total price of missing paid tracks for a series', () => {
    // Use a track that has a price > 0. Suzuka is $11.99 in track-prices.
    const series = makeSeries('TCR', [{ venue: 'Suzuka International Raceway', config: 'Full' }])
    const result = computeSeriesCost([series], [])
    expect(result.get('TCR')).toBeGreaterThan(0)
  })

  it('does not double-count the same track appearing in multiple weeks', () => {
    const series = makeSeries('TCR', [
      { venue: 'Suzuka International Raceway', config: 'Full' },
      { venue: 'Suzuka International Raceway', config: 'Full' },
    ])
    const result1 = computeSeriesCost([series], [])
    const series2 = makeSeries('TCR', [{ venue: 'Suzuka International Raceway', config: 'Full' }])
    const result2 = computeSeriesCost([series2], [])
    expect(result1.get('TCR')).toBe(result2.get('TCR'))
  })
})
