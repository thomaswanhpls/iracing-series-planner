/**
 * Static track price map.
 * Key format: "venue|config" (config = "" if null) — matches makeTrackKey().
 * Price in USD. 0 = free with subscription.
 *
 * iRacing pricing (as of 2026):
 *   Standard tracks: $14.95
 *   Legacy tracks:   $4.95
 *   Free tracks:     $0
 *
 * NOTE: This is a manually maintained list. Update when iRacing changes prices.
 */
export const TRACK_PRICES: Record<string, number> = {
  // Free tracks (included with subscription)
  'Lime Rock Park|': 0,
  'Lime Rock Park|Grand Prix': 0,
  'Lime Rock Park|Historic': 0,
  'Okayama International Circuit|Full': 0,
  'Okayama International Circuit|Short': 0,
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

  // Add explicit overrides here as needed.
  // Default price for unlisted tracks is determined by isLegacyTrack() (see getTrackPrice).
}

/** Standard track price */
export const DEFAULT_TRACK_PRICE = 14.95

/** Legacy track price — tracks prefixed with "[Legacy]" */
export const LEGACY_TRACK_PRICE = 4.95

/** Returns true if the track key refers to a legacy track (venue starts with "[Legacy]") */
function isLegacyTrack(trackKey: string): boolean {
  const venue = trackKey.split('|')[0]
  return venue.startsWith('[Legacy]')
}

export function getTrackPrice(trackKey: string): number {
  if (trackKey in TRACK_PRICES) return TRACK_PRICES[trackKey]
  if (isLegacyTrack(trackKey)) return LEGACY_TRACK_PRICE
  return DEFAULT_TRACK_PRICE
}
