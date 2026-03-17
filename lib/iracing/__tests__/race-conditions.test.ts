import { parseRaceConditions } from '../race-conditions'

describe('parseRaceConditions', () => {
  it('parses temperature', () => {
    const r = parseRaceConditions('76°F/25°C, Rain chance None, Rolling start.', '2026-03-28 13:35 1x')
    expect(r.tempC).toBe(25)
  })
  it('parses rain chance as null when None', () => {
    const r = parseRaceConditions('76°F/25°C, Rain chance None, Rolling start.', '2026-03-28 13:35 1x')
    expect(r.rainChance).toBeNull()
  })
  it('parses rain chance as number when present', () => {
    const r = parseRaceConditions('67°F/20°C, Rain chance 35%, Standing start.', '2026-03-28 13:35 1x')
    expect(r.rainChance).toBe(35)
  })
  it('detects dynamic weather when Dynamic sky present', () => {
    const r = parseRaceConditions('Constant weather, Dynamic sky, Rolling start.', '2026-03-28 13:35 1x')
    expect(r.isDynamic).toBe(true)
    expect(r.tempC).toBeNull()
  })
  it('isDynamic false for fixed weather', () => {
    const r = parseRaceConditions('76°F/25°C, Rain chance None, Rolling start.', '2026-03-28 13:35 1x')
    expect(r.isDynamic).toBe(false)
  })
  it('parses start time from referenceSession', () => {
    const r = parseRaceConditions('76°F/25°C, Rain chance None.', '2026-03-28 13:35 1x')
    expect(r.startTime).toBe('13:35')
  })
  it('flags night session when time >= 20:00', () => {
    const r = parseRaceConditions('76°F/25°C, Rain chance None.', '2026-03-28 20:20 1x')
    expect(r.isNight).toBe(true)
  })
  it('flags night session when time < 06:00', () => {
    const r = parseRaceConditions('76°F/25°C, Rain chance None.', '2026-03-28 03:00 1x')
    expect(r.isNight).toBe(true)
  })
  it('does not flag daytime as night', () => {
    const r = parseRaceConditions('76°F/25°C, Rain chance None.', '2026-03-28 14:00 1x')
    expect(r.isNight).toBe(false)
  })
})
