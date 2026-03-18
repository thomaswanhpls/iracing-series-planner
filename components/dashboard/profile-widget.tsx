import { Card } from '@/components/ui/card'
import Link from 'next/link'

interface ProfileWidgetProps {
  name: string
  licenseSportsCar: string
  licenseFormulaCar: string
  licenseOval: string
  licenseDirtRoad: string
  licenseDirtOval: string
  selectedSeriesCount: number
}

const DISCIPLINES = [
  { key: 'licenseSportsCar', label: 'Sports Car' },
  { key: 'licenseFormulaCar', label: 'Formula Car' },
  { key: 'licenseOval', label: 'Oval' },
  { key: 'licenseDirtRoad', label: 'Dirt Road' },
  { key: 'licenseDirtOval', label: 'Dirt Oval' },
] as const

export function ProfileWidget({
  name,
  licenseSportsCar,
  licenseFormulaCar,
  licenseOval,
  licenseDirtRoad,
  licenseDirtOval,
  selectedSeriesCount,
}: ProfileWidgetProps) {
  const values: Record<string, string> = {
    licenseSportsCar,
    licenseFormulaCar,
    licenseOval,
    licenseDirtRoad,
    licenseDirtOval,
  }

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
        </div>
        <Link
          href="/setup"
          className="text-xs text-text-muted hover:text-accent-cyan transition-colors border border-border rounded-md px-2.5 py-1"
        >
          Redigera setup
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {DISCIPLINES.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between rounded px-2 py-1 bg-bg-base border border-border/40">
            <span className="text-[11px] text-text-muted">{label}</span>
            <span className="text-[11px] font-semibold text-accent-cyan">{values[key]}</span>
          </div>
        ))}
      </div>

      <div className="text-sm text-text-secondary">
        <span className="font-semibold text-text-primary">{selectedSeriesCount}</span> valda serier
      </div>
    </Card>
  )
}
