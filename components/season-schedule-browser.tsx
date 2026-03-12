'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TBody, Td, Th, THead, Tr } from '@/components/ui/table'
import {
  CalendarDays,
  CloudRain,
  DollarSign,
  Flag,
  Gauge,
  MapPin,
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

const knownCarBrands = [
  'Aston Martin',
  'Mercedes-AMG',
  'Mercedes Benz',
  'Alfa Romeo',
  'Lamborghini',
  'Chevrolet',
  'McLaren',
  'Renault',
  'Porsche',
  'Ferrari',
  'Toyota',
  'Nissan',
  'Mazda',
  'Cadillac',
  'Hyundai',
  'Volkswagen',
  'BMW',
  'Ford',
  'Kia',
] as const

const brandAccentByName: Record<string, { from: string; to: string; ring: string; mono: string }> = {
  'Aston Martin': { from: '#8FD694', to: '#2D6A4F', ring: '#A7F3D0', mono: 'AM' },
  'Mercedes-AMG': { from: '#B8C0FF', to: '#4A4E69', ring: '#C7D2FE', mono: 'AMG' },
  'Mercedes Benz': { from: '#B8C0FF', to: '#4A4E69', ring: '#C7D2FE', mono: 'MB' },
  'Alfa Romeo': { from: '#FF8FA3', to: '#9D0208', ring: '#FECACA', mono: 'AR' },
  Lamborghini: { from: '#FDE68A', to: '#92400E', ring: '#FDE68A', mono: 'L' },
  Chevrolet: { from: '#FDE047', to: '#854D0E', ring: '#FEF08A', mono: 'C' },
  McLaren: { from: '#FB923C', to: '#C2410C', ring: '#FDBA74', mono: 'M' },
  Renault: { from: '#FACC15', to: '#A16207', ring: '#FDE047', mono: 'R' },
  Porsche: { from: '#FCA5A5', to: '#991B1B', ring: '#FECACA', mono: 'P' },
  Ferrari: { from: '#F87171', to: '#B91C1C', ring: '#FCA5A5', mono: 'F' },
  Toyota: { from: '#FCA5A5', to: '#7F1D1D', ring: '#FECACA', mono: 'T' },
  Nissan: { from: '#FCA5A5', to: '#7F1D1D', ring: '#FECACA', mono: 'N' },
  Mazda: { from: '#C4B5FD', to: '#5B21B6', ring: '#DDD6FE', mono: 'MZ' },
  Cadillac: { from: '#93C5FD', to: '#1D4ED8', ring: '#BFDBFE', mono: 'CD' },
  Hyundai: { from: '#93C5FD', to: '#1D4ED8', ring: '#BFDBFE', mono: 'H' },
  Volkswagen: { from: '#93C5FD', to: '#1D4ED8', ring: '#BFDBFE', mono: 'VW' },
  BMW: { from: '#93C5FD', to: '#1E40AF', ring: '#BFDBFE', mono: 'BMW' },
  Ford: { from: '#60A5FA', to: '#1D4ED8', ring: '#93C5FD', mono: 'F' },
  Kia: { from: '#FDA4AF', to: '#9F1239', ring: '#FBCFE8', mono: 'K' },
}

function normalize(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function splitCars(value: string): string[] {
  if (!value) return []
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

function inferCarBrand(modelName: string): string {
  const normalized = normalize(modelName)
  for (const brand of knownCarBrands) {
    if (normalized.startsWith(normalize(brand))) return brand
  }
  const firstToken = modelName.trim().split(/\s+/)[0]
  return firstToken || 'Okänt märke'
}

function BrandEmblem({ brand }: { brand: string }) {
  const accent = brandAccentByName[brand] ?? {
    from: '#9CA3AF',
    to: '#374151',
    ring: '#D1D5DB',
    mono: brand.slice(0, 2).toUpperCase(),
  }
  const gradientId = `brand-emblem-${brand.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`

  return (
    <span className="inline-flex h-5 w-5 items-center justify-center" aria-hidden>
      <svg viewBox="0 0 32 32" className="h-5 w-5">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={accent.from} />
            <stop offset="100%" stopColor={accent.to} />
          </linearGradient>
        </defs>
        <circle cx="16" cy="16" r="15" fill={`url(#${gradientId})`} />
        <circle cx="16" cy="16" r="14" fill="none" stroke={accent.ring} strokeWidth="1.4" opacity="0.9" />
        <text
          x="16"
          y="19"
          textAnchor="middle"
          fontSize={accent.mono.length > 2 ? '8' : '10'}
          fontFamily="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial"
          fontWeight="700"
          fill="#FFFFFF"
          letterSpacing="0.4"
        >
          {accent.mono}
        </text>
      </svg>
    </span>
  )
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
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-2xl font-bold">Seriescheman 2026 S2</h2>
          <Badge variant="default">Valfritt steg</Badge>
        </div>
        <p className="text-sm text-text-secondary">
          Valfritt granskningssteg: kontrollera schema och detaljer för dina valda serier. Själva urvalet görs
          primärt i Setup.
        </p>
      </div>

      <Card className="space-y-3 border-accent-primary/30 bg-accent-primary/5 p-4">
        <div>
          <h3 className="font-display text-base font-semibold text-text-primary">Rekommenderat flöde</h3>
          <p className="mt-1 text-sm text-text-secondary">
            1. Välj serier i Setup. 2. (Valfritt) granska schema här. 3. Markera vilka banor du äger i Banor.
            4. Gå till kostnadsanalys för att se vad som saknas och vad det kostar.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => router.push('/tracks')}>
            <MapPin className="h-4 w-4" />
            Gå till Banor
          </Button>
          <Button onClick={() => router.push(costsHref)}>
            <DollarSign className="h-4 w-4" />
            Gå till Kostnadsanalys
          </Button>
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-4">
        <Card className="p-3">
          <div className="text-xs uppercase tracking-wider text-text-muted">Kategorier</div>
          <div className="mt-1 font-display text-2xl font-bold">{data.categories.length}</div>
        </Card>
        <Card className="p-3">
          <div className="text-xs uppercase tracking-wider text-text-muted">Serier</div>
          <div className="mt-1 font-display text-2xl font-bold">{data.series.length}</div>
        </Card>
        <Card className="p-3">
          <div className="text-xs uppercase tracking-wider text-text-muted">Visar</div>
          <div className="mt-1 font-display text-2xl font-bold">{sortedSeries.length}</div>
        </Card>
        <Card className="p-3">
          <div className="text-xs uppercase tracking-wider text-text-muted">Prioriterade</div>
          <div className="mt-1 font-display text-2xl font-bold">{prioritizedSeriesIds.length}</div>
        </Card>
      </div>

      <Card className="space-y-4 p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Sok serie eller bana..."
          />
          <select
            value={activeClass}
            onChange={(event) => setActiveClass(event.target.value)}
            className="w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary focus:border-accent-primary focus:outline-none"
          >
            <option value="all">Alla klasser</option>
            {classes.map((className) => (
              <option key={className} value={className}>
                {className}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`rounded-full border px-3 py-1.5 text-xs transition ${
              activeCategory === 'all'
                ? 'border-accent-primary bg-accent-primary/10 text-text-primary'
                : 'border-border text-text-secondary hover:text-text-primary'
            }`}
          >
            Alla
          </button>
          {data.categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setActiveCategory(category.id)}
              className={`rounded-full border px-3 py-1.5 text-xs transition ${
                activeCategory === category.id
                  ? 'border-accent-primary bg-accent-primary/10 text-text-primary'
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
                  ? 'border-accent-primary bg-accent-primary/10 text-text-primary'
                  : 'border-border text-text-secondary hover:text-text-primary'
              }`}
            >
              Endast prioriterade
            </button>
          )}
          <button
            type="button"
            onClick={resetFilters}
            className="rounded-full border border-border px-3 py-1.5 text-xs text-text-secondary transition hover:text-text-primary"
          >
            Rensa filter
          </button>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <Card className="h-[70vh] overflow-y-auto p-2">
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
                      ? 'border-accent-primary bg-accent-primary/10'
                      : 'border-transparent hover:border-border hover:bg-bg-elevated/40'
                  }`}
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge variant={categoryBadgeVariants[series.categoryId] ?? 'default'}>
                      {series.categoryLabel}
                    </Badge>
                    <Badge variant="default">{series.className}</Badge>
                    <Badge variant="default">{series.weeks.length} v</Badge>
                    {prioritized && <Badge variant="default">Prioriterad</Badge>}
                  </div>
                  <div className="text-sm font-medium text-text-primary">{series.title}</div>
                </button>
              )
            })}

            {sortedSeries.length === 0 && (
              <div className="rounded-lg border border-border p-4 text-sm text-text-secondary">
                Ingen serie matchade filtret.
              </div>
            )}
          </div>
        </Card>

        <Card className="h-[70vh] overflow-y-auto p-0">
          {selectedSeries ? (
            <SeriesDetails series={selectedSeries} />
          ) : (
            <div className="p-6 text-sm text-text-secondary">Valj en serie i listan till vanster.</div>
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
  const cars = splitCars(series.cars)
  const licenseVariant = inferLicenseBadgeVariant(series.license)

  return (
    <div className="space-y-4 p-4">
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge variant={categoryBadgeVariants[series.categoryId] ?? 'default'}>
            {series.categoryLabel}
          </Badge>
          <Badge className="bg-accent-primary/20 text-text-primary">{series.className}</Badge>
          <Badge variant={licenseVariant}>{series.license || 'Licens saknas'}</Badge>
          <Badge className="bg-bg-elevated text-text-primary">{series.frequency || 'Frekvens saknas'}</Badge>
          <Badge variant="default">PDF sida {series.pdfPage || '-'}</Badge>
        </div>
        <h3 className="font-display text-lg font-bold text-text-primary">{series.title}</h3>
      </div>

      <div className="space-y-2">
        <div className="grid gap-2 rounded-lg border border-border/70 bg-bg-elevated/30 p-3">
          <div className="text-xs uppercase tracking-wider text-text-muted">Bil(ar)</div>
          {cars.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {cars.map((carModel, index) => (
                <span
                  key={`${series.id}-car-${index}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-bg-elevated/80 px-2.5 py-1"
                >
                  <span className="inline-flex items-center gap-1 rounded-full border border-zinc-700/80 bg-black/35 px-2 py-0.5 text-zinc-100">
                    <BrandEmblem brand={inferCarBrand(carModel)} />
                    <span className="text-xs font-semibold">{inferCarBrand(carModel)}</span>
                  </span>
                  <Badge className="bg-accent-primary/15 text-text-primary">{carModel}</Badge>
                </span>
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
              <Th>Bana</Th>
              <Th className="w-24">Langd</Th>
              <Th className="w-40">Referens</Th>
            </Tr>
          </THead>
          <TBody>
            {series.weeks.map((week, index) => (
              <Tr
                key={`${series.id}-${week.week}-${week.startDate}-${week.track}-${index}`}
                className="align-top hover:bg-bg-elevated/35"
              >
                <Td className="py-2">
                  <div className="h-full min-h-[64px] rounded-lg border border-border/60 bg-gradient-to-r from-bg-elevated/85 via-bg-elevated/65 to-bg-surface/75 p-2.5">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="inline-flex min-w-7 items-center justify-center rounded-md border border-accent-primary/40 bg-accent-primary/20 px-1.5 py-0.5 font-display text-sm font-semibold text-text-primary">
                        V{week.week}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-bg-elevated/80 px-2 py-0.5 text-text-primary">
                        <CalendarDays className="h-3.5 w-3.5 text-accent-primary" />
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
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-bg-elevated/70 px-2 py-1">
                    <CalendarDays className="h-3.5 w-3.5 text-accent-primary" />
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
