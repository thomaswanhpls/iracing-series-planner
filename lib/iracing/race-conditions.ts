export interface RaceConditions {
  tempC: number | null
  rainChance: number | null  // null = no rain / not applicable
  isDynamic: boolean
  startTime: string | null   // "HH:MM"
  isNight: boolean
}

export function parseRaceConditions(notes: string, referenceSession: string): RaceConditions {
  const tempMatch = notes.match(/(\d+)°C/)
  const tempC = tempMatch ? parseInt(tempMatch[1], 10) : null

  const rainMatch = notes.match(/Rain chance (\d+)%/)
  const rainChance = rainMatch ? parseInt(rainMatch[1], 10) : null

  const isDynamic = notes.includes('Dynamic sky')

  const sessionMatch = referenceSession.match(/\d{4}-\d{2}-\d{2} (\d{2}:\d{2})/)
  const startTime = sessionMatch ? sessionMatch[1] : null

  let isNight = false
  if (startTime) {
    const hour = parseInt(startTime.split(':')[0], 10)
    isNight = hour >= 20 || hour < 6
  }

  return { tempC, rainChance, isDynamic, startTime, isNight }
}
