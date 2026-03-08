import { cn } from '@/lib/utils'
import { HTMLAttributes } from 'react'

type BadgeVariant = 'default' | 'road' | 'oval' | 'dirt-road' | 'dirt-oval' | 'rookie' | 'd' | 'c' | 'b' | 'a' | 'pro'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-bg-elevated text-text-secondary',
  road: 'bg-blue-900/50 text-blue-300',
  oval: 'bg-amber-900/50 text-amber-300',
  'dirt-road': 'bg-orange-900/50 text-orange-300',
  'dirt-oval': 'bg-yellow-900/50 text-yellow-300',
  rookie: 'bg-red-900/50 text-red-300',
  d: 'bg-orange-900/50 text-orange-300',
  c: 'bg-yellow-900/50 text-yellow-300',
  b: 'bg-green-900/50 text-green-300',
  a: 'bg-blue-900/50 text-blue-300',
  pro: 'bg-purple-900/50 text-purple-300',
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
}
