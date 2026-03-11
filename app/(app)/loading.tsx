export default function Loading() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent-primary" />
        <p className="font-display text-sm text-text-muted">Laddar...</p>
      </div>
    </div>
  )
}
