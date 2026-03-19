'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TBody, Td, Th, THead, Tr } from '@/components/ui/table'
import { splitCars } from '@/lib/iracing/cars'
import { CarBadge } from '@/components/car-badges'
import {
  CalendarDays,
  ChevronDown,
  CloudRain,
  Flag,
  Gauge,
  Thermometer,
  Wind,
} from 'lucide-react'
import type { SeasonScheduleData, SeasonSeries } from '@/lib/season-schedules/types'

interface SeasonScheduleBrowserProps {
  data: SeasonScheduleData
}

const categoryBadgeVariants: Record<string, 'default' | 'road' | 'oval' | 'dirt-road' | 'dirt-oval'> = {
  'sports-car': 'road',
  'formula-car': 'road',
  oval: 'oval',
  'dirt-road': 'dirt-road',
  'dirt-oval': 'dirt-oval',
  unranked: 'default',
}


function normalize(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}


function inferLicenseBadgeVariant(
  value: string
): 'default' | 'rookie' | 'd' | 'c' | 'b' | 'a' | 'pro' {
  const normalized = normalize(value)
  if (normalized.includes('pro')) return 'pro'
  if (normalized.includes('rookie')) return 'rookie'
  if (/\ba class\b|\ba\(/.test(normalized)) return 'a'
  if (/\bb class\b|\bb\(/.test(normalized)) return 'b'
  if (/\bc class\b|\bc\(/.test(normalized)) return 'c'
  if (/\bd class\b|\bd\(/.test(normalized)) return 'd'
  return 'default'
}

interface WeekSignal {
  label: string
  value: string
  tone?: 'default' | 'positive' | 'warning'
  icon: React.ComponentType<{ className?: string }>
}

function parseWeekSignals(notes: string): WeekSignal[] {
  if (!notes) return []

  const normalized = notes.replace(/\s+/g, ' ').trim()
  if (!normalized) return []

  const signals: WeekSignal[] = []
  const tempMatch = normalized.match(/(\d{2,3}°F\/\d{1,2}°C)/i)
  const rainMatch = normalized.match(/Rain chance\s*([A-Za-z0-9%]+)/i)
  const windMatch = normalized.match(/Wind(?:\s*(?:speed|gusts?)?)?\s*[:\-]?\s*([^,.;]+)/i)
  const startMatch = normalized.match(/(Standing start|Rolling start)/i)
  const cautionMatch = normalized.match(/(Cautions disabled|Local [^,.;]*cautions)/i)

  if (tempMatch) {
    signals.push({
      label: 'Temp',
      value: tempMatch[1],
      icon: Thermometer,
    })
  }

  if (rainMatch) {
    const rainValue = rainMatch[1]
    const lower = rainValue.toLowerCase()
    const tone = lower === 'none' || lower === '0%' ? 'positive' : 'warning'
    signals.push({
      label: 'Regn',
      value: rainValue,
      tone,
      icon: CloudRain,
    })
  }

  if (windMatch) {
    signals.push({
      label: 'Vind',
      value: windMatch[1].trim(),
      icon: Wind,
    })
  }

  if (startMatch) {
    signals.push({
      label: 'Start',
      value: startMatch[1],
      icon: Flag,
    })
  }

  if (cautionMatch) {
    const value = cautionMatch[1].trim()
    signals.push({
      label: 'Caution',
      value,
      tone: value.toLowerCase().includes('disabled') ? 'positive' : 'default',
      icon: Gauge,
    })
  }

  return signals
}

function formatCompactDate(value: string): string {
  if (!value) return '-'
  const parsed = new Date(`${value}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) return value
  return new Intl.DateTimeFormat('sv-SE', {
    day: 'numeric',
    month: 'short',
  })
    .format(parsed)
    .replace('.', '')
}

function formatCompactReferenceSession(value: string): string {
  if (!value) return '-'

  const match = value.match(/^(\d{4}-\d{2}-\d{2})(?:\s+(\d{2}:\d{2}))?(?:\s+(.*))?$/)
  if (!match) return value

  const [, rawDate, rawTime, rawSuffix] = match
  const dateLabel = formatCompactDate(rawDate)
  const timeLabel = rawTime ? ` ${rawTime}` : ''
  const suffix = rawSuffix ? ` ${rawSuffix}` : ''
  return `${dateLabel}${timeLabel}${suffix}`.trim()
}

function parseFahrenheit(value: string): number | null {
  const match = value.match(/(\d{2,3})°F/i)
  if (!match) return null
  const parsed = Number.parseInt(match[1], 10)
  return Number.isFinite(parsed) ? parsed : null
}

function parseRainPercent(value: string): number | null {
  if (!value) return null
  const normalized = value.trim().toLowerCase()
  if (normalized === 'none') return 0
  const match = normalized.match(/(\d{1,3})%/)
  if (!match) return null
  const parsed = Number.parseInt(match[1], 10)
  return Number.isFinite(parsed) ? parsed : null
}

function getWeekSignalClasses(signal: WeekSignal): string {
  if (signal.label === 'Temp') {
    const fahrenheit = parseFahrenheit(signal.value)
    if (fahrenheit == null) {
      return 'border-border bg-bg-elevated text-text-primary'
    }
    if (fahrenheit < 60) {
      return 'border-sky-500/60 bg-sky-500/20 text-sky-100'
    }
    if (fahrenheit < 70) {
      return 'border-cyan-500/60 bg-cyan-500/20 text-cyan-100'
    }
    if (fahrenheit < 80) {
      return 'border-emerald-500/60 bg-emerald-500/20 text-emerald-100'
    }
    if (fahrenheit < 90) {
      return 'border-amber-500/70 bg-amber-500/25 text-amber-100'
    }
    return 'border-rose-500/70 bg-rose-500/25 text-rose-100'
  }

  if (signal.label === 'Regn') {
    const rainPercent = parseRainPercent(signal.value)
    if (rainPercent == null) {
      return 'border-border bg-bg-elevated text-text-primary'
    }
    if (rainPercent === 0) {
      return 'border-emerald-500/70 bg-emerald-500/25 text-emerald-100'
    }
    if (rainPercent <= 20) {
      return 'border-lime-500/70 bg-lime-500/25 text-lime-100'
    }
    if (rainPercent <= 40) {
      return 'border-amber-500/70 bg-amber-500/25 text-amber-100'
    }
    return 'border-rose-500/70 bg-rose-500/25 text-rose-100'
  }

  if (signal.label === 'Start') {
    return 'border-zinc-700/80 bg-black/35 text-zinc-100'
  }

  if (signal.label === 'Caution') {
    if (signal.tone === 'positive') {
      return 'border-status-owned/70 bg-black/35 text-zinc-100'
    }
    if (signal.tone === 'warning') {
      return 'border-status-missing/70 bg-black/35 text-zinc-100'
    }
    return 'border-zinc-700/80 bg-black/35 text-zinc-100'
  }

  if (signal.tone === 'positive') {
    return 'border-status-owned/70 bg-status-owned/25 text-text-primary'
  }
  if (signal.tone === 'warning') {
    return 'border-status-missing/70 bg-status-missing/25 text-text-primary'
  }
  return 'border-border bg-bg-elevated text-text-primary'
}

export function SeasonScheduleBrowser({ data }: SeasonScheduleBrowserProps) {
  const t = useTranslations('seriesBrowser')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchParamsString = searchParams.toString()
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [activeClass, setActiveClass] = useState<string>('all')
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>('')
  const [showPrioritizedOnly, setShowPrioritizedOnly] = useState(false)
  const parsedSearchParams = useMemo(
    () => new URLSearchParams(searchParamsString),
    [searchParamsString]
  )

  const prioritizedSeriesIds = useMemo(() => {
    const raw = parsedSearchParams.get('series')
    if (!raw) return []
    return raw
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)
  }, [parsedSearchParams])
  const prioritizedSeriesIdSet = useMemo(
    () => new Set(prioritizedSeriesIds),
    [prioritizedSeriesIds]
  )

  useEffect(() => {
    const categoryParam = parsedSearchParams.get('categories') ?? parsedSearchParams.get('category')
    const classParam = parsedSearchParams.get('classes') ?? parsedSearchParams.get('class')
    const seriesParam = parsedSearchParams.get('series')
    const selectedParam = parsedSearchParams.get('selected')
    const searchParam = parsedSearchParams.get('q')
    const prioritizedOnlyParam = parsedSearchParams.get('prioritized') === '1'

    if (searchParam) setSearch(searchParam)
    else setSearch('')
    if (categoryParam) {
      const firstCategory = categoryParam.split(',').map((entry) => entry.trim()).find(Boolean)
      if (firstCategory) setActiveCategory(firstCategory)
    }
    else setActiveCategory('all')
    if (classParam) {
      const firstClass = classParam.split(',').map((entry) => entry.trim()).find(Boolean)
      if (firstClass) setActiveClass(firstClass)
    }
    else setActiveClass('all')
    if (selectedParam) {
      const selected = selectedParam.trim()
      if (selected) setSelectedSeriesId(selected)
      else setSelectedSeriesId('')
    } else if (seriesParam) {
      const firstSeries = seriesParam.split(',').map((entry) => entry.trim()).find(Boolean)
      if (firstSeries) setSelectedSeriesId(firstSeries)
      else setSelectedSeriesId('')
    } else setSelectedSeriesId('')

    setShowPrioritizedOnly(prioritizedOnlyParam)
  }, [parsedSearchParams])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search)
    }, 250)

    return () => window.clearTimeout(timeoutId)
  }, [search])

  const classes = useMemo(() => {
    const unique = new Set<string>()
    for (const series of data.series) {
      unique.add(series.className)
    }

    return Array.from(unique).sort((a, b) => a.localeCompare(b))
  }, [data.series])

  const filteredSeries = useMemo(() => {
    const normalizedSearch = normalize(search)

    return data.series.filter((series) => {
      if (activeCategory !== 'all' && series.categoryId !== activeCategory) return false
      if (activeClass !== 'all' && series.className !== activeClass) return false
      if (showPrioritizedOnly && !prioritizedSeriesIdSet.has(series.id)) return false

      if (!normalizedSearch) return true

      const inTitle = normalize(series.title).includes(normalizedSearch)
      const inClass = normalize(series.className).includes(normalizedSearch)
      const inTracks = series.weeks.some((week) => normalize(week.track).includes(normalizedSearch))

      return inTitle || inClass || inTracks
    })
  }, [activeCategory, activeClass, data.series, prioritizedSeriesIdSet, search, showPrioritizedOnly])

  const sortedSeries = useMemo(() => {
    return [...filteredSeries].sort((a, b) => {
      const aPriority = prioritizedSeriesIdSet.has(a.id) ? 1 : 0
      const bPriority = prioritizedSeriesIdSet.has(b.id) ? 1 : 0
      if (aPriority !== bPriority) return bPriority - aPriority
      return a.title.localeCompare(b.title)
    })
  }, [filteredSeries, prioritizedSeriesIdSet])

  useEffect(() => {
    if (sortedSeries.length === 0) {
      setSelectedSeriesId('')
      return
    }

    const stillExists = sortedSeries.some((series) => series.id === selectedSeriesId)
    if (!stillExists) {
      setSelectedSeriesId(sortedSeries[0].id)
    }
  }, [selectedSeriesId, sortedSeries])

  const selectedSeries = useMemo(() => {
    return sortedSeries.find((series) => series.id === selectedSeriesId) ?? null
  }, [selectedSeriesId, sortedSeries])

  useEffect(() => {
    const params = new URLSearchParams(searchParamsString)

    if (debouncedSearch) params.set('q', debouncedSearch)
    else params.delete('q')

    if (activeCategory !== 'all') params.set('category', activeCategory)
    else params.delete('category')
    params.delete('categories')

    if (activeClass !== 'all') params.set('class', activeClass)
    else params.delete('class')
    params.delete('classes')

    if (selectedSeriesId) params.set('selected', selectedSeriesId)
    else params.delete('selected')

    if (showPrioritizedOnly) params.set('prioritized', '1')
    else params.delete('prioritized')

    const current = searchParamsString
    const next = params.toString()
    if (current === next) return
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false })
  }, [
    activeCategory,
    activeClass,
    pathname,
    router,
    debouncedSearch,
    searchParamsString,
    selectedSeriesId,
    showPrioritizedOnly,
  ])

  const resetFilters = () => {
    setSearch('')
    setActiveCategory('all')
    setActiveClass('all')
    setShowPrioritizedOnly(false)
  }

  const planningSeriesIds =
    prioritizedSeriesIds.length > 0
      ? prioritizedSeriesIds
      : selectedSeriesId
        ? [selectedSeriesId]
        : []

  const planningParams = new URLSearchParams()
  if (planningSeriesIds.length > 0) {
    planningParams.set('series', planningSeriesIds.join(','))
  }
  const costsHref = planningParams.toString()
    ? `/dashboard/costs?${planningParams.toString()}`
    : '/dashboard/costs'

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">{t('title')}</h2>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Card className="p-3">
          <div className="text-xs uppercase tracking-wider text-text-muted">{t('categories')}</div>
          <div className="mt-1 font-display text-2xl font-bold">{data.categories.length}</div>
        </Card>
        <Card className="p-3">
          <div className="text-xs uppercase tracking-wider text-text-muted">{t('series')}</div>
          <div className="mt-1 font-display text-2xl font-bold">{data.series.length}</div>
        </Card>
        <Card className="p-3">
          <div className="text-xs uppercase tracking-wider text-text-muted">{t('showing')}</div>
          <div className="mt-1 font-display text-2xl font-bold">{sortedSeries.length}</div>
        </Card>
        <Card className="p-3">
          <div className="text-xs uppercase tracking-wider text-text-muted">{t('prioritized')}</div>
          <div className="mt-1 font-display text-2xl font-bold">{prioritizedSeriesIds.length}</div>
        </Card>
      </div>

      <Card className="space-y-4 p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('searchPlaceholder')}
          />
          <div className="relative">
            <select
              value={activeClass}
              onChange={(event) => setActiveClass(event.target.value)}
              className="w-full appearance-none rounded-sm border border-border bg-bg-elevated pl-3 pr-9 py-2 font-display text-sm text-text-secondary transition-[border-color,box-shadow] focus:border-border-focus focus:shadow-[0_0_5px_rgba(0,232,224,0.3)] focus:outline-none cursor-pointer [&>option]:bg-bg-elevated [&>option]:text-text-primary"
            >
              <option value="all">{t('allClasses')}</option>
              {classes.map((className) => (
                <option key={className} value={className}>
                  {className}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`rounded-full border px-3 py-1.5 text-xs transition ${
              activeCategory === 'all'
                ? 'border-accent-cyan bg-accent-cyan/10 text-accent-cyan'
                : 'border-border text-text-secondary hover:text-text-primary'
            }`}
          >
            {t('all')}
          </button>
          {data.categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setActiveCategory(category.id)}
              className={`rounded-full border px-3 py-1.5 text-xs transition ${
                activeCategory === category.id
                  ? 'border-accent-cyan/50 bg-accent-cyan/10 text-accent-cyan'
                  : 'border-border text-text-secondary hover:text-text-primary'
              }`}
            >
              {category.label}
            </button>
          ))}
          {prioritizedSeriesIds.length > 0 && (
            <button
              type="button"
              onClick={() => setShowPrioritizedOnly((value) => !value)}
              className={`rounded-full border px-3 py-1.5 text-xs transition ${
                showPrioritizedOnly
                  ? 'border-accent-cyan/50 bg-accent-cyan/10 text-accent-cyan'
                  : 'border-border text-text-secondary hover:text-text-primary'
              }`}
            >
              {t('prioritizedOnly')}
            </button>
          )}
          <button
            type="button"
            onClick={resetFilters}
            className="rounded-full border border-border px-3 py-1.5 text-xs text-text-secondary transition hover:text-text-primary"
          >
            {t('resetFilters')}
          </button>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <Card className="h-[50vh] md:h-[70vh] overflow-y-auto p-2">
          <div className="space-y-1">
            {sortedSeries.map((series) => {
              const isActive = selectedSeries?.id === series.id
              const prioritized = prioritizedSeriesIdSet.has(series.id)
              return (
                <button
                  key={series.id}
                  type="button"
                  onClick={() => setSelectedSeriesId(series.id)}
                  className={`w-full rounded-lg border p-3 text-left transition ${
                    isActive
                      ? 'border-[rgba(0,255,255,0.55)] bg-[rgba(0,255,255,0.18)]'
                      : 'border-transparent hover:border-border hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge variant={categoryBadgeVariants[series.categoryId] ?? 'default'}>
                      {series.categoryLabel}
                    </Badge>
                    <Badge variant="default">{series.className}</Badge>
                    <Badge variant="default">{series.weeks.length} v</Badge>
                    {prioritized && <Badge variant="default">{t('prioritizedBadge')}</Badge>}
                  </div>
                  <div className="text-sm font-medium text-text-primary">{series.title}</div>
                </button>
              )
            })}

            {sortedSeries.length === 0 && (
              <div className="rounded-lg border border-border p-4 text-sm text-text-secondary">
                {t('noResults')}
              </div>
            )}
          </div>
        </Card>

        <Card className="h-[50vh] md:h-[70vh] overflow-y-auto p-0">
          {selectedSeries ? (
            <SeriesDetails series={selectedSeries} />
          ) : (
            <div className="p-6 text-sm text-text-secondary">{t('selectSeriesPrompt')}</div>
          )}
        </Card>
      </div>
    </div>
  )
}

function WeekSignalBadge({ signal }: { signal: WeekSignal }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] leading-5 ${getWeekSignalClasses(signal)}`}
    >
      <signal.icon className="h-4 w-4" />
      <span className="font-semibold">{signal.label}:</span>
      <span className="font-medium">{signal.value}</span>
    </span>
  )
}

function SeriesDetails({ series }: { series: SeasonSeries }) {
  const t = useTranslations('seriesBrowser')
  const cars = splitCars(series.cars)
  const licenseVariant = inferLicenseBadgeVariant(series.license)

  return (
    <div className="space-y-4 p-4">
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge variant={categoryBadgeVariants[series.categoryId] ?? 'default'}>
            {series.categoryLabel}
          </Badge>
          <Badge className="bg-accent-cyan/20 text-accent-cyan">{series.className}</Badge>
          <Badge variant={licenseVariant}>{series.license || t('noLicense')}</Badge>
          <Badge className="bg-bg-elevated text-text-primary">{series.frequency || t('noFrequency')}</Badge>
          <Badge variant="default">PDF p. {series.pdfPage || '-'}</Badge>
        </div>
        <h3 className="font-display text-lg font-bold text-text-primary">{series.title}</h3>
      </div>

      <div className="space-y-2">
        <div className="grid gap-2 rounded-lg border border-border/70 bg-[rgba(26,27,59,0.3)] p-3">
          <div className="text-xs uppercase tracking-wider text-text-muted">{t('car')}</div>
          {cars.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {cars.map((carModel, index) => (
                <CarBadge key={`${series.id}-car-${index}`} carModel={carModel} />
              ))}
            </div>
          ) : (
            <div className="text-sm text-text-secondary">-</div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <THead>
            <Tr>
              <Th>{t('track')}</Th>
              <Th className="w-24">{t('length')}</Th>
              <Th className="w-40">{t('reference')}</Th>
            </Tr>
          </THead>
          <TBody>
            {series.weeks.map((week, index) => (
              <Tr
                key={`${series.id}-${week.week}-${week.startDate}-${week.track}-${index}`}
                className="align-top hover:bg-[rgba(26,27,59,0.35)]"
              >
                <Td className="py-2">
                  <div className="h-full min-h-[64px] rounded-lg border border-border/60 bg-gradient-to-r from-[rgba(26,27,59,0.85)] via-[rgba(26,27,59,0.65)] to-bg-surface/75 p-2.5">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="inline-flex min-w-7 items-center justify-center rounded-md border border-accent-cyan/40 bg-accent-cyan/20 px-1.5 py-0.5 font-display text-sm font-semibold text-text-primary">
                        {t('weekPrefix')}{week.week}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-bg-elevated px-2 py-0.5 text-text-primary">
                        <CalendarDays className="h-3.5 w-3.5 text-accent-cyan" />
                        <span className="text-sm font-semibold">{formatCompactDate(week.startDate)}</span>
                      </span>
                    </div>
                    <div className="text-lg font-semibold leading-normal text-text-primary">{week.track || '-'}</div>
                    {week.notes && (
                      <div className="mt-3">
                        <div className="flex flex-wrap gap-2.5">
                          {parseWeekSignals(week.notes).map((signal, signalIndex) => (
                            <WeekSignalBadge
                              key={`${series.id}-${index}-${signal.label}-${signalIndex}`}
                              signal={signal}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Td>
                <Td className="py-2 text-sm font-medium text-text-primary">{week.length || '-'}</Td>
                <Td className="py-2 text-sm text-text-secondary">
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-[rgba(26,27,59,0.7)] px-2 py-1">
                    <CalendarDays className="h-3.5 w-3.5 text-accent-cyan" />
                    {formatCompactReferenceSession(week.referenceSession)}
                  </span>
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </div>
    </div>
  )
}
