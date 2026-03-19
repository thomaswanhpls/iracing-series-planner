'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { createPortal } from 'react-dom'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Check, ChevronDown, ChevronUp, Filter, Info } from 'lucide-react'
import type { SeasonScheduleData } from '@/lib/season-schedules/types'
import { splitCars, inferCarBrand } from '@/lib/iracing/cars'
import { BrandEmblem, CarBadge } from '@/components/car-badges'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface UserLicenseClasses {
  sportsCar: string
  formulaCar: string
  oval: string
  dirtRoad: string
  dirtOval: string
}

/** Maps a license letter (R/D/C/B/A/Pro/WC) to the prefix used in className */
function licenseLetterToPrefix(cls: string): string {
  const c = cls.trim().toUpperCase()
  if (c === 'ROOKIE' || c === 'R') return 'R'
  if (c === 'D') return 'D'
  if (c === 'C') return 'C'
  if (c === 'B') return 'B'
  if (c === 'A' || c === 'PRO' || c === 'WC') return 'A'
  return 'R'
}

const LICENSE_ORDER = ['Rookie', 'D', 'C', 'B', 'A', 'Pro', 'WC']

/** All category IDs selected by default — user narrows manually */
function buildDefaultCategoryIds(availableCategoryIds: string[]): string[] {
  return availableCategoryIds
}

/** Build class names to pre-select: Rookie → user's license level per discipline */
function buildDefaultClassNames(
  licenses: UserLicenseClasses,
  availableClasses: string[]
): string[] {
  const disciplines: Array<{ license: string; suffix: string }> = [
    { license: licenses.sportsCar, suffix: 'SPORTS CAR' },
    { license: licenses.formulaCar, suffix: 'FORMULA CAR' },
    { license: licenses.oval, suffix: 'OVAL' },
    { license: licenses.dirtRoad, suffix: 'DIRT ROAD' },
    { license: licenses.dirtOval, suffix: 'DIRT OVAL' },
  ]
  const result = new Set<string>()
  for (const { license, suffix } of disciplines) {
    const maxIdx = LICENSE_ORDER.indexOf(license)
    if (maxIdx < 0) continue
    for (let i = 0; i <= maxIdx; i++) {
      const prefix = licenseLetterToPrefix(LICENSE_ORDER[i])
      for (const cls of availableClasses) {
        if (cls.startsWith(`${prefix} Class Series`) && cls.toUpperCase().includes(suffix)) {
          result.add(cls)
        }
      }
    }
  }
  return Array.from(result)
}

interface SeriesSetupProps {
  data: SeasonScheduleData
  /** Pre-selected series titles (from DB / wizard state) */
  initialSelectedSeriesNames?: string[]
  /** When provided, pre-selects class filter pills based on per-discipline license */
  userLicenseClasses?: UserLicenseClasses
  /** When provided, called with selected series titles instead of navigating */
  onNext?: (seriesNames: string[]) => void
  /** When provided, renders a back button in the header */
  onBack?: () => void
}

interface PersistedSetupState {
  season: string
  selectedCategoryIds: string[]
  selectedClassNames: string[]
  selectedSeriesIds: string[]
}

type SortKey = 'name' | 'category' | 'class'

const ROW_HEIGHT = 140
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

/** "C Class Series (SPORTS CAR)" → "C", "Rookie Series (SPORTS CAR)" → "Rookie" */
function getClassLabel(className: string): string {
  const classMatch = className.match(/^([A-Z])\s+Class\s+Series/)
  if (classMatch) return classMatch[1]
  const rookieMatch = className.match(/^Rookie\s+Series/)
  if (rookieMatch) return 'Rookie'
  return className.split(' ')[0] ?? className
}

