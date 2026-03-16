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
  'aria-hidden'?: boolean | 'true' | 'false'
}

export function Checkbox({ checked, onChange, onClick, readOnly, disabled, className, 'aria-hidden': ariaHidden }: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-hidden={ariaHidden}
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
            ? 'border-accent-cyan bg-[rgba(0,255,255,0.15)] shadow-[0_0_8px_rgba(0,255,255,0.35)] cursor-pointer'
            : 'border-white/25 bg-white/[0.03] cursor-pointer',
        className
      )}
    >
      {checked && <Check className="h-3.5 w-3.5 stroke-[2.5]" style={{ color: '#00ffff' }} />}
    </button>
  )
}
