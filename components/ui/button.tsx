import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-accent-cyan text-bg-base font-display font-bold rounded-sm px-5 py-2.5 text-[13px] shadow-[0_0_18px_rgba(0,255,255,0.35)] hover:shadow-[0_0_24px_rgba(0,255,255,0.5)] active:scale-[0.98]',
  secondary:
    'border border-border text-text-secondary rounded-sm px-5 py-2.5 text-[13px] hover:bg-bg-hover hover:text-text-primary',
  ghost:
    'text-text-secondary text-[13px] hover:text-text-primary hover:bg-white/[0.03] rounded-sm',
}

export function Button({ className, variant = 'primary', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-display transition-all duration-200 disabled:pointer-events-none disabled:opacity-50',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
}
