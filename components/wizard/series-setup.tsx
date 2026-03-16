'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ChevronDown, ChevronUp, Filter } from 'lucide-react'
import type { SeasonScheduleData } from '@/lib/season-schedules/types'
import { splitCars, inferCarBrand } from '@/lib/iracing/cars'
import { BrandEmblem, CarBadge } from '@/components/car-badges'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface SeriesSetupProps {
  data: SeasonScheduleData
  /** Pre-selected series titles (from DB / wizard state) */
  initialSelectedSeriesNames?: string[]
  /** When provided, called with selected series titles instead of navigating */
  onNext?: (seriesNames: string[]) => void
}

interface PersistedSetupState {
  season: string
  selectedCategoryIds: string[]
  selectedClassNames: string[]
  selectedSeriesIds: string[]
}

type SortKey = 'name' | 'category' | 'class' | 'weeks'

const ROW_HEIGHT = 100
const OVERSCAN_ROWS = 6
const defaultSeason = '2026-2'
const storageKey = 'series-setup-state-v1'

const categoryBadgeVariants: Record<string, 'default' | 'road' | 'oval' | 'dirt-road' | 'dirt-oval'> = {
  'sports-car': 'road',
  'formula-car': 'road',
  oval: 'oval',
  'dirt-road': 'dirt-road',
  'dirt-oval': 'dirt-oval',
  unranked: 'default',
}

