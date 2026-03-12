import { getSeriesList } from '@/lib/iracing/data-provider'

export interface ResolvedSeriesSelection {
  seriesIds: number[]
  unresolvedKeys: string[]
}

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function toSlug(value: string): string {
  return normalize(value)
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function tryResolveSlugKey(key: string, slugToSeriesId: Map<string, number>): number | null {
  if (slugToSeriesId.has(key)) return slugToSeriesId.get(key) ?? null

  for (const [slug, seriesId] of slugToSeriesId.entries()) {
    if (key.endsWith(`-${slug}`)) return seriesId
  }

  return null
}

export function resolveSeriesSelection(seriesParam: string | null): ResolvedSeriesSelection {
  if (!seriesParam) return { seriesIds: [], unresolvedKeys: [] }

  const parts = seriesParam
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)

  if (parts.length === 0) return { seriesIds: [], unresolvedKeys: [] }

  const series = getSeriesList()
  const validSeriesIds = new Set(series.map((entry) => entry.series_id))
  const slugToSeriesId = new Map<string, number>()
  for (const entry of series) {
    slugToSeriesId.set(toSlug(entry.series_name), entry.series_id)
  }

  const resolvedIds: number[] = []
  const unresolvedKeys: string[] = []
  const seen = new Set<number>()

  for (const key of parts) {
    const numericId = Number.parseInt(key, 10)
    if (Number.isFinite(numericId) && validSeriesIds.has(numericId)) {
      if (!seen.has(numericId)) {
        seen.add(numericId)
        resolvedIds.push(numericId)
      }
      continue
    }

    const slugCandidate = toSlug(key)
    const resolvedFromSlug = tryResolveSlugKey(slugCandidate, slugToSeriesId)
    if (resolvedFromSlug != null) {
      if (!seen.has(resolvedFromSlug)) {
        seen.add(resolvedFromSlug)
        resolvedIds.push(resolvedFromSlug)
      }
      continue
    }

    unresolvedKeys.push(key)
  }

  return { seriesIds: resolvedIds, unresolvedKeys }
}
