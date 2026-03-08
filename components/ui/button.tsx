import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-accent-primary text-white hover:bg-accent-primary/90 hover:shadow-[0_0_20px_rgba(233,69,96,0.25)] active:scale-[0.98]',
  secondary: 'bg-bg-elevated/80 text-text-primary hover:bg-bg-hover border border-border/60 hover:border-border backdrop-blur-sm',
  ghost: 'text-text-secondary hover:bg-bg-hover/50 hover:text-text-primary',
}

export function Button({ className, variant = 'primary', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
}
