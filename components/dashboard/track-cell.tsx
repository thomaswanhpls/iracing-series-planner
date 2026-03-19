'use client'

import { useTranslations } from 'next-intl'
import type { OwnershipStatus } from '@/lib/iracing/types'
import { Tooltip } from '@/components/ui/tooltip'
import { Repeat } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TrackCellProps {
  trackName: string
  configName: string
  status: OwnershipStatus
  price: number
  crossSeriesCount: number
}

const statusStyles: Record<OwnershipStatus, string> = {
  owned: 'bg-status-owned/10 text-status-owned border-status-owned/20 hover:bg-status-owned/15',
  missing: 'bg-status-missing/10 text-status-missing border-status-missing/20 hover:bg-status-missing/15',
  free: 'bg-status-free/10 text-status-free border-status-free/20 hover:bg-status-free/15',
}

const statusDot: Record<OwnershipStatus, string> = {
  owned: 'bg-status-owned',
  missing: 'bg-status-missing',
  free: 'bg-status-free',
}

export function TrackCell({ trackName, configName, status, price, crossSeriesCount }: TrackCellProps) {
  const t = useTranslations('trackCell')
  const displayName = configName ? `${trackName} (${configName})` : trackName

  const tooltipContent = (
    <div className="space-y-1.5 whitespace-nowrap">
      <div className="font-display font-semibold text-text-primary">{displayName}</div>
      <div className="flex items-center gap-2 text-text-secondary">
        <div className={cn('h-2 w-2 rounded-full', statusDot[status])} />
        {status === 'owned' && <span>{t('owned')}</span>}
        {status === 'missing' && <span>{t('missing', { price: price.toFixed(2) })}</span>}
        {status === 'free' && <span>{t('free')}</span>}
      </div>
      {crossSeriesCount > 1 && (
        <div className="text-text-muted">{t('usedInSeries', { count: crossSeriesCount })}</div>
      )}
    </div>
  )

  return (
    <Tooltip content={tooltipContent}>
      <div
        className={cn(
          'group flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-xs font-display transition-all duration-150 cursor-default',
          statusStyles[status]
        )}
      >
        <div className={cn('h-1.5 w-1.5 shrink-0 rounded-full', statusDot[status])} />
        <span className="truncate max-w-[110px]">{trackName}</span>
        {crossSeriesCount > 1 && (
          <Repeat className="h-3 w-3 shrink-0 opacity-40 group-hover:opacity-70 transition-opacity" />
        )}
      </div>
    </Tooltip>
  )
}
