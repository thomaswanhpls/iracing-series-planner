import type { PurchaseRecommendation, CostSummary } from '@/lib/analysis/types'
import type { Track } from '@/lib/iracing/types'
import { getDiscountTier } from '@/lib/analysis/cost'
import type { SeasonScheduleData, SeasonSeries } from '@/lib/season-schedules/types'

export interface Season2CostAnalysis {
  selectedSeries: SeasonSeries[]
  unresolvedSeriesKeys: string[]
  recommendations: PurchaseRecommendation[]
  costSummary: CostSummary
  unmatchedTrackNames: string[]
}

const trackAliasMap: Record<string, string> = {
  'weathertech raceway at laguna seca': 'laguna seca',
  'autodromo nazionale monza': 'monza',
  'circuit de spa-francorchamps': 'spa-francorchamps',
  'circuit de barcelona catalunya': 'circuit de barcelona-catalunya',
  'circuit zandvoort': 'zandvoort',
  'autodromo jose carlos pace': 'interlagos',
}

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\[legacy\]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeLoose(value: string): string {
  return normalize(value)
    .replace(
      /\b(circuit|raceway|speedway|international|motor|motorsports|park|course|autodromo|autodrome)\b/g,
      ' '
    )
    .replace(/\s+/g, ' ')
    .trim()
}

function toSlug(value: string): string {
  return normalize(value).replace(/\s+/g, '-').replace(/-+/g, '-')
}

export function resolveSeason2SeriesSelection(series: SeasonSeries[], seriesParam: string | null) {
  if (!seriesParam) return { selectedSeries: [], unresolvedSeriesKeys: [] as string[] }

  const keys = seriesParam
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
  if (keys.length === 0) return { selectedSeries: [], unresolvedSeriesKeys: [] as string[] }

  const byId = new Map(series.map((entry) => [entry.id, entry]))
  const byTitleSlug = new Map(series.map((entry) => [toSlug(entry.title), entry]))
  const selectedSeries: SeasonSeries[] = []
  const seen = new Set<string>()
  const unresolvedSeriesKeys: string[] = []

  for (const key of keys) {
    let match = byId.get(key) ?? null
    if (!match) {
      const normalizedKey = toSlug(key)
      match = byTitleSlug.get(normalizedKey) ?? null
      if (!match) {
        for (const entry of series) {
          if (normalizedKey.endsWith(`-${toSlug(entry.title)}`)) {
            match = entry
            break
          }
        }
      }
    }

    if (!match) {
      unresolvedSeriesKeys.push(key)
      continue
    }
    if (seen.has(match.id)) continue
    seen.add(match.id)
    selectedSeries.push(match)
  }

  return { selectedSeries, unresolvedSeriesKeys }
}

function buildTrackCandidates(rawTrackName: string): string[] {
  const normalized = normalize(rawTrackName)
  if (!normalized) return []

  const candidates = new Set<string>([normalized])

  const aliased = trackAliasMap[normalized]
  if (aliased) candidates.add(aliased)

  const firstDash = normalized.split(' - ')[0]?.trim()
  if (firstDash) {
    candidates.add(firstDash)
    const dashAlias = trackAliasMap[firstDash]
    if (dashAlias) candidates.add(dashAlias)
  }

  const loose = normalizeLoose(normalized)
  if (loose) candidates.add(loose)

  return [...candidates].filter(Boolean)
}

function scoreTrackMatch(candidate: string, track: Track): number {
  const trackName = normalize(track.track_name)
  const trackLoose = normalizeLoose(track.track_name)
  const configName = normalize(track.config_name)

  if (candidate === trackName) return 100
  if (candidate === trackLoose) return 95
  if (configName && candidate === `${trackName} ${configName}`.trim()) return 95
  if (trackName.includes(candidate) || candidate.includes(trackName)) return 80
  if (trackLoose && (trackLoose.includes(candidate) || candidate.includes(trackLoose))) return 76

  const candidateTokens = new Set(candidate.split(' ').filter(Boolean))
  if (candidateTokens.size === 0) return 0
  const trackTokens = new Set(trackLoose.split(' ').filter(Boolean))
  let overlap = 0
  for (const token of candidateTokens) {
    if (trackTokens.has(token)) overlap += 1
  }
  const ratio = overlap / candidateTokens.size
  if (ratio >= 0.8) return 72
  if (ratio >= 0.6) return 68
  return 0
}

