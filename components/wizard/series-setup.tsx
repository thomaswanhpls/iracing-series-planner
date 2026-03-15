'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { SeasonScheduleData } from '@/lib/season-schedules/types'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { getLicenseColor, getLicenseLabel } from '@/lib/iracing/license-colors'

interface SeriesSetupProps {
  data: SeasonScheduleData
}

interface PersistedSetupState {
  season: string
  selectedCategoryIds: string[]
  selectedClassNames: string[]
  selectedSeriesIds: string[]
}

type SortKey = 'name' | 'category' | 'class' | 'weeks'

const ROW_HEIGHT = 86
const VIEWPORT_HEIGHT = 540
const OVERSCAN_ROWS = 6
const defaultSeason = '2026-2'
const storageKey = 'series-setup-state-v1'

function normalize(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function SeriesSetup({ data }: SeriesSetupProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const hydratedRef = useRef(false)

  // --- State ---
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    data.categories.map((c) => c.id)
  )
  const [selectedClassNames, setSelectedClassNames] = useState<string[]>([])
  const [selectedSeriesIds, setSelectedSeriesIds] = useState<string[]>([])
  const [search, setSearch] = useState(searchParams.get('setup_q') ?? '')
  const [sortKey, setSortKey] = useState<SortKey>(
    (searchParams.get('setup_sort') as SortKey) ?? 'name'
  )
  const [sortAscending, setSortAscending] = useState(
    (searchParams.get('setup_dir') ?? 'asc') === 'asc'
  )
  const [scrollTop, setScrollTop] = useState(0)

  // --- Derived data ---
  const categoryLabelMap = useMemo(
    () => Object.fromEntries(data.categories.map((c) => [c.id, c.label])),
    [data]
  )

  const availableCategoryIds = useMemo(
    () => new Set(data.categories.map((c) => c.id)),
    [data.categories]
  )
  const availableSeriesIds = useMemo(
    () => new Set(data.series.map((s) => s.id)),
    [data.series]
  )

  // Filter series by selected categories + classes
  const categoryFilteredSeries = useMemo(() => {
    return data.series.filter((s) => {
      if (selectedCategoryIds.length > 0 && !selectedCategoryIds.includes(s.categoryId)) return false
      if (selectedClassNames.length > 0 && !selectedClassNames.includes(s.className)) return false
      return true
    })
  }, [data.series, selectedCategoryIds, selectedClassNames])

  // availableClasses derived from category-filtered series,
  // NOT all series — so class pills update when categories change
  const availableClasses = useMemo(() => {
    const seriesInActiveCategories = data.series.filter(
      (s) => selectedCategoryIds.length === 0 || selectedCategoryIds.includes(s.categoryId)
    )
    const unique = new Set<string>()
    for (const s of seriesInActiveCategories) {
      unique.add(s.className)
    }
    return Array.from(unique).sort((a, b) => a.localeCompare(b))
  }, [data.series, selectedCategoryIds])

  const availableClassNames = useMemo(() => new Set(availableClasses), [availableClasses])

  // Apply search filter on top of category/class filtering
  const searchFilteredSeries = useMemo(() => {
    const query = normalize(search)
    if (!query) return categoryFilteredSeries
    return categoryFilteredSeries.filter((entry) => {
      if (normalize(entry.title).includes(query)) return true
      if (normalize(entry.className).includes(query)) return true
      if (normalize(entry.cars).includes(query)) return true
      return entry.weeks.some((week) => normalize(week.track).includes(query))
    })
  }, [search, categoryFilteredSeries])

  // Sort
  const sortedSeries = useMemo(() => {
    const entries = [...searchFilteredSeries]
    entries.sort((a, b) => {
      let cmp = 0
      if (sortKey === 'name') cmp = a.title.localeCompare(b.title)
      if (sortKey === 'category') cmp = a.categoryLabel.localeCompare(b.categoryLabel)
      if (sortKey === 'class') cmp = a.className.localeCompare(b.className)
      if (sortKey === 'weeks') cmp = a.weeks.length - b.weeks.length
      return sortAscending ? cmp : -cmp
    })
    return entries
  }, [searchFilteredSeries, sortAscending, sortKey])

  // Virtualization
  const allFilteredIds = useMemo(() => sortedSeries.map((s) => s.id), [sortedSeries])
  const totalHeight = sortedSeries.length * ROW_HEIGHT
  const visibleStartIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN_ROWS)
  const visibleEndIndex = Math.min(
    sortedSeries.length,
    Math.ceil((scrollTop + VIEWPORT_HEIGHT) / ROW_HEIGHT) + OVERSCAN_ROWS
  )
  const visibleSeries = sortedSeries.slice(visibleStartIndex, visibleEndIndex)

  // --- localStorage hydration ---
  useEffect(() => {
    if (hydratedRef.current) return
    const raw = localStorage.getItem(storageKey)
    if (!raw) {
      hydratedRef.current = true
      return
    }
    try {
      const parsed = JSON.parse(raw) as Partial<PersistedSetupState>
      if (Array.isArray(parsed.selectedCategoryIds)) {
        setSelectedCategoryIds(
          parsed.selectedCategoryIds.filter(
            (id): id is string => typeof id === 'string' && availableCategoryIds.has(id)
          )
        )
      }
      if (Array.isArray(parsed.selectedClassNames)) {
        setSelectedClassNames(
          parsed.selectedClassNames.filter(
            (name): name is string => typeof name === 'string' && availableClassNames.has(name)
          )
        )
      }
      if (Array.isArray(parsed.selectedSeriesIds)) {
        setSelectedSeriesIds(
          parsed.selectedSeriesIds.filter(
            (id): id is string => typeof id === 'string' && availableSeriesIds.has(id)
          )
        )
      }
    } catch {
      localStorage.removeItem(storageKey)
    } finally {
      hydratedRef.current = true
    }
  }, [availableCategoryIds, availableClassNames, availableSeriesIds])

  // --- localStorage persistence ---
  useEffect(() => {
    if (!hydratedRef.current) return
    const snapshot: PersistedSetupState = {
      season: defaultSeason,
      selectedCategoryIds,
      selectedClassNames,
      selectedSeriesIds,
    }
    localStorage.setItem(storageKey, JSON.stringify(snapshot))
  }, [selectedCategoryIds, selectedClassNames, selectedSeriesIds])

  // --- Clean up stale selections when available options change ---
  useEffect(() => {
    setSelectedCategoryIds((prev) => prev.filter((id) => availableCategoryIds.has(id)))
  }, [availableCategoryIds])

  useEffect(() => {
    setSelectedClassNames((prev) => prev.filter((name) => availableClassNames.has(name)))
  }, [availableClassNames])

  useEffect(() => {
    setSelectedSeriesIds((prev) => prev.filter((id) => availableSeriesIds.has(id)))
  }, [availableSeriesIds])

  // --- URL params sync ---
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (search) params.set('setup_q', search)
    else params.delete('setup_q')
    params.set('setup_sort', sortKey)
    params.set('setup_dir', sortAscending ? 'asc' : 'desc')
    const current = searchParams.toString()
    const next = params.toString()
    if (current === next) return
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false })
  }, [pathname, router, search, searchParams, sortAscending, sortKey])

  // --- Handlers ---
  const toggleCategory = (categoryId: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    )
  }

  const toggleClass = (className: string) => {
    setSelectedClassNames((prev) =>
      prev.includes(className) ? prev.filter((n) => n !== className) : [...prev, className]
    )
  }

  const toggleSeries = (seriesId: string) => {
    setSelectedSeriesIds((prev) =>
      prev.includes(seriesId) ? prev.filter((id) => id !== seriesId) : [...prev, seriesId]
    )
  }

  const selectManySeries = (ids: string[]) => {
    setSelectedSeriesIds((prev) => Array.from(new Set([...prev, ...ids])))
  }

  const clearManySeries = () => {
    const toClear = new Set(allFilteredIds)
    setSelectedSeriesIds((prev) => prev.filter((id) => !toClear.has(id)))
  }

  // Navigate to tracks — no step logic, just navigate directly
  const handleNext = () => {
    const params = new URLSearchParams()
    params.set('season', defaultSeason)
    if (selectedCategoryIds.length > 0) params.set('categories', selectedCategoryIds.join(','))
    if (selectedClassNames.length > 0) params.set('classes', selectedClassNames.join(','))
    if (selectedSeriesIds.length > 0) params.set('series', selectedSeriesIds.join(','))
    router.push(`/tracks?${params.toString()}`)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="font-display text-lg font-bold text-text-primary">Välj dina serier</h2>
          <p className="text-sm text-text-muted mt-1">
            2026 Season 2 · Markera serier du vill köra, sen fortsätt till banval.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-md bg-accent-primary/10 text-accent-primary text-xs font-display font-semibold">
            {selectedSeriesIds.length} valda
          </span>
          <Button onClick={handleNext} disabled={selectedSeriesIds.length === 0}>
            Fortsätt till Banor →
          </Button>
        </div>
      </div>

      {/* Filterbar */}
      <div className="space-y-3 border-b border-border-subtle pb-4">
        {/* Row 1 — Category chips */}
        <div className="flex flex-wrap gap-2">
          {data.categories.map((cat) => {
            const active = selectedCategoryIds.includes(cat.id)
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleCategory(cat.id)}
                className={cn(
                  'rounded-lg border px-3.5 py-1.5 text-xs font-medium transition-colors',
                  active
                    ? 'bg-accent-primary/10 border-accent-primary/25 text-accent-primary'
                    : 'bg-bg-elevated/60 border-border text-text-muted hover:border-accent-primary/30'
                )}
              >
                {cat.label}
              </button>
            )
          })}
        </div>

        {/* Row 2 — Class pills + search + sort */}
        <div className="flex flex-wrap items-center gap-2">
          {availableClasses.map((cls) => {
            const active = selectedClassNames.includes(cls)
            return (
              <button
                key={cls}
                type="button"
                onClick={() => toggleClass(cls)}
                className={cn(
                  'rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
                  active
                    ? 'bg-accent-primary/8 border-accent-primary/18 text-accent-primary'
                    : 'bg-bg-elevated/40 border-border/50 text-text-muted hover:border-accent-primary/20'
                )}
              >
                {cls}
              </button>
            )
          })}
          <div className="w-px h-5 bg-border/60 mx-1" />
          <Input
            placeholder="Sök serie, bil eller bana..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px]"
          />
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary focus:border-accent-primary focus:outline-none"
          >
            <option value="name">Namn</option>
            <option value="category">Kategori</option>
            <option value="class">Klass</option>
            <option value="weeks">Veckor</option>
          </select>
          <Button variant="secondary" className="h-10 text-xs" onClick={() => setSortAscending((v) => !v)}>
            {sortAscending ? 'A-Ö' : 'Ö-A'}
          </Button>
        </div>
      </div>

      {/* Series list */}
      <div className="flex justify-between items-center">
        <span className="text-xs text-text-muted">{sortedSeries.length} serier matchar</span>
        <div className="flex gap-3">
          <Button variant="ghost" className="h-7 px-2 text-xs" onClick={() => selectManySeries(allFilteredIds)} disabled={allFilteredIds.length === 0}>
            Välj alla
          </Button>
          <Button variant="ghost" className="h-7 px-2 text-xs" onClick={clearManySeries}>
            Rensa
          </Button>
        </div>
      </div>

      {/* Virtualized list */}
      <div
        className="h-[540px] overflow-y-auto rounded-xl border border-border/60 bg-bg-surface/30 p-2"
        onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      >
        <div className="relative" style={{ height: `${totalHeight}px` }}>
          {visibleSeries.map((entry, index) => {
            const absoluteIndex = visibleStartIndex + index
            const top = absoluteIndex * ROW_HEIGHT
            const selected = selectedSeriesIds.includes(entry.id)
            const licColor = getLicenseColor(entry.license)
            const licLabel = getLicenseLabel(entry.license)

            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => toggleSeries(entry.id)}
                className={cn(
                  'absolute left-0 right-0 flex h-[78px] items-center gap-3 rounded-lg border px-3 text-left transition-all duration-150',
                  selected
                    ? 'border-accent-primary/12 bg-accent-primary/4'
                    : 'border-border/40 bg-bg-surface/40 hover:border-accent-primary/20 hover:bg-bg-surface/80'
                )}
                style={{ top: `${top}px` }}
              >
                <Checkbox
                  checked={selected}
                  readOnly
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-display text-[13px] font-bold text-text-primary line-clamp-1">{entry.title}</div>
                  <div className="text-[11px] text-text-muted mt-0.5">{entry.className} · {entry.weeks.length} veckor</div>
                </div>
                <span
                  className="rounded text-[10px] font-semibold shrink-0"
                  style={{ padding: '3px 8px', color: licColor.text, background: licColor.bg, border: `1px solid ${licColor.border}` }}
                >
                  {licLabel}
                </span>
                <span
                  className="rounded text-[10px] shrink-0"
                  style={{ padding: '3px 8px', background: 'rgba(27,51,84,0.5)', border: '1px solid rgba(38,53,83,0.6)', color: selected ? '#b5c1d7' : '#7d8aa6' }}
                >
                  {categoryLabelMap[entry.categoryId] ?? entry.categoryLabel}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Empty state */}
      {sortedSeries.length === 0 && (
        <div className="rounded-lg border border-border p-4 text-sm text-text-secondary">
          Ingen serie matchade filtret.
        </div>
      )}
    </div>
  )
}
