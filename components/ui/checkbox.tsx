import { cn } from '@/lib/utils'
import { InputHTMLAttributes } from 'react'

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {}

export function Checkbox({ className, ...props }: CheckboxProps) {
  return (
    <input
      type="checkbox"
      className={cn(
        'h-4 w-4 rounded border-border bg-bg-elevated accent-accent-primary cursor-pointer',
        className
      )}
      {...props}
    />
  )
}
