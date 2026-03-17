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
    <div className="flex h-[52px] shrink-0 items-center gap-0 border-b border-white/10 bg-white/[0.02] px-4">
      {name && (
        <>
          <span className="text-[13px] font-semibold text-white/80">{name}</span>
          <div className="mx-3 h-[22px] w-px bg-white/10" />
        </>
      )}
      <div className="flex items-center gap-3.5">
        {DISCIPLINES.map(({ key, label, color }) => (
          <span key={key} className="flex items-center gap-[5px] text-[10px]">
            <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: color }} />
            <span className="text-white/40">{label}</span>
            <span className="font-semibold text-white/60 ml-0.5">{levels[key]}</span>
          </span>
        ))}
      </div>
      <div className="ml-auto flex items-center gap-3">
        <span className="text-[10px] text-white/30">{seasonLabel}</span>
        <Link href="/setup" className="text-[10px] text-cyan-400/40 transition-colors hover:text-cyan-400/80">
          Ändra profil →
        </Link>
      </div>
    </div>
  )
}
