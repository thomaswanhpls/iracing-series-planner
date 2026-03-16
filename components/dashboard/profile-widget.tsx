import { Card } from '@/components/ui/card'
import Link from 'next/link'

interface ProfileWidgetProps {
  name: string
  licenseClass: string
  selectedSeriesCount: number
}

export function ProfileWidget({ name, licenseClass, selectedSeriesCount }: ProfileWidgetProps) {
  return (
    <Card className="p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-text-muted mb-1">
            Profil
          </div>
          <div className="text-lg font-semibold text-text-primary">
            {name || <span className="text-text-muted italic">Ej angivet</span>}
          </div>
          <div className="text-sm text-text-secondary mt-0.5">
            Licens: <span className="text-accent-cyan font-medium">{licenseClass}</span>
          </div>
        </div>
        <Link
          href="/setup"
          className="text-xs text-text-muted hover:text-accent-cyan transition-colors border border-border rounded-md px-2.5 py-1"
        >
          Redigera setup
        </Link>
      </div>
      <div className="text-sm text-text-secondary">
        <span className="font-semibold text-text-primary">{selectedSeriesCount}</span> valda serier
      </div>
    </Card>
  )
}
