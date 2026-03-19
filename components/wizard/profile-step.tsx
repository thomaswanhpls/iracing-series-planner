'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const LICENSE_CLASSES = ['Rookie', 'D', 'C', 'B', 'A', 'Pro', 'WC'] as const
type LicenseClass = (typeof LICENSE_CLASSES)[number]

const DISCIPLINE_KEYS: Array<{ key: keyof Omit<ProfileData, 'name'>; labelKey: string; subKey: string }> = [
  { key: 'licenseSportsCar', labelKey: 'sportsCar', subKey: 'sportsCarSub' },
  { key: 'licenseFormulaCar', labelKey: 'formulaCar', subKey: 'formulaCarSub' },
  { key: 'licenseOval', labelKey: 'oval', subKey: 'ovalSub' },
  { key: 'licenseDirtRoad', labelKey: 'dirtRoad', subKey: 'dirtRoadSub' },
  { key: 'licenseDirtOval', labelKey: 'dirtOval', subKey: 'dirtOvalSub' },
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
  const t = useTranslations('wizard.profile')
  const tCommon = useTranslations('common')
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
        <h2 className="text-lg font-semibold text-text-primary mb-1">{t('title')}</h2>
        <p className="text-sm text-text-secondary">{t('subtitle')}</p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-secondary" htmlFor="profile-name">
            {t('name')} <span className="font-normal text-text-muted">{t('nameOptional')}</span>
          </label>
          <Input
            id="profile-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('namePlaceholder')}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-text-secondary">{t('licensePerDiscipline')}</span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {DISCIPLINE_KEYS.map(({ key, labelKey, subKey }) => (
              <div key={key} className="flex flex-col gap-1 rounded-md border border-border bg-bg-elevated p-3">
                <div className="flex flex-col mb-1">
                  <span className="text-xs font-semibold text-text-primary">
                    {t(`disciplines.${labelKey}` as Parameters<typeof t>[0])}
                  </span>
                  <span className="text-[11px] text-text-muted">
                    {t(`disciplines.${subKey}` as Parameters<typeof t>[0])}
                  </span>
                </div>
                <div className="relative">
                <select
                  value={licenses[key]}
                  onChange={(e) =>
                    setLicenses((prev) => ({ ...prev, [key]: e.target.value as LicenseClass }))
                  }
                  className="w-full appearance-none rounded-sm border border-border bg-bg-base pl-3 pr-8 py-1.5 font-display text-[13px] text-text-secondary transition-[border-color,box-shadow] focus:border-border-focus focus:shadow-[0_0_5px_rgba(0,232,224,0.3)] focus:outline-none cursor-pointer [&>option]:bg-bg-elevated [&>option]:text-text-primary"
                >
                  {LICENSE_CLASSES.map((cls) => (
                    <option key={cls} value={cls}>
                      {t(`licenseOptions.${cls}` as Parameters<typeof t>[0])}
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
        {tCommon('next')}
      </Button>
    </div>
  )
}
