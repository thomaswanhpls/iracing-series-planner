import { cn } from '@/lib/utils'
import { HTMLAttributes } from 'react'

type BadgeVariant = 'default' | 'road' | 'oval' | 'dirt-road' | 'dirt-oval' | 'rookie' | 'd' | 'c' | 'b' | 'a' | 'pro'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

type VariantStyle = { textClass: string; bg: string; borderColor: string }

const variantStyles: Record<BadgeVariant, VariantStyle> = {
  default:     { textClass: 'text-text-muted',    bg: 'rgba(255,255,255,0.05)',  borderColor: '#2d2e5a' },
  road:        { textClass: 'text-[#0db9f2]',     bg: 'rgba(13,185,242,0.12)',  borderColor: 'rgba(13,185,242,0.25)' },
  oval:        { textClass: 'text-[#ff8c00]',     bg: 'rgba(255,140,0,0.12)',   borderColor: 'rgba(255,140,0,0.25)' },
  'dirt-road': { textClass: 'text-[#ff7020]',     bg: 'rgba(255,100,0,0.10)',   borderColor: 'rgba(255,100,0,0.20)' },
  'dirt-oval': { textClass: 'text-[#ff7020]',     bg: 'rgba(255,100,0,0.10)',   borderColor: 'rgba(255,100,0,0.20)' },
  rookie:      { textClass: 'text-[#ff5050]',     bg: 'rgba(255,60,60,0.12)',   borderColor: 'rgba(255,60,60,0.25)' },
  d:           { textClass: 'text-[#ff6020]',     bg: 'rgba(255,80,0,0.12)',    borderColor: 'rgba(255,80,0,0.25)' },
  c:           { textClass: 'text-[#e8a800]',     bg: 'rgba(255,180,0,0.12)',   borderColor: 'rgba(255,180,0,0.25)' },
  b:           { textClass: 'text-[#44cc44]',     bg: 'rgba(80,200,80,0.12)',   borderColor: 'rgba(80,200,80,0.25)' },
  a:           { textClass: 'text-[#0090ff]',     bg: 'rgba(0,160,255,0.12)',   borderColor: 'rgba(0,160,255,0.25)' },
  pro:         { textClass: 'text-[#cc44ff]',     bg: 'rgba(200,80,255,0.12)',  borderColor: 'rgba(200,80,255,0.25)' },
}

export function Badge({ className, variant = 'default', style, ...props }: BadgeProps) {
  const v = variantStyles[variant]
  return (
    <span
      className={cn(
        'inline-flex items-center font-mono text-[11px] font-medium rounded-sm px-2 py-0.5 border whitespace-nowrap',
        v.textClass,
        className
      )}
      style={{ background: v.bg, borderColor: v.borderColor, ...style }}
      {...props}
    />
  )
}
