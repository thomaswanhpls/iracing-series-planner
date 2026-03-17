// components/dashboard/profile-strip.tsx
import Link from 'next/link'

interface ProfileStripProps {
  name: string
  licenseSportsCar: string
  licenseFormulaCar: string
  licenseOval: string
  licenseDirtRoad: string
  licenseDirtOval: string
  seasonLabel: string
}

const DISCIPLINES = [
  { key: 'licenseSportsCar' as const, label: 'Sports Car', color: '#60b8ff' },
  { key: 'licenseFormulaCar' as const, label: 'Formula Car', color: '#c060ff' },
  { key: 'licenseOval' as const, label: 'Oval', color: '#ff9060' },
  { key: 'licenseDirtRoad' as const, label: 'Dirt Road', color: '#60d890' },
  { key: 'licenseDirtOval' as const, label: 'Dirt Oval', color: '#ffd060' },
] as const

export function ProfileStrip({
  name,
  licenseSportsCar,
  licenseFormulaCar,
  licenseOval,
  licenseDirtRoad,
  licenseDirtOval,
  seasonLabel,
}: ProfileStripProps) {
  const levels: Record<(typeof DISCIPLINES)[number]['key'], string> = {
    licenseSportsCar,
    licenseFormulaCar,
    licenseOval,
    licenseDirtRoad,
    licenseDirtOval,
  }

  return (
    <div className="flex h-14 shrink-0 items-center border-b border-border-subtle bg-bg-elevated px-5">
      {name && (
        <>
          <span className="text-sm font-semibold text-text-primary">{name}</span>
          <div className="mx-4 h-5 w-px bg-border" />
        </>
      )}
      <div className="flex items-center gap-5">
        {DISCIPLINES.map(({ key, label, color }) => (
          <span key={key} className="flex items-center gap-1.5 text-xs">
            <span className="h-2 w-2 rounded-full shrink-0" style={{ background: color }} />
            <span className="text-text-muted">{label}</span>
            <span className="font-semibold text-text-secondary">{levels[key]}</span>
          </span>
        ))}
      </div>
      <div className="ml-auto flex items-center gap-4">
        <span className="text-xs text-text-muted">{seasonLabel}</span>
        <Link href="/setup" className="text-xs text-accent-cyan/60 transition-colors hover:text-accent-cyan/80">
          Ändra profil →
        </Link>
      </div>
    </div>
  )
}
