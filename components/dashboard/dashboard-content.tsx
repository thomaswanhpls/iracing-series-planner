'use client'

import { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getAllTracks, getSeasonSchedule } from '@/lib/iracing/data-provider'
import { useOwnership } from '@/lib/ownership/context'
import { Matrix } from './matrix'
import { SummaryCards } from './summary-cards'
import { Button } from '@/components/ui/button'
import { Compass } from 'lucide-react'

export function DashboardContent() {
  const searchParams = useSearchParams()
  const { ownedTrackIds } = useOwnership()

  const tracks = getAllTracks()

  const selectedSeriesIds = useMemo(() => {
    const param = searchParams.get('series')
    if (!param) return []
    return param.split(',').map(Number).filter(Boolean)
  }, [searchParams])

  const selectedSchedules = useMemo(() => {
    return selectedSeriesIds
      .map((id) => getSeasonSchedule(id))
      .filter((s): s is NonNullable<typeof s> => s != null)
  }, [selectedSeriesIds])

  const crossSeriesCounts = useMemo(() => {
    const counts = new Map<number, number>()
    for (const schedule of selectedSchedules) {
      for (const week of schedule.weeks) {
        counts.set(week.track_id, (counts.get(week.track_id) ?? 0) + 1)
      }
    }
    return counts
  }, [selectedSchedules])

  if (selectedSeriesIds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-24">
        <div className="relative">
          <div className="absolute inset-0 animate-glow-pulse rounded-full bg-accent-primary/10 blur-xl" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-bg-surface border border-border/40">
            <Compass className="h-7 w-7 text-text-muted" />
          </div>
        </div>
        <div className="text-center">
          <h2 className="font-display text-xl font-bold">Inga serier valda</h2>
          <p className="mt-2 text-text-secondary">Gå till Setup för att välja vilka serier du vill köra.</p>
        </div>
        <Link href="/setup">
          <Button>Kom igång</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold">Dashboard</h2>
          <p className="mt-0.5 text-xs text-text-muted">{selectedSeriesIds.length} serier valda</p>
        </div>
        <Link href="/setup">
          <Button variant="secondary" className="text-xs">
            Ändra serier
          </Button>
        </Link>
      </div>

      <SummaryCards
        schedules={selectedSchedules}
        ownedTrackIds={ownedTrackIds}
        tracks={tracks}
        crossSeriesCounts={crossSeriesCounts}
      />

      <Matrix
        schedules={selectedSchedules}
        tracks={tracks}
        crossSeriesCounts={crossSeriesCounts}
      />
    </div>
  )
}
