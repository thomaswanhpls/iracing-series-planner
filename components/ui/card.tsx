import { cn } from '@/lib/utils'
import { HTMLAttributes } from 'react'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  accent?: 'owned' | 'missing' | 'free' | 'eligible'
  glow?: boolean
}

const accentStyles: Record<string, string> = {
  owned: 'border-l-[3px] border-l-status-owned',
  missing: 'border-l-[3px] border-l-status-missing',
  free: 'border-l-[3px] border-l-status-free',
  eligible: 'border-l-[3px] border-l-status-eligible',
}

const glowStyles: Record<string, string> = {
  owned: 'shadow-[0_0_20px_rgba(46,204,113,0.08)]',
  missing: 'shadow-[0_0_20px_rgba(233,69,96,0.08)]',
  free: 'shadow-[0_0_20px_rgba(243,156,18,0.08)]',
  eligible: 'shadow-[0_0_20px_rgba(52,152,219,0.08)]',
}

export function Card({ className, accent, glow, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border/60 bg-bg-surface/80 p-4 backdrop-blur-sm transition-all duration-200',
        accent && accentStyles[accent],
        (glow || accent) && accent && glowStyles[accent],
        className
      )}
      {...props}
    />
  )
}
