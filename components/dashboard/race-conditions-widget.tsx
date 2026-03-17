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
    <div className="flex flex-col overflow-hidden min-h-0">
      <div className="flex shrink-0 items-center justify-between px-3.5 pb-2 pt-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
          Veckans förutsättningar
        </span>
        <Link
          href="/series"
          className="text-[10px] text-cyan-400/40 transition-colors hover:text-cyan-400/80"
        >
          Alla serier →
        </Link>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-3.5 pb-3">
        {selectedSeries.map((s) => {
          const week = s.weeks[currentWeekIndex]
          if (!week) return null
          const cond = parseRaceConditions(week.notes, week.referenceSession)

          return (
            <div
              key={s.seriesName}
              className="shrink-0 pb-2.5 border-b last:border-b-0"
              style={{ borderColor: 'rgba(255,255,255,0.05)' }}
            >
              <div className="mb-1.5 flex items-baseline justify-between gap-2">
                <span className="truncate text-[10px] font-semibold text-white/60">{s.seriesName}</span>
                <span className="shrink-0 truncate text-[9px] text-white/30">{week.track}</span>
              </div>
              <div className="flex flex-wrap gap-1">
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
    cyan:    { color: '#60d8ff', bg: 'rgba(0,200,255,0.07)',   border: 'rgba(0,200,255,0.15)' },
    amber:   { color: '#ffc850', bg: 'rgba(255,200,80,0.08)',  border: 'rgba(255,200,80,0.15)' },
    purple:  { color: '#b090ff', bg: 'rgba(120,80,255,0.08)',  border: 'rgba(120,80,255,0.15)' },
    default: { color: '#888',    bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.07)' },
  }
  const s = styles[accent ?? 'default']
  return (
    <span
      className="inline-flex items-center rounded px-1.5 py-0.5 text-[9px] whitespace-nowrap"
      style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}
    >
      {label}
    </span>
  )
}
