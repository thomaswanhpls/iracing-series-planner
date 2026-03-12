'use client'

import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface ClassFilterProps {
  classes: string[]
  selected: string[]
  onToggle: (className: string) => void
}

function compactClassLabel(className: string) {
  const match = className.match(/^([A-ZR]) Class Series \(([^)]+)\)$/)
  if (!match) return className
  const license = match[1]
  const category = match[2]
    .split(' ')
    .map((part) => part[0] + part.slice(1).toLowerCase())
    .join(' ')
  return `${license} ${category}`
}

export function ClassFilter({ classes, selected, onToggle }: ClassFilterProps) {
  const [search, setSearch] = useState('')

  const filteredClasses = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return classes
    return classes.filter((className) => className.toLowerCase().includes(query))
  }, [classes, search])

  return (
    <div className="space-y-3">
      <h3 className="font-display text-lg font-semibold">Välj klasser</h3>
      <p className="text-sm text-text-secondary">
        Sök först och välj sedan de klasser du faktiskt kör.
      </p>
      <Input
        placeholder="Sök klass..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <div className="max-h-72 overflow-y-auto rounded-lg border border-border/60 bg-bg-surface/30 p-3">
        <div className="flex flex-wrap gap-2">
          {filteredClasses.map((className) => {
            const active = selected.includes(className)
            return (
              <button
                key={className}
                type="button"
                title={className}
                onClick={() => onToggle(className)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  active
                    ? 'border-accent-primary bg-accent-primary/10 text-text-primary'
                    : 'border-border bg-bg-surface text-text-secondary hover:border-accent-primary/50'
                )}
              >
                {compactClassLabel(className)}
              </button>
            )
          })}
        </div>
        {filteredClasses.length === 0 && (
          <div className="py-2 text-xs text-text-muted">Ingen klass matchade din sökning.</div>
        )}
      </div>
      <div className="text-xs text-text-muted">
        {selected.length === 0 ? 'Inga klasser valda: alla visas.' : `${selected.length} klasser valda.`}
      </div>
    </div>
  )
}
