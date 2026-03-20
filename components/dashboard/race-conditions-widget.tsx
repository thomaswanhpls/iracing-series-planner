// components/dashboard/race-conditions-widget.tsx
'use client'

import Link from 'next/link'
import {
  ArrowRight,
  Cloud,
  CloudRain,
  CloudSun,
  Moon,
  Sun,
  Sunrise,
  Sunset,
  Thermometer,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { parseRaceConditions } from '@/lib/iracing/race-conditions'
import { makeTrackKey } from '@/lib/iracing/types'
import type { IracingSeries } from '@/lib/iracing/types'

type FocusState =
  | { kind: 'track'; key: string }
  | { kind: 'series'; name: string }
  | null

interface RaceConditionsWidgetProps {
  selectedSeries: IracingSeries[]
  currentWeekIndex: number
  focus: FocusState
  onFocusSeries: (name: string) => void
}

// ── Time of day ───────────────────────────────────────────────────────────────

type TimeOfDay = 'night' | 'dawn' | 'morning' | 'afternoon' | 'evening'

function getTimeOfDay(startTime: string | null): TimeOfDay {
  if (!startTime) return 'afternoon'
  const hour = parseInt(startTime.split(':')[0], 10)
  if (hour >= 20 || hour < 5)  return 'night'
  if (hour >= 5  && hour < 8)  return 'dawn'
  if (hour >= 8  && hour < 13) return 'morning'
  if (hour >= 13 && hour < 18) return 'afternoon'
  return 'evening'
}

type TimeThemeEntry = { bg: string; border: string; label: string; color: string; icon: React.ReactNode }

function buildTimeTheme(labels: Record<TimeOfDay, string>): Record<TimeOfDay, TimeThemeEntry> {
  return {
    night:     { bg: 'rgba(100,60,200,0.1)',  border: 'rgba(160,80,255,0.22)', label: labels.night,     color: '#c090ff',                    icon: <Moon size={11} /> },
    dawn:      { bg: 'rgba(255,160,60,0.08)', border: 'rgba(255,180,80,0.22)', label: labels.dawn,      color: '#ffb84a',                    icon: <Sunrise size={11} /> },
    morning:   { bg: 'rgba(255,230,100,0.07)',border: 'rgba(255,220,80,0.2)',  label: labels.morning,   color: '#ffd84a',                    icon: <Sun size={11} /> },
    afternoon: { bg: 'rgba(255,255,255,0.04)',border: 'rgba(255,255,255,0.1)', label: labels.afternoon, color: 'var(--color-text-secondary)', icon: <CloudSun size={11} /> },
    evening:   { bg: 'rgba(255,90,30,0.08)',  border: 'rgba(255,110,40,0.22)', label: labels.evening,   color: '#ff7040',                    icon: <Sunset size={11} /> },
  }
}

// Card accent per time of day — subtle tint on the series block
const CARD_ACCENT: Record<TimeOfDay, { bg: string; border: string }> = {
  night:     { bg: 'rgba(100,60,200,0.07)', border: 'rgba(160,80,255,0.18)' },
  dawn:      { bg: 'rgba(255,160,60,0.06)', border: 'rgba(255,180,80,0.16)' },
  morning:   { bg: 'rgba(255,220,80,0.05)', border: 'rgba(255,220,80,0.14)' },
  afternoon: { bg: 'rgba(255,255,255,0.03)',border: 'rgba(255,255,255,0.08)' },
  evening:   { bg: 'rgba(255,90,30,0.06)',  border: 'rgba(255,110,40,0.16)' },
}

// ── Temperature ───────────────────────────────────────────────────────────────

type TempTier = 'freezing' | 'cold' | 'mild' | 'warm' | 'hot' | 'extreme'

function getTempTier(tempC: number): TempTier {
  if (tempC <= 4)  return 'freezing'
  if (tempC <= 13) return 'cold'
  if (tempC <= 22) return 'mild'
  if (tempC <= 28) return 'warm'
  if (tempC <= 34) return 'hot'
  return 'extreme'
}

const TEMP_STYLE: Record<TempTier, { color: string; bg: string; border: string }> = {
  freezing: { color: '#a0d8ff', bg: 'rgba(160,216,255,0.1)',  border: 'rgba(160,216,255,0.25)' },
  cold:     { color: '#60b8ff', bg: 'rgba(96,184,255,0.08)',  border: 'rgba(96,184,255,0.2)'   },
  mild:     { color: 'var(--color-text-secondary)', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.1)' },
  warm:     { color: '#ffd060', bg: 'rgba(255,210,80,0.08)',  border: 'rgba(255,210,80,0.2)'   },
  hot:      { color: 'var(--color-accent-orange)', bg: 'rgba(255,140,0,0.1)',  border: 'rgba(255,140,0,0.25)'  },
  extreme:  { color: 'var(--color-accent-red)',     bg: 'rgba(255,61,90,0.1)',  border: 'rgba(255,61,90,0.25)'  },
}

// ── Widget ────────────────────────────────────────────────────────────────────

export function RaceConditionsWidget({ selectedSeries, currentWeekIndex, focus, onFocusSeries }: RaceConditionsWidgetProps) {
  const t = useTranslations('dashboard.raceConditions')

  const timeTheme = buildTimeTheme({
    night:     t('timeOfDay.night'),
    dawn:      t('timeOfDay.dawn'),
    morning:   t('timeOfDay.morning'),
    afternoon: t('timeOfDay.afternoon'),
    evening:   t('timeOfDay.evening'),
  })

  return (
    <div className="flex h-full flex-col min-h-0 max-md:h-auto">
      <div className="shrink-0 px-4 pb-2 pt-3">
        <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
          {t('widgetTitle')}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 pb-3 max-md:flex-none max-md:overflow-visible">
        {selectedSeries.map((s) => {
          const week = s.weeks[currentWeekIndex]
          if (!week) return null
          const cond = parseRaceConditions(week.notes, week.referenceSession)
          const tod = getTimeOfDay(cond.startTime)
          const accent = CARD_ACCENT[tod]
          const isFocused = focus?.kind === 'series' && focus.name === s.seriesName
          const hasTrack = focus?.kind === 'track' && !!week && makeTrackKey(week.venue, week.config) === focus.key
          const dimmed = focus !== null && !isFocused && !hasTrack

          return (
            <button
              key={s.seriesName}
              type="button"
              onClick={() => onFocusSeries(s.seriesName)}
              className="shrink-0 rounded-lg px-3 py-2.5 w-full text-left cursor-pointer"
              style={{
                background: accent.bg,
                border: `1px solid ${accent.border}`,
                outline: isFocused ? '2px solid rgba(0,232,224,0.5)' : hasTrack ? '2px solid rgba(255,140,0,0.5)' : undefined,
                outlineOffset: isFocused || hasTrack ? '-2px' : undefined,
                opacity: dimmed ? 0.35 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <span className="truncate text-sm font-semibold text-text-primary">{s.seriesName}</span>
                <span className="shrink-0 truncate text-xs text-text-secondary">{week.track}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <WeatherPill isDynamic={cond.isDynamic} dynamicLabel={t('dynamic')} fixedLabel={t('fixedWeather')} />
                {cond.tempC !== null && <TempPill tempC={cond.tempC} />}
                {cond.rainChance !== null && <RainPill rainChance={cond.rainChance} />}
                {cond.startTime && <TimePill startTime={cond.startTime} tod={tod} timeTheme={timeTheme} />}
              </div>
            </button>
          )
        })}
      </div>
      <Link
        href="/series"
        className="group shrink-0 flex items-center justify-center gap-2 border-t border-[rgba(0,232,224,0.2)] py-3 text-sm font-medium text-accent-cyan transition-all hover:bg-[rgba(0,232,224,0.07)]"
      >
        {t('allSeries')}
        <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  )
}

// ── Pills ─────────────────────────────────────────────────────────────────────

function WeatherPill({ isDynamic, dynamicLabel, fixedLabel }: { isDynamic: boolean; dynamicLabel: string; fixedLabel: string }) {
  if (isDynamic) {
    return <Pill icon={<CloudRain size={11} />} label={dynamicLabel} color="var(--color-accent-cyan)" bg="rgba(0,232,224,0.08)" border="rgba(0,232,224,0.2)" />
  }
  return <Pill icon={<Sun size={11} />} label={fixedLabel} color="var(--color-text-secondary)" bg="rgba(255,255,255,0.04)" border="rgba(255,255,255,0.1)" />
}

function TempPill({ tempC }: { tempC: number }) {
  const s = TEMP_STYLE[getTempTier(tempC)]
  return <Pill icon={<Thermometer size={11} />} label={`${tempC}°C`} {...s} />
}

function RainPill({ rainChance }: { rainChance: number }) {
  const heavy = rainChance >= 50
  const moderate = rainChance >= 25
  return (
    <Pill
      icon={heavy ? <CloudRain size={11} /> : <Cloud size={11} />}
      label={`${rainChance}%`}
      color={heavy ? 'var(--color-accent-red)' : moderate ? 'var(--color-accent-orange)' : 'var(--color-accent-cyan)'}
      bg={heavy ? 'rgba(255,61,90,0.1)' : moderate ? 'rgba(255,140,0,0.1)' : 'rgba(0,232,224,0.07)'}
      border={heavy ? 'rgba(255,61,90,0.25)' : moderate ? 'rgba(255,140,0,0.22)' : 'rgba(0,232,224,0.18)'}
    />
  )
}

function TimePill({ startTime, tod, timeTheme }: { startTime: string; tod: TimeOfDay; timeTheme: Record<TimeOfDay, TimeThemeEntry> }) {
  const theme = timeTheme[tod]
  return <Pill icon={theme.icon} label={startTime} color={theme.color} bg={theme.bg} border={theme.border} />
}

function Pill({ icon, label, color, bg, border }: {
  icon: React.ReactNode
  label: string
  color: string
  bg: string
  border: string
}) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs whitespace-nowrap font-medium"
      style={{ color, background: bg, border: `1px solid ${border}` }}
    >
      {icon}
      {label}
    </span>
  )
}