function normalize(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function CarIndicator({ cars }: { cars: string }) {
  const t = useTranslations('wizard.series')
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
            {t('carsLabel', { count: carList.length })}
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

export function SeriesSetup({ data, initialSelectedSeriesNames, userLicenseClasses, onNext: onNextProp, onBack }: SeriesSetupProps) {
  const t = useTranslations('wizard.series')
  const tCommon = useTranslations('common')
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
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [showOnlySelected, setShowOnlySelected] = useState(false)

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
      if (s.className != null) unique.add(s.className)
    }
    return Array.from(unique).sort((a, b) => a.localeCompare(b))
  }, [data.series, selectedCategoryIds])

  const availableClassNames = useMemo(() => new Set(availableClasses), [availableClasses])

  // Available car brands from category-filtered series
  const availableBrands = useMemo(() => {
    const unique = new Set<string>()
    for (const s of categoryFilteredSeries) {
      for (const car of splitCars(s.cars)) unique.add(inferCarBrand(car))
    }
    return Array.from(unique).sort()
  }, [categoryFilteredSeries])

  // Brand-filtered series
  const brandFilteredSeries = useMemo(() => {
    if (selectedBrands.length === 0) return categoryFilteredSeries
    return categoryFilteredSeries.filter((s) => {
      const brands = splitCars(s.cars).map(inferCarBrand)
      return selectedBrands.some((b) => brands.includes(b))
    })
  }, [categoryFilteredSeries, selectedBrands])

  // Apply search filter on top of category/class/brand filtering
  const searchFilteredSeries = useMemo(() => {
    const query = normalize(search)
    const base = showOnlySelected
      ? brandFilteredSeries.filter((s) => selectedSeriesIds.includes(s.id))
      : brandFilteredSeries
    if (!query) return base
    return base.filter((entry) => {
      if (normalize(entry.title).includes(query)) return true
      if (normalize(entry.className ?? '').includes(query)) return true
      if (normalize(entry.cars).includes(query)) return true
      return entry.weeks.some((week) => normalize(week.track).includes(query))
    })
  }, [search, brandFilteredSeries, showOnlySelected, selectedSeriesIds])

  // Sort — UNRANKED always last regardless of sort key
  const sortedSeries = useMemo(() => {
    const entries = [...searchFilteredSeries]
    entries.sort((a, b) => {
      const aUnranked = a.categoryId === 'unranked'
      const bUnranked = b.categoryId === 'unranked'
      if (aUnranked && !bUnranked) return 1
      if (!aUnranked && bUnranked) return -1
      let cmp = 0
      if (sortKey === 'name') cmp = a.title.localeCompare(b.title)
      if (sortKey === 'category') cmp = a.categoryLabel.localeCompare(b.categoryLabel)
      if (sortKey === 'class') cmp = (a.className ?? '').localeCompare(b.className ?? '')
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

    if (userLicenseClasses) {
      // Wizard mode: always derive category + class defaults from license
      // (ignore localStorage for filters, user hasn't explicitly set them here)
      const allCategoryIds = data.categories.map((c) => c.id)
      const defaultCats = buildDefaultCategoryIds(allCategoryIds)
      if (defaultCats.length > 0) setSelectedCategoryIds(defaultCats)
      const defaultClasses = buildDefaultClassNames(userLicenseClasses, availableClasses)
      if (defaultClasses.length > 0) setSelectedClassNames(defaultClasses)
      // Still restore saved series selection from localStorage
      if (initialSelectedSeriesNames === undefined) {
        try {
          const raw = localStorage.getItem(storageKey)
          if (raw) {
            const parsed = JSON.parse(raw) as Partial<PersistedSetupState>
            if (Array.isArray(parsed.selectedSeriesIds)) {
              setSelectedSeriesIds(
                parsed.selectedSeriesIds.filter(
                  (id): id is string => typeof id === 'string' && availableSeriesIds.has(id)
                )
              )
            }
          }
        } catch { /* ignore */ }
      }
      hydratedRef.current = true
      return
    }

    // Standalone mode: restore full filter + series state from localStorage
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

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    )
  }

  const resetFilters = () => {
    setSearch('')
    setSelectedCategoryIds(data.categories.map((c) => c.id))
    setSelectedClassNames([])
    setSelectedBrands([])
  }

  const hasActiveFilters = !allCategoriesSelected || selectedClassNames.length > 0 || selectedBrands.length > 0 || search.length > 0

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-text-primary">{t('title')}</h2>
          <p className="text-sm text-text-secondary mt-1">{t('subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onBack && (
            <Button variant="ghost" onClick={onBack}>
              {tCommon('back')}
            </Button>
          )}
          <span className="px-3 py-1.5 rounded-full border border-accent-cyan/30 bg-accent-cyan/10 text-accent-cyan text-xs font-display font-semibold">
            {t('selected', { count: selectedSeriesIds.length })}
          </span>
          <Button onClick={handleNext} disabled={selectedSeriesIds.length === 0}>
            {onNextProp ? t('save') : t('continueToTracks')}
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
                {t('filterActive')}
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
            <div className="grid gap-3 grid-cols-[1fr_auto] md:grid-cols-[1fr_160px_auto]">
              <Input
                className="col-span-2 md:col-span-1"
                placeholder={t('search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="relative">
                <select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as SortKey)}
                  className="w-full appearance-none rounded-sm border border-border bg-bg-elevated pl-4 pr-9 py-[10px] font-display text-[14px] text-text-secondary transition-[border-color,box-shadow] focus:border-border-focus focus:shadow-[0_0_5px_rgba(0,232,224,0.3)] focus:outline-none cursor-pointer [&>option]:bg-bg-elevated [&>option]:text-text-primary"
                >
                  <option value="name">{t('sort.name')}</option>
                  <option value="category">{t('sort.category')}</option>
                  <option value="class">{t('sort.class')}</option>
                  <option value="weeks">{t('sort.weeks')}</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              </div>
              <Button variant="secondary" className="h-10 text-xs" onClick={() => setSortAscending((v) => !v)}>
                {sortAscending ? t('sortAsc') : t('sortDesc')}
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
                {t('filter.allCategories')}
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
                  {t('filter.resetFilters')}
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

            {/* Car brand pills */}
            {availableBrands.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="self-center text-[10px] font-semibold uppercase tracking-wider text-text-muted mr-1">{t('filter.brands')}</span>
                {availableBrands.map((brand) => {
                  const active = selectedBrands.includes(brand)
                  return (
                    <button
                      key={brand}
                      type="button"
                      onClick={() => toggleBrand(brand)}
                      className={cn(
                        'cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all',
                        active
                          ? 'border-accent-magenta/50 bg-accent-magenta/10 text-accent-magenta'
                          : 'border-border/50 bg-[rgba(26,27,59,0.3)] text-text-muted hover:border-border hover:text-text-secondary'
                      )}
                    >
                      {brand}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Filter info */}
      {userLicenseClasses && (
        <div className="flex items-start gap-2 rounded-md border border-border/40 bg-bg-elevated/50 px-3 py-2.5 text-[11px] text-text-muted">
          <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-accent-cyan/60" />
          <span>{t('filterInfo')}</span>
        </div>
      )}

      {/* Series count + bulk actions */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="text-xs text-text-muted">{t('seriesMatch', { count: sortedSeries.length })}</span>
          <button
            type="button"
            onClick={() => setShowOnlySelected((v) => !v)}
            className={cn(
              'rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all',
              showOnlySelected
                ? 'border-accent-cyan/50 bg-accent-cyan/10 text-accent-cyan'
                : 'border-border/50 text-text-muted hover:text-text-secondary'
            )}
          >
            {t('showOnlySelected')}
          </button>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" className="h-7 px-2 text-xs" onClick={() => selectManySeries(allFilteredIds)} disabled={allFilteredIds.length === 0}>
            {t('selectAll')}
          </Button>
          <Button variant="ghost" className="h-7 px-2 text-xs" onClick={clearManySeries}>
            {t('clear')}
          </Button>
        </div>
      </div>

      {/* Virtualized list */}
      <Card className="overflow-hidden p-2">
        <div
          ref={scrollContainerRef}
          className="max-h-[calc(100vh-240px)] min-h-[360px] overflow-y-auto md:max-h-[calc(100vh-340px)]"
          onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
        >
          <div className="relative" style={{ height: `${totalHeight}px` }}>
            {visibleSeries.map((entry, index) => {
              const absoluteIndex = visibleStartIndex + index
              const top = absoluteIndex * ROW_HEIGHT
              const selected = selectedSeriesIds.includes(entry.id)
              const licVariant = inferLicenseBadgeVariant(entry.className)
              const licLabel = getClassLabel(entry.className)
              const catVariant = categoryBadgeVariants[entry.categoryId] ?? 'default'

              return (
                <button
                  key={entry.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleSeries(entry.id)}
                  className={cn(
                    'absolute left-0 right-0 flex h-[140px] w-full cursor-pointer items-start gap-[14px] rounded-lg border p-[14px_16px] text-left transition-all duration-150',
                    selected
                      ? 'border-[rgba(0,232,224,0.55)] bg-[rgba(0,232,224,0.18)] shadow-[inset_3px_0_0_rgba(0,232,224,0.7)]'
                      : 'border-transparent hover:border-border hover:bg-white/[0.03]'
                  )}
                  style={{ top: `${top}px` }}
                >
                  {/* Decorative check indicator — cannot use <Checkbox> (renders <button>) inside a <button> */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      'mt-1 inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-sm border transition-all duration-150',
                      selected
                        ? 'border-accent-cyan bg-[rgba(0,255,255,0.15)] shadow-[0_0_8px_rgba(0,255,255,0.35)]'
                        : 'border-white/25 bg-white/[0.03]'
                    )}
                  >
                    {selected && <Check className="h-3.5 w-3.5 stroke-[2.5]" style={{ color: '#00ffff' }} />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                      <Badge variant={catVariant}>
                        {entry.categoryLabel}
                      </Badge>
                      <Badge variant={licVariant}>{licLabel}</Badge>
                      <Badge variant="default">{entry.weeks.length}{t('weeksShort')}</Badge>
                    </div>
                    <div className="font-display text-[15px] font-semibold text-text-primary tracking-[-0.01em]">{entry.title}</div>
                  </div>
                  <CarIndicator cars={entry.cars} />
                </button>
              )
            })}
          </div>
        </div>
      </Card>

      {/* Empty state */}
      {sortedSeries.length === 0 && (
        <Card className="p-4 text-sm text-text-secondary">
          {t('noResults')}
        </Card>
      )}
    </div>
  )
}
