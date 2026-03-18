import { cn } from '@/lib/utils'
import { InputHTMLAttributes } from 'react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      suppressHydrationWarning
      className={cn(
        'w-full rounded-sm border border-border bg-white/[0.04] px-4 py-[10px] font-display text-[14px] text-text-secondary placeholder:text-text-muted transition-[border-color,box-shadow] focus:border-border-focus focus:shadow-[0_0_5px_rgba(0,255,255,0.3)] focus:outline-none',
        className
      )}
      {...props}
    />
  )
}
