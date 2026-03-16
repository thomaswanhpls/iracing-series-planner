/**
 * Static car price map.
 * Key: exact car name string from season-2026-s2.json cars[].
 * Price in USD. 0 = free with subscription.
 * Default for unlisted: $11.99.
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

  // Paid cars — $11.99 each
  // Add entries here as needed. Default price for unlisted cars is $11.99 (see getCarPrice).
}

export const DEFAULT_CAR_PRICE = 11.99

export function getCarPrice(carName: string): number {
  if (carName in CAR_PRICES) return CAR_PRICES[carName]
  return DEFAULT_CAR_PRICE
}
