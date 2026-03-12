import { cn } from '@/lib/utils'

interface CategoryFilterProps {
  selected: string[]
  onToggle: (categoryId: string) => void
  options: { value: string; label: string }[]
}

export function CategoryFilter({ selected, onToggle, options }: CategoryFilterProps) {
  return (
    <div className="space-y-3">
      <h3 className="font-display text-lg font-semibold">Välj kategorier</h3>
      <div className="flex flex-wrap gap-2">
        {options.map((cat) => {
          const active = selected.includes(cat.value)
          return (
            <button
              key={cat.value}
              onClick={() => onToggle(cat.value)}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-medium transition-colors border',
                active
                  ? 'border-accent-primary bg-accent-primary/10 text-text-primary'
                  : 'border-border bg-bg-surface text-text-secondary hover:border-accent-primary/50'
              )}
            >
              {cat.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
