import { cn } from '@/lib/utils'
import type { Category } from '@/lib/iracing/types'

interface CategoryFilterProps {
  selected: Category[]
  onToggle: (category: Category) => void
}

const categories: { value: Category; label: string }[] = [
  { value: 'road', label: 'Road' },
  { value: 'oval', label: 'Oval' },
  { value: 'dirt_road', label: 'Dirt Road' },
  { value: 'dirt_oval', label: 'Dirt Oval' },
]

export function CategoryFilter({ selected, onToggle }: CategoryFilterProps) {
  return (
    <div className="space-y-3">
      <h3 className="font-display text-lg font-semibold">Välj kategorier</h3>
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => {
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
