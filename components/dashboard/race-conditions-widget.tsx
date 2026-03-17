// components/dashboard/race-conditions-widget.tsx
import Link from 'next/link'
import { parseRaceConditions } from '@/lib/iracing/race-conditions'
import type { IracingSeries } from '@/lib/iracing/types'

interface RaceConditionsWidgetProps {
  selectedSeries: IracingSeries[]
  currentWeekIndex: number
}

export function RaceConditionsWidget({ selectedSeries, currentWeekIndex }: RaceConditionsWidgetProps) {
  return (
    <div className="flex h-full flex-col min-h-0">
      <div className="flex shrink-0 items-center justify-between px-4 pb-2 pt-3">
        <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
          Veckans förutsättningar
        </span>
        <Link
          href="/series"
          className="text-xs text-accent-cyan/40 transition-colors hover:text-accent-cyan/80"
        >
          Alla serier →
        </Link>
      </div>
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 pb-3">
        {selectedSeries.map((s) => {
          const week = s.weeks[currentWeekIndex]
          if (!week) return null
          const cond = parseRaceConditions(week.notes, week.referenceSession)

          return (
            <div
              key={s.seriesName}
              className="shrink-0 border-b border-border-subtle pb-3 last:border-b-0"
            >
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <span className="truncate text-sm font-semibold text-text-secondary">{s.seriesName}</span>
                <span className="shrink-0 truncate text-xs text-text-muted">{week.track}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {/* Weather type */}
                <Pill
                  label={cond.isDynamic ? 'Dynamiskt väder' : 'Fast väder'}
                  accent={cond.isDynamic ? 'cyan' : undefined}
                />
                {/* Temperature */}
                {cond.tempC !== null && <Pill label={`${cond.tempC}°C`} />}
                {/* Rain */}
                {cond.rainChance !== null && (
                  <Pill label={`Regn ${cond.rainChance}%`} accent={cond.rainChance >= 25 ? 'amber' : 'cyan'} />
                )}
                {/* Time */}
                {cond.startTime && (
                  <Pill label={cond.startTime} accent={cond.isNight ? 'purple' : undefined} />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Pill({ label, accent }: { label: string; accent?: 'cyan' | 'amber' | 'purple' }) {
  const styles = {
    cyan:    { color: 'var(--color-accent-cyan)',    bg: 'rgba(0,255,255,0.08)',    border: 'rgba(0,255,255,0.2)' },
    amber:   { color: 'var(--color-accent-orange)',  bg: 'rgba(255,140,0,0.1)',     border: 'rgba(255,140,0,0.2)' },
    purple:  { color: '#c090ff',                     bg: 'rgba(160,80,255,0.1)',    border: 'rgba(160,80,255,0.2)' },
    default: { color: 'var(--color-text-muted)',     bg: 'rgba(255,255,255,0.04)', border: 'var(--color-border-subtle)' },
  }
  const s = styles[accent ?? 'default']
  return (
    <span
      className="inline-flex items-center rounded px-2 py-0.5 text-xs whitespace-nowrap"
      style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}
    >
      {label}
    </span>
  )
}