export function matchSeason2TrackToCatalog(rawTrackName: string, tracks: Track[]): Track | null {
  const candidates = buildTrackCandidates(rawTrackName)
  let bestScore = 0
  let bestTrack: Track | null = null

  for (const candidate of candidates) {
    for (const track of tracks) {
      const score = scoreTrackMatch(candidate, track)
      if (score > bestScore) {
        bestScore = score
        bestTrack = track
      }
    }
  }

  return bestScore >= 68 ? bestTrack : null
}

export function analyzeSeason2Costs(
  seasonData: SeasonScheduleData,
  seriesParam: string | null,
  ownedTrackIds: number[],
  tracks: Track[]
): Season2CostAnalysis {
  const { selectedSeries, unresolvedSeriesKeys } = resolveSeason2SeriesSelection(
    seasonData.series,
    seriesParam
  )
  if (selectedSeries.length === 0) {
    return {
      selectedSeries,
      unresolvedSeriesKeys,
      recommendations: [],
      costSummary: {
        totalBeforeDiscount: 0,
        discountTier: 'Ingen',
        discountPercent: 0,
        discountAmount: 0,
        totalAfterDiscount: 0,
        trackCount: 0,
      },
      unmatchedTrackNames: [],
    }
  }

  const freeTrackIds = new Set(tracks.filter((track) => track.free_with_subscription).map((track) => track.track_id))
  const seriesLabelsById: Record<string, string> = Object.fromEntries(
    selectedSeries.map((series) => [series.id, series.title])
  )
  const scoreByTrackId = new Map<number, { score: number; seriesIds: Set<string> }>()
  const unmatchedTrackNames = new Set<string>()

  for (const series of selectedSeries) {
    for (const week of series.weeks) {
      const matchedTrack = matchSeason2TrackToCatalog(week.track, tracks)
      if (!matchedTrack) {
        if (week.track) unmatchedTrackNames.add(week.track)
        continue
      }

      if (freeTrackIds.has(matchedTrack.track_id)) continue
      if (ownedTrackIds.includes(matchedTrack.track_id)) continue

      const current = scoreByTrackId.get(matchedTrack.track_id) ?? {
        score: 0,
        seriesIds: new Set<string>(),
      }
      current.score += 1
      current.seriesIds.add(series.id)
      scoreByTrackId.set(matchedTrack.track_id, current)
    }
  }

  const recommendations = [...scoreByTrackId.entries()]
    .reduce<PurchaseRecommendation[]>((result, [trackId, info]) => {
      const track = tracks.find((entry) => entry.track_id === trackId)
      if (!track) return result
      result.push({
        track,
        score: info.score,
        seriesCovered: [...info.seriesIds],
        seriesLabelsById,
        cumulativeCost: 0,
      })
      return result
    }, [])
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return b.track.price - a.track.price
    })

  let running = 0
  for (const recommendation of recommendations) {
    running += recommendation.track.price
    recommendation.cumulativeCost = running
  }

  const totalBeforeDiscount = recommendations.reduce((sum, rec) => sum + rec.track.price, 0)
  const { tier, percent } = getDiscountTier(recommendations.length)
  const discountAmount = totalBeforeDiscount * (percent / 100)

  return {
    selectedSeries,
    unresolvedSeriesKeys,
    recommendations,
    costSummary: {
      totalBeforeDiscount,
      discountTier: tier,
      discountPercent: percent,
      discountAmount,
      totalAfterDiscount: totalBeforeDiscount - discountAmount,
      trackCount: recommendations.length,
    },
    unmatchedTrackNames: [...unmatchedTrackNames].sort((a, b) => a.localeCompare(b)),
  }
}
