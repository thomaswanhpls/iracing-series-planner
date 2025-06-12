import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes } from 'react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {}

export function Button({ className, ...props }: ButtonProps) {
  return (
    <button
      className={cn('px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50', className)}
      {...props}
    />
  )
}
