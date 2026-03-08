import { cn } from '@/lib/utils'

interface SeasonSelectorProps {
  selectedSeason: string
  onSelect: (season: string) => void
}

const seasons = [
  { value: '2026-1', label: '2026 Season 1' },
  { value: '2026-2', label: '2026 Season 2' },
]

export function SeasonSelector({ selectedSeason, onSelect }: SeasonSelectorProps) {
  return (
    <div className="space-y-3">
      <h3 className="font-display text-lg font-semibold">Välj säsong</h3>
      <div className="flex gap-3">
        {seasons.map((s) => (
          <button
            key={s.value}
            onClick={() => onSelect(s.value)}
            className={cn(
              'rounded-md px-4 py-2 text-sm font-medium transition-colors border',
              selectedSeason === s.value
                ? 'border-accent-primary bg-accent-primary/10 text-text-primary'
                : 'border-border bg-bg-surface text-text-secondary hover:border-accent-primary/50'
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}
