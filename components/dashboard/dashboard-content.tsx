'use client'

import { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getAllTracks, getSeasonSchedule } from '@/lib/iracing/data-provider'
import { useOwnership } from '@/lib/ownership/context'
import { resolveSeriesSelection } from '@/lib/series/query'
import { analyzeSeason2Costs } from '@/lib/analysis/season2-cost'
import type { SeasonScheduleData } from '@/lib/season-schedules/types'
import { Matrix } from './matrix'
import { SummaryCards } from './summary-cards'
import { Season2Matrix } from './season2-matrix'
import { Button } from '@/components/ui/button'
import { Compass } from 'lucide-react'

interface DashboardContentProps {
  seasonData: SeasonScheduleData
}

export function DashboardContent({ seasonData }: DashboardContentProps) {
  const searchParams = useSearchParams()
  const { ownedTrackIds } = useOwnership()
  const seriesParam = searchParams.get('series')
  const tracksHref = seriesParam ? `/tracks?series=${seriesParam}` : '/tracks'
  const costsHref = seriesParam ? `/dashboard/costs?series=${seriesParam}` : '/dashboard/costs'

  const tracks = getAllTracks()
  const season2Analysis = useMemo(
    () => analyzeSeason2Costs(seasonData, seriesParam, ownedTrackIds, tracks),
    [ownedTrackIds, seasonData, seriesParam, tracks]
  )

  const seriesSelection = useMemo(
    () => resolveSeriesSelection(searchParams.get('series')),
    [searchParams]
  )
  const selectedSeriesIds = seriesSelection.seriesIds
  const hasSeriesParam = Boolean(seriesParam && seriesParam.trim().length > 0)
  const hasUnresolvedSeries = hasSeriesParam && seriesSelection.unresolvedKeys.length > 0

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

  if (selectedSeriesIds.length === 0 && season2Analysis.selectedSeries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-24">
        <div className="relative">
          <div className="absolute inset-0 animate-glow-pulse rounded-full bg-accent-primary/10 blur-xl" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-bg-surface border border-border/40">
            <Compass className="h-7 w-7 text-text-muted" />
          </div>
        </div>
        <div className="text-center">
          <h2 className="font-display text-xl font-bold">
            {hasSeriesParam ? 'Matrisen saknar underlag för valda serier' : 'Inga serier valda'}
          </h2>
          <p className="mt-2 text-text-secondary">
            {hasUnresolvedSeries
              ? `De valda serierna kommer från S2-flödet och kan inte alltid mappas till den nuvarande matrisdatan (${seriesSelection.unresolvedKeys.length} omatchade val).`
              : 'Gå till Setup för att välja vilka serier du vill köra.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/setup">
            <Button variant="secondary">Till Setup</Button>
          </Link>
          <Link href={tracksHref}>
            <Button variant="secondary">Till Banor</Button>
          </Link>
          <Link href={costsHref}>
            <Button>Till Kostnader</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (selectedSchedules.length === 0 && season2Analysis.selectedSeries.length > 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold">Matrisöversikt</h2>
            <p className="mt-0.5 text-xs text-text-muted">
              {season2Analysis.selectedSeries.length} S2-serier valda • real world-scheman
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href={tracksHref}>
              <Button variant="secondary" className="text-xs">
                Uppdatera Banor
              </Button>
            </Link>
            <Link href={costsHref}>
              <Button className="text-xs">Till Kostnader</Button>
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-bg-surface/40 p-3 text-xs text-text-secondary">
          Matrisen använder nu samma S2-serieval som Setup/Kostnader.
          {season2Analysis.unmatchedTrackNames.length > 0
            ? ` ${season2Analysis.unmatchedTrackNames.length} bana/banvarianter kunde inte mappas mot track-katalogen.`
            : ''}
        </div>

        <Season2Matrix
          selectedSeries={season2Analysis.selectedSeries}
          tracks={tracks}
          ownedTrackIds={ownedTrackIds}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold">Matrisöversikt</h2>
          <p className="mt-0.5 text-xs text-text-muted">
            {selectedSeriesIds.length} serier valda • veckotäckning per serie
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={tracksHref}>
            <Button variant="secondary" className="text-xs">
              Uppdatera Banor
            </Button>
          </Link>
          <Link href={costsHref}>
            <Button className="text-xs">Till Kostnader</Button>
          </Link>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-bg-surface/40 p-3 text-xs text-text-secondary">
        Använd matrisen för att se vilka veckor du kan köra med nuvarande innehåll. För köpbeslut och
        budget, gå vidare till Kostnader.
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
