'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { SeasonScheduleBrowser } from '@/components/season-schedule-browser'
import type { SeasonScheduleData } from '@/lib/season-schedules/types'

interface SeriesWidgetProps {
  seriesData: SeasonScheduleData
  nextRaceDate: string | null  // ISO date string or null if no upcoming races
}

export function SeriesWidget({ seriesData, nextRaceDate }: SeriesWidgetProps) {
  const [expanded, setExpanded] = useState(false)

  const seriesCount = seriesData.series.length

  return (
    <div className="flex flex-col gap-3">
      <Card
        className="p-5 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-text-muted mb-1">
              Seriescheman
            </div>
            <div className="text-2xl font-bold font-display text-text-primary">
              {seriesCount} serier
            </div>
            {nextRaceDate && (
              <div className="text-sm text-text-secondary mt-1">
                Nästa vecka startar {new Date(nextRaceDate).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' })}
              </div>
            )}
          </div>
          <span className="text-xs text-text-muted mt-1">
            {expanded ? '▲ Dölj' : '▼ Visa scheman'}
          </span>
        </div>
      </Card>

      {expanded && (
        <div className="rounded-lg border border-border-subtle bg-bg-glass overflow-hidden">
          <SeasonScheduleBrowser data={seriesData} />
        </div>
      )}
    </div>
  )
}
