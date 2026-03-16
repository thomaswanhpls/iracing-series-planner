import seasonJson from './data/season-2026-s2.json'
import type { IracingSeason, IracingSeries, IracingTrack } from './types'
import { makeTrackKey } from './types'
import type { SeasonScheduleData, SeasonCategory, SeasonSeries, SeasonWeek } from '@/lib/season-schedules/types'

const season = seasonJson as unknown as IracingSeason

export function getAllSeries(): IracingSeries[] {
  return season.series
}

export function getSeriesByCategory(category: string): IracingSeries[] {
  return season.series.filter((s) => s.category === category)
}

export function getUniqueTracks(): IracingTrack[] {
  const seen = new Set<string>()
  const tracks: IracingTrack[] = []
  for (const s of season.series) {
    for (const w of s.weeks) {
      const key = makeTrackKey(w.venue, w.config)
      if (!seen.has(key)) {
        seen.add(key)
        tracks.push({ venue: w.venue, config: w.config })
      }
    }
  }
  return tracks
}

export function getTracksForSeries(seriesNames: string[]): IracingTrack[] {
  const nameSet = new Set(seriesNames)
  const seen = new Set<string>()
  const tracks: IracingTrack[] = []
  for (const s of season.series) {
    if (!nameSet.has(s.seriesName)) continue
    for (const w of s.weeks) {
      const key = makeTrackKey(w.venue, w.config)
      if (!seen.has(key)) {
        seen.add(key)
        tracks.push({ venue: w.venue, config: w.config })
      }
    }
  }
  return tracks
}

export function getAllCars(): string[] {
  return season.cars
}

export function getCarsForSeries(seriesNames: string[]): string[] {
  const nameSet = new Set(seriesNames)
  const seen = new Set<string>()
  for (const s of season.series) {
    if (!nameSet.has(s.seriesName)) continue
    for (const car of s.cars) {
      seen.add(car)
    }
    for (const w of s.weeks) {
      if (w.weekCars) {
        for (const car of w.weekCars) seen.add(car)
      }
    }
  }
  return Array.from(seen).sort()
}

// ── SeasonScheduleBrowser adapter ────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  oval: 'Oval',
  'sports-car': 'Sports Car',
  'formula-car': 'Formula Car',
  'dirt-oval': 'Dirt Oval',
  'dirt-road': 'Dirt Road',
  unranked: 'Unranked',
}

function toCategoryId(category: string): string {
  return category.toLowerCase().replace('_', '-')
}

export function toSeasonScheduleData(series: IracingSeries[]): SeasonScheduleData {
  const categoryIds: string[] = []
  const seen = new Set<string>()
  for (const s of series) {
    const id = toCategoryId(s.category)
    if (!seen.has(id)) {
      seen.add(id)
      categoryIds.push(id)
    }
  }

  const categories: SeasonCategory[] = categoryIds.map((id) => ({
    id,
    label: CATEGORY_LABELS[id] ?? id,
    filename: '',
  }))

  const mappedSeries: SeasonSeries[] = series.map((s) => {
    const categoryId = toCategoryId(s.category)
    const weeks: SeasonWeek[] = s.weeks.map((w) => ({
      week: String(w.week),
      startDate: w.startDate,
      track: w.track,
      length: w.raceLength,
      referenceSession: w.referenceSession,
      notes: w.notes,
    }))
    return {
      id: s.seriesName,
      categoryId,
      categoryLabel: CATEGORY_LABELS[categoryId] ?? categoryId,
      className: s.class,
      title: s.seriesName,
      pdfPage: '',
      cars: s.cars.join(', '),
      license: s.license,
      frequency: s.scheduleFrequency,
      extra: s.incidentRules,
      weeks,
    }
  })

  return { categories, series: mappedSeries }
}
