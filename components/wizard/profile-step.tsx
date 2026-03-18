'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const LICENSE_CLASSES = ['Rookie', 'D', 'C', 'B', 'A', 'Pro', 'WC'] as const
type LicenseClass = (typeof LICENSE_CLASSES)[number]

const LICENSE_OPTIONS = LICENSE_CLASSES.map((cls) => {
  const labels: Record<LicenseClass, string> = {
    Rookie: 'Rookie',
    D: 'D-klass',
    C: 'C-klass',
    B: 'B-klass',
    A: 'A-klass',
    Pro: 'Pro',
    WC: 'WC',
  }
  return { value: cls, label: labels[cls] }
})

const DISCIPLINES: { key: keyof Omit<ProfileData, 'name'>; label: string; sub: string }[] = [
  { key: 'licenseSportsCar', label: 'Sports Car', sub: 'GT, TCR, prototype' },
  { key: 'licenseFormulaCar', label: 'Formula Car', sub: 'F3, F4, IR-18' },
  { key: 'licenseOval', label: 'Oval', sub: 'NASCAR, stock cars' },
  { key: 'licenseDirtRoad', label: 'Dirt Road', sub: 'Rallycross, dirt road' },
  { key: 'licenseDirtOval', label: 'Dirt Oval', sub: 'Sprint cars, midgets' },
]

export interface ProfileData {
  name: string
  licenseSportsCar: string
  licenseFormulaCar: string
  licenseOval: string
  licenseDirtRoad: string
  licenseDirtOval: string
}

interface ProfileStepProps {
  initialProfile: ProfileData
  onNext: (profile: ProfileData) => void
}

export function ProfileStep({ initialProfile, onNext }: ProfileStepProps) {
  const [name, setName] = useState(initialProfile.name)
  const [licenses, setLicenses] = useState<Record<string, LicenseClass>>({
    licenseSportsCar: (initialProfile.licenseSportsCar as LicenseClass) ?? 'Rookie',
    licenseFormulaCar: (initialProfile.licenseFormulaCar as LicenseClass) ?? 'Rookie',
    licenseOval: (initialProfile.licenseOval as LicenseClass) ?? 'Rookie',
    licenseDirtRoad: (initialProfile.licenseDirtRoad as LicenseClass) ?? 'Rookie',
    licenseDirtOval: (initialProfile.licenseDirtOval as LicenseClass) ?? 'Rookie',
  })

  function handleNext() {
    onNext({
      name,
      licenseSportsCar: licenses.licenseSportsCar,
      licenseFormulaCar: licenses.licenseFormulaCar,
      licenseOval: licenses.licenseOval,
      licenseDirtRoad: licenses.licenseDirtRoad,
      licenseDirtOval: licenses.licenseDirtOval,
    })
  }

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-1">Din profil</h2>
        <p className="text-sm text-text-secondary">
          Vad heter du, och vilken licensklass kör du i per disciplin?
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-secondary" htmlFor="profile-name">
            Namn <span className="font-normal text-text-muted">(valfritt)</span>
          </label>
          <Input
            id="profile-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="T.ex. Max Verstappen"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-text-secondary">Licensklass per disciplin</span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {DISCIPLINES.map(({ key, label, sub }) => (
              <div key={key} className="flex flex-col gap-1 rounded-md border border-border bg-bg-elevated p-3">
                <div className="flex flex-col mb-1">
                  <span className="text-xs font-semibold text-text-primary">{label}</span>
                  <span className="text-[11px] text-text-muted">{sub}</span>
                </div>
                <div className="relative">
                <select
                  value={licenses[key]}
                  onChange={(e) =>
                    setLicenses((prev) => ({ ...prev, [key]: e.target.value as LicenseClass }))
                  }
                  className="w-full appearance-none rounded-sm border border-border bg-bg-base pl-3 pr-8 py-1.5 font-display text-[13px] text-text-secondary transition-[border-color,box-shadow] focus:border-border-focus focus:shadow-[0_0_5px_rgba(0,255,255,0.3)] focus:outline-none cursor-pointer [&>option]:bg-bg-elevated [&>option]:text-text-primary"
                >
                  {LICENSE_OPTIONS.map(({ value, label: optLabel }) => (
                    <option key={value} value={value}>
                      {optLabel}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Button onClick={handleNext} className="self-start">
        Nästa →
      </Button>
    </div>
  )
}
