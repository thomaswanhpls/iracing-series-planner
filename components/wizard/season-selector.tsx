import { cn } from '@/lib/utils'

interface SeasonSelectorProps {
  selectedSeason: string
  onSelect: (season: string) => void
  seasons: {
    value: string
    label: string
    description?: string
  }[]
}

export function SeasonSelector({ selectedSeason, onSelect, seasons }: SeasonSelectorProps) {
  return (
    <div className="space-y-3">
      <h3 className="font-display text-lg font-semibold">Välj säsong</h3>
      <div className="grid gap-3 md:grid-cols-2">
        {seasons.map((s) => (
          <button
            key={s.value}
            onClick={() => onSelect(s.value)}
            className={cn(
              'rounded-md border px-4 py-3 text-left transition-colors',
              selectedSeason === s.value
                ? 'border-accent-primary bg-accent-primary/10 text-text-primary'
                : 'border-border bg-bg-surface text-text-secondary hover:border-accent-primary/50'
            )}
          >
            <div className="font-display text-sm font-semibold">{s.label}</div>
            {s.description && (
              <div className="mt-1 text-xs text-text-muted">{s.description}</div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