function inferLicenseBadgeVariant(
  value: string
): 'default' | 'rookie' | 'd' | 'c' | 'b' | 'a' | 'pro' {
  const normalized = value.trim().toLowerCase()
  if (normalized.includes('pro')) return 'pro'
  if (normalized.includes('rookie')) return 'rookie'
  if (/\ba class\b|\ba\(/.test(normalized)) return 'a'
  if (/\bb class\b|\bb\(/.test(normalized)) return 'b'
  if (/\bc class\b|\bc\(/.test(normalized)) return 'c'
  if (/\bd class\b|\bd\(/.test(normalized)) return 'd'
  return 'default'
}

function getLicenseLabel(raw: string): string {
  if (!raw) return 'N/A'
  return raw.split(',')[0]?.trim() ?? raw
}

function normalize(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function CarIndicator({ cars }: { cars: string }) {
  const carList = splitCars(cars)
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLSpanElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  if (carList.length === 0) return null

  const brands = carList.map((c) => inferCarBrand(c))
  const uniqueBrands = Array.from(new Set(brands))
  const showCount = Math.min(uniqueBrands.length, 4)
  const extraCount = uniqueBrands.length - showCount

  const handleEnter = () => {
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect()
      setPos({ top: rect.bottom + 6, left: rect.left })
    }
    setOpen(true)
  }

  const handleLeave = () => {
    setOpen(false)
  }

  return (
    <span
      ref={anchorRef}
      className="relative inline-flex shrink-0 items-center gap-0.5"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <span className="flex -space-x-1.5">
        {uniqueBrands.slice(0, showCount).map((brand) => (
          <span
            key={brand}
            className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-full border border-white/15 bg-black/35"
          >
            <BrandEmblem brand={brand} />
          </span>
        ))}
      </span>
      {extraCount > 0 && (
        <span className="ml-1 text-[11px] text-text-muted">+{extraCount}</span>
      )}

      {open && pos && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed z-[100] rounded-xl border border-border-subtle bg-bg-elevated backdrop-blur-md p-3 shadow-[0_16px_40px_rgba(0,0,0,0.4)] animate-in fade-in duration-100"
          style={{ top: pos.top, left: pos.left, maxWidth: 360 }}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
        >
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            Bil{carList.length > 1 ? 'ar' : ''} ({carList.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {carList.map((car, i) => (
              <CarBadge key={`${car}-${i}`} carModel={car} compact />
            ))}
          </div>
        </div>,
        document.body
      )}
    </span>
  )
}

export function SeriesSetup({ data, initialSelectedSeriesNames, onNext: onNextProp }: SeriesSetupProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const hydratedRef = useRef(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // --- State ---
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    data.categories.map((c) => c.id)
  )
  const [selectedClassNames, setSelectedClassNames] = useState<string[]>([])
  const [selectedSeriesIds, setSelectedSeriesIds] = useState<string[]>(() => {
    if (initialSelectedSeriesNames && initialSelectedSeriesNames.length > 0) {
      const nameSet = new Set(initialSelectedSeriesNames)
      return data.series.filter((s) => nameSet.has(s.title)).map((s) => s.id)
    }
    return []
  })
  const [search, setSearch] = useState(searchParams.get('setup_q') ?? '')
  const [sortKey, setSortKey] = useState<SortKey>(
    (searchParams.get('setup_sort') as SortKey) ?? 'name'
  )
  const [sortAscending, setSortAscending] = useState(
    (searchParams.get('setup_dir') ?? 'asc') === 'asc'
  )
  const [scrollTop, setScrollTop] = useState(0)
  const [filtersOpen, setFiltersOpen] = useState(true)

  // --- Derived data ---
  const availableCategoryIds = useMemo(
    () => new Set(data.categories.map((c) => c.id)),
    [data.categories]
  )
  const availableSeriesIds = useMemo(
    () => new Set(data.series.map((s) => s.id)),
    [data.series]
  )

  const allCategoriesSelected = selectedCategoryIds.length === data.categories.length

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
  const containerHeight = scrollContainerRef.current?.clientHeight ?? 800
  const visibleStartIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN_ROWS)
  const visibleEndIndex = Math.min(
    sortedSeries.length,
    Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + OVERSCAN_ROWS
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
      if (initialSelectedSeriesNames === undefined && Array.isArray(parsed.selectedSeriesIds)) {
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

  const selectAllCategories = () => {
    setSelectedCategoryIds(data.categories.map((c) => c.id))
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

  const resetFilters = () => {
    setSearch('')
    setSelectedCategoryIds(data.categories.map((c) => c.id))
    setSelectedClassNames([])
  }

  const hasActiveFilters = !allCategoriesSelected || selectedClassNames.length > 0 || search.length > 0

  // Navigate to tracks (or call onNextProp when used inside wizard)
  const handleNext = () => {
    if (onNextProp) {
      const selectedTitles = data.series
        .filter((s) => selectedSeriesIds.includes(s.id))
        .map((s) => s.title)
      onNextProp(selectedTitles)
      return
    }
    const params = new URLSearchParams()
    params.set('season', defaultSeason)
    if (selectedCategoryIds.length > 0) params.set('categories', selectedCategoryIds.join(','))
    if (selectedClassNames.length > 0) params.set('classes', selectedClassNames.join(','))
    if (selectedSeriesIds.length > 0) params.set('series', selectedSeriesIds.join(','))
    router.push(`/tracks?${params.toString()}`)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="font-display text-2xl font-bold text-text-primary">Välj dina serier</h2>
          <p className="text-sm text-text-secondary mt-1">
            2026 Season 2 · Markera serier du vill köra, sen fortsätt till banval.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 rounded-full border border-accent-cyan/30 bg-accent-cyan/10 text-accent-cyan text-xs font-display font-semibold">
            {selectedSeriesIds.length} valda
          </span>
          <Button onClick={handleNext} disabled={selectedSeriesIds.length === 0}>
            Fortsätt till Banor →
          </Button>
        </div>
      </div>

      {/* Collapsible filter Card */}
      <Card className="p-0 overflow-hidden">
        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3 text-left cursor-pointer hover:bg-[rgba(26,27,59,0.3)] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-text-muted" />
            <span className="text-sm font-medium text-text-primary">Filter</span>
            {hasActiveFilters && (
              <span className="rounded-full bg-accent-cyan/15 border border-accent-cyan/30 px-2 py-0.5 text-[10px] font-semibold text-accent-cyan">
                Aktiva
              </span>
            )}
          </div>
          {filtersOpen ? (
            <ChevronUp className="h-4 w-4 text-text-muted" />
          ) : (
            <ChevronDown className="h-4 w-4 text-text-muted" />
          )}
        </button>

        {filtersOpen && (
          <div className="space-y-3 border-t border-border/50 px-4 pb-4 pt-3">
            {/* Search + sort row */}
            <div className="grid gap-3 md:grid-cols-[1fr_160px_auto]">
              <Input
                placeholder="Sök serie, bil eller bana..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary focus:border-border-focus focus:outline-none"
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

            {/* Category pills */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={selectAllCategories}
                className={cn(
                  'cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                  allCategoriesSelected
                    ? 'border-accent-cyan/50 bg-accent-cyan/10 text-accent-cyan'
                    : 'border-border text-text-secondary hover:text-text-primary'
                )}
              >
                Alla
              </button>
              {data.categories.map((cat) => {
                const active = selectedCategoryIds.includes(cat.id) && !allCategoriesSelected
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      if (allCategoriesSelected) {
                        setSelectedCategoryIds([cat.id])
                      } else {
                        toggleCategory(cat.id)
                      }
                    }}
                    className={cn(
                      'cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                      active
                        ? 'border-accent-cyan bg-accent-cyan/10 text-text-primary'
                        : 'border-border text-text-secondary hover:text-text-primary'
                    )}
                  >
                    {cat.label}
                  </button>
                )
              })}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="cursor-pointer rounded-full border border-border px-3 py-1.5 text-xs text-text-secondary transition hover:text-text-primary"
                >
                  Rensa filter
                </button>
              )}
            </div>

            {/* Class pills */}
            {availableClasses.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {availableClasses.map((cls) => {
                  const active = selectedClassNames.includes(cls)
                  return (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => toggleClass(cls)}
                      className={cn(
                        'cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all',
                        active
                          ? 'border-accent-cyan/50 bg-accent-cyan/10 text-accent-cyan'
                          : 'border-border/50 bg-[rgba(26,27,59,0.3)] text-text-muted hover:border-border hover:text-text-secondary'
                      )}
                    >
                      {cls}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Series count + bulk actions */}
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
      <Card className="overflow-hidden p-2">
        <div
          ref={scrollContainerRef}
          className="max-h-[calc(100vh-340px)] min-h-[400px] overflow-y-auto"
          onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
        >
          <div className="relative" style={{ height: `${totalHeight}px` }}>
            {visibleSeries.map((entry, index) => {
              const absoluteIndex = visibleStartIndex + index
              const top = absoluteIndex * ROW_HEIGHT
              const selected = selectedSeriesIds.includes(entry.id)
              const licVariant = inferLicenseBadgeVariant(entry.license)
              const licLabel = getLicenseLabel(entry.license)
              const catVariant = categoryBadgeVariants[entry.categoryId] ?? 'default'

              return (
                <div
                  key={entry.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleSeries(entry.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      toggleSeries(entry.id)
                    }
                  }}
                  className={cn(
                    'absolute left-0 right-0 flex h-[100px] cursor-pointer items-start gap-[14px] rounded-lg border p-[14px_16px] text-left transition-all duration-150',
                    selected
                      ? 'border-[rgba(0,255,255,0.55)] bg-[rgba(0,255,255,0.18)] shadow-[inset_3px_0_0_rgba(0,255,255,0.7)]'
                      : 'border-transparent hover:border-border hover:bg-white/[0.03]'
                  )}
                  style={{ top: `${top}px` }}
                >
                  <Checkbox
                    checked={selected}
                    readOnly
                    className="mt-1 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                      <Badge variant={catVariant}>
                        {entry.categoryLabel}
                      </Badge>
                      <Badge variant="default">{entry.className}</Badge>
                      <Badge variant={licVariant}>{licLabel}</Badge>
                      <Badge variant="default">{entry.weeks.length} v</Badge>
                    </div>
                    <div className="font-display text-[15px] font-semibold text-text-primary tracking-[-0.01em] line-clamp-1">{entry.title}</div>
                  </div>
                  <CarIndicator cars={entry.cars} />
                </div>
              )
            })}
          </div>
        </div>
      </Card>

      {/* Empty state */}
      {sortedSeries.length === 0 && (
        <Card className="p-4 text-sm text-text-secondary">
          Ingen serie matchade filtret.
        </Card>
      )}
    </div>
  )
}
