import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface StepIndicatorProps {
  currentStep: number
  steps: string[]
}

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-3">
      {steps.map((label, idx) => {
        const completed = idx < currentStep
        const active = idx === currentStep
        return (
          <div key={label} className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  'relative flex h-8 w-8 items-center justify-center rounded-full text-xs font-display font-bold transition-all duration-300',
                  completed
                    ? 'bg-status-owned text-white'
                    : active
                      ? 'bg-accent-primary text-white shadow-[0_0_12px_rgba(233,69,96,0.3)]'
                      : 'bg-bg-elevated/60 text-text-muted border border-border/40'
                )}
              >
                {completed ? <Check className="h-3.5 w-3.5" /> : idx + 1}
              </div>
              <span
                className={cn(
                  'text-sm font-medium transition-colors',
                  active ? 'text-text-primary' : completed ? 'text-text-secondary' : 'text-text-muted'
                )}
              >
                {label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className="relative h-px w-10 overflow-hidden bg-border/40">
                <div
                  className={cn(
                    'absolute inset-y-0 left-0 bg-gradient-to-r from-status-owned to-status-owned/50 transition-all duration-500',
                    completed ? 'w-full' : 'w-0'
                  )}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
