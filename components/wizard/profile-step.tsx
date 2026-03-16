'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const LICENSE_CLASSES = ['Rookie', 'D', 'C', 'B', 'A', 'Pro', 'WC'] as const
type LicenseClass = (typeof LICENSE_CLASSES)[number]

interface ProfileStepProps {
  initialProfile: { name: string; licenseClass: string }
  onNext: (profile: { name: string; licenseClass: string }) => void
}

export function ProfileStep({ initialProfile, onNext }: ProfileStepProps) {
  const [name, setName] = useState(initialProfile.name)
  const [licenseClass, setLicenseClass] = useState<LicenseClass>(
    (initialProfile.licenseClass as LicenseClass) ?? 'Rookie'
  )

  function handleNext() {
    onNext({ name, licenseClass })
  }

  return (
    <div className="flex flex-col gap-6 max-w-md">
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-1">Din profil</h2>
        <p className="text-sm text-text-secondary">
          Ange ditt iRacing-namn och din nuvarande licensklass.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-secondary" htmlFor="profile-name">
            Namn
          </label>
          <Input
            id="profile-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ditt iRacing-namn"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            className="text-sm font-medium text-text-secondary"
            htmlFor="profile-license"
          >
            Licensklass
          </label>
          <select
            id="profile-license"
            value={licenseClass}
            onChange={(e) => setLicenseClass(e.target.value as LicenseClass)}
            className="h-10 rounded-md border border-border bg-bg-elevated px-3 text-sm text-text-primary focus:border-accent-cyan focus:outline-none focus:ring-1 focus:ring-accent-cyan/40 cursor-pointer"
          >
            {LICENSE_CLASSES.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Button onClick={handleNext} className="self-start">
        Nästa →
      </Button>
    </div>
  )
}
