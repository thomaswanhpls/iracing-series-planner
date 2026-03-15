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
  const allFilteredIds = sortedSeries.map((s) => s.id)
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

  // --- Placeholder JSX (replaced in Task 3) ---
  return <div>SeriesSetup placeholder</div>
}
