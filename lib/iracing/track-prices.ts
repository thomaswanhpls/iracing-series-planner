/**
 * Static track price map.
 * Key format: "venue|config" (config = "" if null) — matches makeTrackKey().
 * Price in USD. 0 = free with subscription.
 *
 * NOTE: This is a manually maintained list. Update when iRacing changes prices.
 * Most tracks are $11.99. Free (base content) tracks are listed explicitly as 0.
 */
export const TRACK_PRICES: Record<string, number> = {
  // Free tracks (included with subscription)
  'Lime Rock Park|': 0,
  'Lime Rock Park|Grand Prix': 0,
  'Lime Rock Park|Historic': 0,
  'Okayama International Circuit|Full': 0,
  'Okayama International Circuit|Short': 0,
  'Silverstone Circuit|Grand Prix': 0,
  'Silverstone Circuit|International': 0,
  'Silverstone Circuit|National': 0,
  'Watkins Glen International|Boot': 0,
  'Watkins Glen International|Long': 0,
  'Watkins Glen International|Short': 0,
  'Charlotte Motor Speedway|Legends Oval': 0,
  'Charlotte Motor Speedway|Oval': 0,
  'Charlotte Motor Speedway|Roval': 0,
  'Motorsport Arena Oschersleben|A-Kurs': 0,
  'Motorsport Arena Oschersleben|B-Kurs': 0,
  'Motorsport Arena Oschersleben|C-Kurs': 0,
  'Summit Point Motorsports Park|': 0,
  'Summit Point Motorsports Park|Jefferson Circuit': 0,
  'Summit Point Motorsports Park|Shenandoah Circuit': 0,

  // Paid tracks — $11.99 each
  // Add entries here as needed. Default price for unlisted tracks is $11.99 (see getTrackPrice).
}

/** Default price for any track not explicitly listed above */
export const DEFAULT_TRACK_PRICE = 11.99

export function getTrackPrice(trackKey: string): number {
  if (trackKey in TRACK_PRICES) return TRACK_PRICES[trackKey]
  return DEFAULT_TRACK_PRICE
}
