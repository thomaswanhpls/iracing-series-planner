export function formatSeasonLabel(season: string): string {
  const [year, quarter] = season.split('-')
  return `iRacing ${year} S${quarter}`
}
