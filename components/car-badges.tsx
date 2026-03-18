'use client'

import { cn } from '@/lib/utils'
import { brandAccentByName, getCarLabels } from '@/lib/iracing/cars'

export function BrandEmblem({ brand }: { brand: string }) {
  const accent = brandAccentByName[brand] ?? {
    from: '#9CA3AF',
    to: '#374151',
    ring: '#D1D5DB',
    mono: brand.slice(0, 2).toUpperCase(),
  }
  const gradientId = `brand-emblem-${brand.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`

  return (
    <span className="inline-flex h-5 w-5 items-center justify-center" aria-hidden>
      <svg viewBox="0 0 32 32" className="h-5 w-5">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={accent.from} />
            <stop offset="100%" stopColor={accent.to} />
          </linearGradient>
        </defs>
        <circle cx="16" cy="16" r="15" fill={`url(#${gradientId})`} />
        <circle cx="16" cy="16" r="14" fill="none" stroke={accent.ring} strokeWidth="1.4" opacity="0.9" />
        <text
          x="16"
          y="19"
          textAnchor="middle"
          fontSize={accent.mono.length > 2 ? '8' : '10'}
          fontFamily="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial"
          fontWeight="700"
          fill="#FFFFFF"
          letterSpacing="0.4"
        >
          {accent.mono}
        </text>
      </svg>
    </span>
  )
}

export function CarBadge({
  carModel,
  compact = false,
}: {
  carModel: string
  compact?: boolean
}) {
  const { brand, model } = getCarLabels(carModel)

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-border-subtle bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))] text-text-primary hover:border-accent-cyan/30',
        compact ? 'px-2.5 py-1' : 'px-3 py-1.5'
      )}
    >
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-black/35">
        <BrandEmblem brand={brand} />
      </span>
      <span className="flex min-w-0 flex-col leading-none">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted">
          {brand}
        </span>
        <span
          className={cn(
            'truncate font-display text-text-primary',
            compact ? 'max-w-[170px] text-xs font-medium' : 'max-w-[260px] text-sm font-semibold'
          )}
          title={carModel}
        >
          {model}
        </span>
      </span>
    </span>
  )
}
