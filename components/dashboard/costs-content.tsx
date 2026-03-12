'use client'

import { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getAllTracks } from '@/lib/iracing/data-provider'
import { useOwnership } from '@/lib/ownership/context'
import { analyzeSeason2Costs } from '@/lib/analysis/season2-cost'
import type { SeasonScheduleData } from '@/lib/season-schedules/types'
import { CostTable } from './cost-table'
import { Button } from '@/components/ui/button'
import { Compass } from 'lucide-react'

interface CostsContentProps {
  seasonData: SeasonScheduleData
}

export function CostsContent({ seasonData }: CostsContentProps) {
  const searchParams = useSearchParams()
  const { ownedTrackIds } = useOwnership()
  const tracks = getAllTracks()

  const analysis = useMemo(
    () => analyzeSeason2Costs(seasonData, searchParams.get('series'), ownedTrackIds, tracks),
    [ownedTrackIds, searchParams, seasonData, tracks]
  )

  if (analysis.selectedSeries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <Compass className="h-12 w-12 text-text-muted" />
        <h2 className="font-display text-xl font-bold">Inga serier valda</h2>
        <p className="text-text-secondary">
          Gå till Setup för att välja serier först.
          {analysis.unresolvedSeriesKeys.length > 0
            ? ` (${analysis.unresolvedSeriesKeys.length} val kunde inte matchas mot S2-datan)`
            : ''}
        </p>
        <Link href="/setup">
          <Button>Gå till Setup</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold">Kostnadsanalys</h2>
        <p className="mt-1 text-xs text-text-muted">
          Baserad på real world 2026 S2-serier ({analysis.selectedSeries.length} valda).
        </p>
      </div>
      {analysis.unmatchedTrackNames.length > 0 && (
        <div className="rounded-lg border border-border bg-bg-surface/40 p-3 text-xs text-text-secondary">
          {analysis.unmatchedTrackNames.length} bana/banvarianter i schemat kunde inte prissättas med nuvarande
          track-katalog och är exkluderade från totalsumman.
        </div>
      )}
      <CostTable recommendations={analysis.recommendations} costSummary={analysis.costSummary} />
    </div>
  )
}
