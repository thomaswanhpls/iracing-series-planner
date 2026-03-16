'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { CostTable } from './cost-table'
import type { ContentPurchaseRecommendation, ContentCostSummary } from '@/lib/analysis/types'

interface CostWidgetProps {
  recommendations: ContentPurchaseRecommendation[]
  summary: ContentCostSummary
}

export function CostWidget({ recommendations, summary }: CostWidgetProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="flex flex-col gap-3">
      <Card
        className="p-5 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-text-muted mb-1">
              Kostnad
            </div>
            <div className="text-2xl font-bold font-display text-text-primary">
              ${summary.totalAfterDiscount.toFixed(2)}
            </div>
            <div className="text-sm text-text-secondary mt-1">
              {summary.trackCount} banor · {summary.carCount} bilar saknas
            </div>
          </div>
          <span className="text-xs text-text-muted mt-1">
            {expanded ? '▲ Dölj' : '▼ Visa detaljer'}
          </span>
        </div>
      </Card>

      {expanded && (
        <CostTable
          recommendations={recommendations}
          costSummary={summary}
          variant="content"
        />
      )}
    </div>
  )
}
