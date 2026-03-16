'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CheckboxProps {
  checked?: boolean
  onChange?: (checked: boolean) => void
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  readOnly?: boolean
  disabled?: boolean
  className?: string
}

export function Checkbox({ checked, onChange, onClick, readOnly, disabled, className }: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={(e) => {
        onClick?.(e)
        if (!readOnly && !disabled) onChange?.(!checked)
      }}
      className={cn(
        'inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-sm border transition-all duration-150',
        disabled
          ? 'border-white/10 bg-transparent opacity-50 cursor-not-allowed'
          : checked
            ? 'border-accent-cyan bg-accent-cyan shadow-[0_0_8px_rgba(0,255,255,0.45)] cursor-pointer'
            : 'border-white/30 bg-transparent cursor-pointer',
        className
      )}
    >
      {checked && <Check className="h-3.5 w-3.5 stroke-[3]" style={{ color: '#050614' }} />}
    </button>
  )
}
