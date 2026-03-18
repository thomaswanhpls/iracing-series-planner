'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'

interface CarsStepProps {
  allCars: string[]
  initialOwnedCarNames: string[]
  onNext: (ownedCarNames: string[]) => void
  onBack: () => void
  isPending: boolean
}

function normalize(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function CarsStep({
  allCars,
  initialOwnedCarNames,
  onNext,
  onBack,
  isPending,
}: CarsStepProps) {
  const [search, setSearch] = useState('')
  const [owned, setOwned] = useState<Set<string>>(new Set(initialOwnedCarNames))

  const filtered = useMemo(() => {
    if (!search.trim()) return allCars
    const q = normalize(search)
    return allCars.filter((c) => normalize(c).includes(q))
  }, [allCars, search])

  function toggle(carName: string) {
    setOwned((prev) => {
      const next = new Set(prev)
      if (next.has(carName)) next.delete(carName)
      else next.add(carName)
      return next
    })
  }

  function toggleAll() {
    const allChecked = filtered.every((c) => owned.has(c))
    setOwned((prev) => {
      const next = new Set(prev)
      if (allChecked) {
        filtered.forEach((c) => next.delete(c))
      } else {
        filtered.forEach((c) => next.add(c))
      }
      return next
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-1">Dina bilar</h2>
        <p className="text-sm text-text-secondary">
          Markera de bilar du redan äger. Omarkerade bilar kan påverka kostnadskalkylerna.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Input
          type="text"
          placeholder="Sök bil..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <span className="text-xs text-text-muted">
          {owned.size} / {allCars.length} ägda
        </span>
      </div>

      {filtered.length > 0 && (
        <button
          type="button"
          onClick={toggleAll}
          className="self-start text-xs text-accent-cyan/70 hover:text-accent-cyan transition-colors"
        >
          {filtered.every((c) => owned.has(c))
            ? 'Avmarkera filtrerade'
            : 'Markera filtrerade'}
        </button>
      )}

      <div
        className="flex flex-col gap-1 overflow-y-auto rounded-md border border-border-subtle bg-bg-glass p-2"
        style={{ maxHeight: '50vh' }}
      >
        {filtered.length === 0 && (
          <p className="py-4 text-center text-sm text-text-muted">Inga bilar hittades.</p>
        )}
        {filtered.map((carName) => {
          const isOwned = owned.has(carName)
          return (
            <div
              key={carName}
              role="button"
              tabIndex={0}
              onClick={() => toggle(carName)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  toggle(carName)
                }
              }}
              className={[
                'flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
                isOwned
                  ? 'border border-[rgba(0,255,255,0.55)] bg-[rgba(0,255,255,0.08)]'
                  : 'border border-transparent hover:bg-white/[0.03]',
              ].join(' ')}
            >
              <Checkbox checked={isOwned} readOnly aria-hidden />
              <span className="flex-1 text-text-primary">{carName}</span>
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={onBack}>
          ← Tillbaka
        </Button>
        <Button onClick={() => onNext(Array.from(owned))} disabled={isPending}>
          {isPending ? 'Sparar...' : 'Nästa →'}
        </Button>
      </div>
    </div>
  )
}
