'use client'

import { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getAllTracks, getSeasonSchedule } from '@/lib/iracing/data-provider'
import { useOwnership } from '@/lib/ownership/context'
import { getUniqueMissingTracks, rankByValue, calculateCostSummary } from '@/lib/analysis/cost'
import { CostTable } from './cost-table'
import { Button } from '@/components/ui/button'
import { Compass } from 'lucide-react'

export function CostsContent() {
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

  const missingTracks = useMemo(
    () => getUniqueMissingTracks(selectedSchedules, ownedTrackIds, tracks),
    [selectedSchedules, ownedTrackIds, tracks]
  )

  const recommendations = useMemo(
    () => rankByValue(missingTracks, selectedSchedules, ownedTrackIds, tracks),
    [missingTracks, selectedSchedules, ownedTrackIds, tracks]
  )

  const costSummary = useMemo(
    () => calculateCostSummary(missingTracks),
    [missingTracks]
  )

  if (selectedSeriesIds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <Compass className="h-12 w-12 text-text-muted" />
        <h2 className="font-display text-xl font-bold">Inga serier valda</h2>
        <p className="text-text-secondary">Gå till Setup för att välja serier först.</p>
        <Link href="/setup">
          <Button>Gå till Setup</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-bold">Kostnadsanalys</h2>
      <CostTable recommendations={recommendations} costSummary={costSummary} />
    </div>
  )
}
