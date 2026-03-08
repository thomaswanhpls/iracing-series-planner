'use client'

import { useState, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface TooltipProps {
  content: ReactNode
  children: ReactNode
  className?: string
}

export function Tooltip({ content, children, className }: TooltipProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          className={cn(
            'absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 rounded-md bg-bg-elevated px-3 py-2 text-xs text-text-primary shadow-lg border border-border animate-in fade-in duration-100',
            className
          )}
        >
          {content}
        </div>
      )}
    </div>
  )
}
