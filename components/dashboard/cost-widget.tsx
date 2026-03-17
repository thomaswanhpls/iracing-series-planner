// components/dashboard/cost-widget.tsx
import Link from 'next/link'
import type { ContentCostSummary } from '@/lib/analysis/types'

interface CostWidgetProps {
  summary: ContentCostSummary
  seriesCosts: Record<string, number>  // seriesName → cost
}

export function CostWidget({ summary, seriesCosts }: CostWidgetProps) {
  const entries = Object.entries(seriesCosts).sort((a, b) => b[1] - a[1])

  return (
    <div className="flex h-full flex-col min-h-0">
      <div className="flex shrink-0 items-center justify-between px-4 pb-2 pt-3">
        <span className="text-xs font-bold uppercase tracking-widest text-text-muted">Kostnader</span>
        <Link
          href="/dashboard/costs"
          className="text-xs text-accent-cyan/40 transition-colors hover:text-accent-cyan/80"
        >
          Full analys →
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-3">
        <div className="mb-4">
          <div className="text-3xl font-bold leading-none tabular-nums text-accent-orange">
            ${summary.totalAfterDiscount.toFixed(2)}
          </div>
          <div className="mt-1.5 text-xs text-text-muted">
            {summary.trackCount} saknade banor · {summary.carCount} bilar
          </div>
        </div>
        <div className="flex flex-col gap-1">
          {entries.map(([name, cost]) => (
            <div
              key={name}
              className="flex items-center justify-between rounded-md border border-border-subtle px-3 py-2"
            >
              <span className="truncate text-sm text-text-secondary">{name}</span>
              <span
                className="ml-3 shrink-0 text-sm font-semibold tabular-nums"
                style={{ color: cost === 0 ? 'var(--color-accent-cyan)' : 'var(--color-accent-orange)' }}
              >
                ${cost.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
