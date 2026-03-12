'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { SeasonSeries } from '@/lib/season-schedules/types'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SeriesSelectorProps {
  series: SeasonSeries[]
  selectedSeriesIds: string[]
  onToggleSeries: (seriesId: string) => void
  onSelectMany: (seriesIds: string[]) => void
  onClearMany: (seriesIds: string[]) => void
  onClearAll: () => void
  categoryLabelMap: Record<string, string>
}

type SortKey = 'name' | 'category' | 'class' | 'weeks'

const ROW_HEIGHT = 86
const VIEWPORT_HEIGHT = 540
const OVERSCAN_ROWS = 6

function normalize(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function getLicenseLabel(raw: string) {
  if (!raw) return 'N/A'
  return raw.split(',')[0]?.trim() ?? raw
}

export function SeriesSelector({
  series,
  selectedSeriesIds,
  onToggleSeries,
  onSelectMany,
  onClearMany,
  onClearAll,
  categoryLabelMap,
}: SeriesSelectorProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('setup_q') ?? '')
  const [sortKey, setSortKey] = useState<SortKey>(
    (searchParams.get('setup_sort') as SortKey) ?? 'name'
  )
  const [sortAscending, setSortAscending] = useState(
    (searchParams.get('setup_dir') ?? 'asc') === 'asc'
  )
  const [scrollTop, setScrollTop] = useState(0)

  const filteredSeries = useMemo(() => {
    const query = normalize(search)
    if (!query) return series

    return series.filter((entry) => {
      if (normalize(entry.title).includes(query)) return true
      if (normalize(entry.className).includes(query)) return true
      if (normalize(entry.cars).includes(query)) return true
      return entry.weeks.some((week) => normalize(week.track).includes(query))
    })
  }, [search, series])

  const sortedSeries = useMemo(() => {
    const entries = [...filteredSeries]
    entries.sort((a, b) => {
      let comparison = 0

      if (sortKey === 'name') comparison = a.title.localeCompare(b.title)
      if (sortKey === 'category') comparison = a.categoryLabel.localeCompare(b.categoryLabel)
      if (sortKey === 'class') comparison = a.className.localeCompare(b.className)
      if (sortKey === 'weeks') comparison = a.weeks.length - b.weeks.length

      return sortAscending ? comparison : -comparison
    })
    return entries
  }, [filteredSeries, sortAscending, sortKey])

  const allFilteredIds = sortedSeries.map((entry) => entry.id)
  const selectedFilteredCount = sortedSeries.filter((entry) => selectedSeriesIds.includes(entry.id)).length

  const totalHeight = sortedSeries.length * ROW_HEIGHT
  const visibleStartIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN_ROWS)
  const visibleEndIndex = Math.min(
    sortedSeries.length,
    Math.ceil((scrollTop + VIEWPORT_HEIGHT) / ROW_HEIGHT) + OVERSCAN_ROWS
  )
  const visibleSeries = sortedSeries.slice(visibleStartIndex, visibleEndIndex)

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (search) params.set('setup_q', search)
    else params.delete('setup_q')
    params.set('setup_sort', sortKey)
    params.set('setup_dir', sortAscending ? 'asc' : 'desc')
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [pathname, router, search, searchParams, sortAscending, sortKey])

  const handleSelectTop = (count: number) => {
    onSelectMany(sortedSeries.slice(0, count).map((entry) => entry.id))
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold">Välj serier</h3>
          <p className="text-xs text-text-muted">
            {selectedSeriesIds.length} valda • {filteredSeries.length} matchar filter
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            className="h-8 px-3 text-xs"
            onClick={() => onSelectMany(allFilteredIds)}
            disabled={allFilteredIds.length === 0}
          >
            Välj alla matchande
          </Button>
          <Button
            variant="ghost"
            className="h-8 px-3 text-xs"
            onClick={() => onClearMany(allFilteredIds)}
            disabled={selectedFilteredCount === 0}
          >
            Rensa matchande
          </Button>
          <Button
            variant="ghost"
            className="h-8 px-3 text-xs"
            onClick={onClearAll}
            disabled={selectedSeriesIds.length === 0}
          >
            Rensa alla val
          </Button>
          <Button
            variant="secondary"
            className="h-8 px-3 text-xs"
            onClick={() => handleSelectTop(10)}
            disabled={sortedSeries.length === 0}
          >
            Välj top 10
          </Button>
          <Button
            variant="secondary"
            className="h-8 px-3 text-xs"
            onClick={() => handleSelectTop(25)}
            disabled={sortedSeries.length === 0}
          >
            Välj top 25
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_180px_90px]">
        <Input
          placeholder="Sök serie, klass, bil eller bana..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          value={sortKey}
          onChange={(event) => setSortKey(event.target.value as SortKey)}
          className="w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary focus:border-accent-primary focus:outline-none"
        >
          <option value="name">Sortera: Namn</option>
          <option value="category">Sortera: Kategori</option>
          <option value="class">Sortera: Klass</option>
          <option value="weeks">Sortera: Veckor</option>
        </select>
        <Button
          variant="secondary"
          className="h-10 text-xs"
          onClick={() => setSortAscending((value) => !value)}
        >
          {sortAscending ? 'A-Ö' : 'Ö-A'}
        </Button>
      </div>

      <div className="grid grid-cols-[36px_1fr_270px] items-center rounded-md border border-border/60 bg-bg-elevated/40 px-3 py-2 text-xs uppercase tracking-wider text-text-muted">
        <div>Val</div>
        <div>Serie</div>
        <div className="text-right">Kategori / Klass / Licens / Veckor</div>
      </div>

      <div
        className="h-[540px] overflow-y-auto rounded-xl border border-border/60 bg-bg-surface/30 p-2"
        onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
      >
        <div className="relative" style={{ height: `${totalHeight}px` }}>
          {visibleSeries.map((entry, index) => {
            const absoluteIndex = visibleStartIndex + index
            const top = absoluteIndex * ROW_HEIGHT
            const selected = selectedSeriesIds.includes(entry.id)
            const license = getLicenseLabel(entry.license)

            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => onToggleSeries(entry.id)}
                className={cn(
                  'absolute left-0 right-0 flex h-[78px] items-start gap-3 rounded-lg border px-3 py-2 text-left transition-all duration-150',
                  selected
                    ? 'border-accent-primary/40 bg-accent-primary/8'
                    : 'border-border/40 bg-bg-surface/40 hover:border-accent-primary/20 hover:bg-bg-surface/80'
                )}
                style={{ top: `${top}px` }}
              >
                <Checkbox
                  checked={selected}
                  onChange={() => onToggleSeries(entry.id)}
                  onClick={(event) => event.stopPropagation()}
                />
                <div className="min-w-0 flex-1">
                  <div className="line-clamp-1 font-display text-sm font-semibold text-text-primary">
                    {entry.title}
                  </div>
                  <div className="mt-1 flex flex-wrap justify-end gap-1.5">
                    <Badge variant="default">{categoryLabelMap[entry.categoryId] ?? entry.categoryLabel}</Badge>
                    <Badge variant="default">{entry.className}</Badge>
                    <Badge variant="default">{license}</Badge>
                    <Badge variant="default">{entry.weeks.length} v</Badge>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {filteredSeries.length === 0 && (
        <div className="rounded-lg border border-border p-4 text-sm text-text-secondary">
          Ingen serie matchade filtret.
        </div>
      )}
    </div>
  )
}
