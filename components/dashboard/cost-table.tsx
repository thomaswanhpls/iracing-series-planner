'use client'

import type { PurchaseRecommendation, CostSummary } from '@/lib/analysis/types'
import { getSeriesById } from '@/lib/iracing/data-provider'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface CostTableProps {
  recommendations: PurchaseRecommendation[]
  costSummary: CostSummary
}

export function CostTable({ recommendations, costSummary }: CostTableProps) {
  if (recommendations.length === 0) {
    return (
      <Card>
        <p className="text-text-secondary text-center py-8">
          Inga banor att köpa — du har allt du behöver!
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 stagger-children">
        <Card glow>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-primary/10">
              <span className="font-display text-sm font-bold text-accent-primary">{costSummary.trackCount}</span>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-text-muted">Antal banor</div>
              <div className="font-display text-lg font-bold">{costSummary.trackCount} st</div>
            </div>
          </div>
        </Card>
        <Card accent="owned" glow>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-status-owned/10">
              <span className="font-display text-sm font-bold text-status-owned">%</span>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-text-muted">
                Rabatt ({costSummary.discountTier}: {costSummary.discountPercent}%)
              </div>
              <div className="font-display text-lg font-bold text-status-owned">
                -${costSummary.discountAmount.toFixed(2)}
              </div>
            </div>
          </div>
        </Card>
        <Card accent="missing" glow>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-status-missing/10">
              <span className="font-display text-sm font-bold text-status-missing">$</span>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-text-muted">Total kostnad</div>
              <div className="font-display text-lg font-bold">
                ${costSummary.totalAfterDiscount.toFixed(2)}
              </div>
            </div>
          </div>
          {costSummary.discountPercent > 0 && (
            <div className="mt-2 text-[10px] text-text-muted line-through">
              ${costSummary.totalBeforeDiscount.toFixed(2)} före rabatt
            </div>
          )}
        </Card>
      </div>

      {/* Recommendations table */}
      <div className="overflow-hidden rounded-xl border border-border/40 bg-bg-surface/30 backdrop-blur-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-bg-elevated/60">
              <th className="px-4 py-3 text-left text-[10px] font-display font-medium uppercase tracking-widest text-text-muted">#</th>
              <th className="px-4 py-3 text-left text-[10px] font-display font-medium uppercase tracking-widest text-text-muted">Bana</th>
              <th className="px-4 py-3 text-left text-[10px] font-display font-medium uppercase tracking-widest text-text-muted">Serier</th>
              <th className="px-4 py-3 text-right text-[10px] font-display font-medium uppercase tracking-widest text-text-muted">Pris</th>
              <th className="px-4 py-3 text-right text-[10px] font-display font-medium uppercase tracking-widest text-text-muted">Löpande</th>
            </tr>
          </thead>
          <tbody>
            {recommendations.map((rec, idx) => (
              <tr
                key={rec.track.track_id}
                className="border-t border-border/20 transition-colors hover:bg-bg-hover/20"
              >
                <td className="px-4 py-3">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-bg-elevated/80 font-display text-[10px] font-bold text-text-muted">
                    {idx + 1}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="font-display text-xs font-semibold">{rec.track.track_name}</div>
                  {rec.track.config_name && (
                    <div className="text-[10px] text-text-muted mt-0.5">{rec.track.config_name}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {rec.seriesCovered.map((seriesId) => {
                      const series = getSeriesById(seriesId)
                      return (
                        <Badge key={seriesId} variant="default">
                          {series?.series_name?.split(' ').slice(0, 2).join(' ') ?? seriesId}
                        </Badge>
                      )
                    })}
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-display text-xs text-status-missing">
                  ${rec.track.price.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right font-display text-xs text-text-secondary">
                  ${rec.cumulativeCost.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
