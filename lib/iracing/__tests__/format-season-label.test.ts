import { formatSeasonLabel } from '../format-season-label'

describe('formatSeasonLabel', () => {
  it('formats 2026-2 as iRacing 2026 S2', () => {
    expect(formatSeasonLabel('2026-2')).toBe('iRacing 2026 S2')
  })
  it('formats 2025-4 as iRacing 2025 S4', () => {
    expect(formatSeasonLabel('2025-4')).toBe('iRacing 2025 S4')
  })
  it('formats 2026-1 as iRacing 2026 S1', () => {
    expect(formatSeasonLabel('2026-1')).toBe('iRacing 2026 S1')
  })
})
