'use client'

import { RotateCcw } from 'lucide-react'

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg-base text-text-primary">
      <div className="text-center">
        <h1 className="font-display text-5xl font-bold text-accent-cyan">Något gick fel</h1>
        <p className="mt-4 text-sm text-text-muted">
          Ett oväntat fel inträffade. Försök igen.
        </p>
        <button
          onClick={reset}
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-accent-cyan px-6 py-3 font-display text-sm font-semibold text-bg-base transition-colors hover:bg-accent-cyan/80"
        >
          <RotateCcw className="h-4 w-4" />
          Försök igen
        </button>
      </div>
    </main>
  )
}
