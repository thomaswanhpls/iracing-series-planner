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
    <div className="flex flex-col overflow-hidden min-h-0">
      <div className="flex shrink-0 items-center justify-between px-3.5 pb-2 pt-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Kostnader</span>
        <Link
          href="/dashboard/costs"
          className="text-[10px] text-cyan-400/40 transition-colors hover:text-cyan-400/80"
        >
          Full analys →
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto px-3.5 pb-3">
        <div className="mb-3">
          <div className="text-[28px] font-bold leading-none tabular-nums" style={{ color: '#ff9060' }}>
            ${summary.totalAfterDiscount.toFixed(2)}
          </div>
          <div className="mt-1 text-[10px] text-white/30">
            {summary.trackCount} saknade banor · {summary.carCount} bilar
          </div>
        </div>
        <div className="flex flex-col gap-[3px]">
          {entries.map(([name, cost]) => (
            <div
              key={name}
              className="flex items-center justify-between rounded px-2 py-1.5 text-[10px]"
              style={{ background: 'rgba(255,255,255,0.025)' }}
            >
              <span className="truncate text-white/50">{name}</span>
              <span
                className="ml-2 shrink-0 font-semibold tabular-nums"
                style={{ color: cost === 0 ? '#50c878' : '#ff9060' }}
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
