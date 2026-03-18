function normalize(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export const knownCarBrands = [
  'Aston Martin',
  'Mercedes-AMG',
  'Mercedes Benz',
  'Alfa Romeo',
  'Lamborghini',
  'Chevrolet',
  'McLaren',
  'Renault',
  'Porsche',
  'Ferrari',
  'Toyota',
  'Nissan',
  'Mazda',
  'Cadillac',
  'Hyundai',
  'Volkswagen',
  'BMW',
  'Ford',
  'Kia',
] as const

export const brandAccentByName: Record<string, { from: string; to: string; ring: string; mono: string }> = {
  'Aston Martin': { from: '#8FD694', to: '#2D6A4F', ring: '#A7F3D0', mono: 'AM' },
  'Mercedes-AMG': { from: '#B8C0FF', to: '#4A4E69', ring: '#C7D2FE', mono: 'AMG' },
  'Mercedes Benz': { from: '#B8C0FF', to: '#4A4E69', ring: '#C7D2FE', mono: 'MB' },
  'Alfa Romeo': { from: '#FF8FA3', to: '#9D0208', ring: '#FECACA', mono: 'AR' },
  Lamborghini: { from: '#FDE68A', to: '#92400E', ring: '#FDE68A', mono: 'L' },
  Chevrolet: { from: '#FDE047', to: '#854D0E', ring: '#FEF08A', mono: 'C' },
  McLaren: { from: '#FB923C', to: '#C2410C', ring: '#FDBA74', mono: 'M' },
  Renault: { from: '#FACC15', to: '#A16207', ring: '#FDE047', mono: 'R' },
  Porsche: { from: '#FCA5A5', to: '#991B1B', ring: '#FECACA', mono: 'P' },
  Ferrari: { from: '#F87171', to: '#B91C1C', ring: '#FCA5A5', mono: 'F' },
  Toyota: { from: '#FCA5A5', to: '#7F1D1D', ring: '#FECACA', mono: 'T' },
  Nissan: { from: '#FCA5A5', to: '#7F1D1D', ring: '#FECACA', mono: 'N' },
  Mazda: { from: '#C4B5FD', to: '#5B21B6', ring: '#DDD6FE', mono: 'MZ' },
  Cadillac: { from: '#93C5FD', to: '#1D4ED8', ring: '#BFDBFE', mono: 'CD' },
  Hyundai: { from: '#93C5FD', to: '#1D4ED8', ring: '#BFDBFE', mono: 'H' },
  Volkswagen: { from: '#93C5FD', to: '#1D4ED8', ring: '#BFDBFE', mono: 'VW' },
  BMW: { from: '#93C5FD', to: '#1E40AF', ring: '#BFDBFE', mono: 'BMW' },
  Ford: { from: '#60A5FA', to: '#1D4ED8', ring: '#93C5FD', mono: 'F' },
  Kia: { from: '#FDA4AF', to: '#9F1239', ring: '#FBCFE8', mono: 'K' },
}

export function splitCars(value: string): string[] {
  if (!value) return []
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

export function inferCarBrand(modelName: string): string {
  const normalized = normalize(modelName)
  for (const brand of knownCarBrands) {
    if (normalized.startsWith(normalize(brand))) return brand
  }
  const firstToken = modelName.trim().split(/\s+/)[0]
  return firstToken || 'Okänt märke'
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function getCarLabels(modelName: string): { brand: string; model: string } {
  const brand = inferCarBrand(modelName)
  const trimmedModelName = modelName.trim()
  const withoutBrand = trimmedModelName.replace(new RegExp(`^${escapeRegExp(brand)}\\s+`, 'i'), '').trim()

  if (!withoutBrand) {
    return { brand, model: trimmedModelName }
  }

  return { brand, model: withoutBrand }
}
