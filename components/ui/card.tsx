import { cn } from '@/lib/utils'
import { HTMLAttributes } from 'react'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  'data-selected'?: boolean
}

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'relative bg-bg-glass backdrop-blur-md border border-border-subtle rounded-lg overflow-hidden',
        'before:absolute before:top-0 before:inset-x-0 before:h-px before:content-[""]',
        'before:bg-[linear-gradient(90deg,transparent_0%,rgba(0,255,255,0.5)_35%,rgba(13,185,242,0.2)_65%,transparent_100%)]',
        'before:opacity-0 before:transition-opacity hover:before:opacity-100',
        'data-[selected=true]:border-accent-cyan/30 data-[selected=true]:bg-accent-cyan/[0.07] data-[selected=true]:before:opacity-100',
        className
      )}
      {...props}
    />
  )
}
