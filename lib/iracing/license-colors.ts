interface LicenseColor {
  text: string
  bg: string
  border: string
}

const licenseColors: Record<string, LicenseColor> = {
  R: { text: '#d45555', bg: 'rgba(200,60,60,0.12)', border: 'rgba(200,60,60,0.22)' },
  D: { text: '#d9a040', bg: 'rgba(220,150,40,0.12)', border: 'rgba(220,150,40,0.22)' },
  C: { text: '#d4c645', bg: 'rgba(210,190,50,0.12)', border: 'rgba(210,190,50,0.22)' },
  B: { text: '#5cc97a', bg: 'rgba(60,170,90,0.12)', border: 'rgba(60,170,90,0.22)' },
  A: { text: '#68b0e8', bg: 'rgba(70,130,210,0.12)', border: 'rgba(70,130,210,0.22)' },
  P: { text: '#a0a0b0', bg: 'rgba(180,180,200,0.08)', border: 'rgba(180,180,200,0.15)' },
}

const fallback: LicenseColor = { text: '#7d8aa6', bg: 'rgba(22,34,56,0.4)', border: 'rgba(38,53,83,0.5)' }

export function getLicenseColor(license: string): LicenseColor {
  const letter = license.trim().charAt(0).toUpperCase()
  return licenseColors[letter] ?? fallback
}

export function getLicenseLabel(raw: string): string {
  if (!raw) return 'N/A'
  return raw.split(',')[0]?.trim() ?? raw
}
