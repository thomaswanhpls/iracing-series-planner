/**
 * Static car price map.
 * Key: exact car name string from season-2026-s2.json cars[].
 * Price in USD. 0 = free with subscription.
 *
 * iRacing pricing (as of 2026):
 *   Standard cars: $11.95
 *   Legacy cars:   $2.95
 *   Free cars:     $0
 */
export const CAR_PRICES: Record<string, number> = {
  // Free cars (included with subscription)
  'Street Stock - Eagle T3': 0,
  'Street Stock - Panther C1': 0,
  'Street Stock - Casino M2': 0,
  'Mini Stock': 0,
  "Legends Ford '34 Coupe": 0,
  "Dirt Legends Ford '34 Coupe": 0,
  'Skip Barber Formula 2000': 0,
  'VW Beetle': 0,
  'VW Beetle - Lite': 0,
  'Formula Vee': 0,
  'Global Mazda MX-5 Cup': 0,
  'Late Model Stock': 0,
  'SCCA Spec Racer Ford': 0,
  'Dallara iR-01': 0,
  'Ray FF1600': 0,

  // Add explicit overrides here as needed.
  // Default price for unlisted cars is determined by isLegacyCar() (see getCarPrice).
}

/** Standard car price */
export const DEFAULT_CAR_PRICE = 11.95

/** Legacy car price — cars prefixed with "[Legacy]" */
export const LEGACY_CAR_PRICE = 2.95

/** Returns true if the car name refers to a legacy car (starts with "[Legacy]") */
function isLegacyCar(carName: string): boolean {
  return carName.startsWith('[Legacy]')
}

export function getCarPrice(carName: string): number {
  if (carName in CAR_PRICES) return CAR_PRICES[carName]
  if (isLegacyCar(carName)) return LEGACY_CAR_PRICE
  return DEFAULT_CAR_PRICE
}
