import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg-base text-text-primary">
      <div className="text-center">
        <h1 className="font-display text-7xl font-bold text-accent-primary">404</h1>
        <p className="mt-4 font-display text-xl text-text-secondary">
          Sidan kunde inte hittas
        </p>
        <p className="mt-2 text-sm text-text-muted">
          Kontrollera adressen eller gå tillbaka till startsidan.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-bg-surface px-6 py-3 font-display text-sm font-medium text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Tillbaka till start
        </Link>
      </div>
    </main>
  )
}
