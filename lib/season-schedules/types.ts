export interface SeasonWeek {
  week: string
  startDate: string
  track: string
  length: string
  referenceSession: string
  notes: string
}

export interface SeasonSeries {
  id: string
  categoryId: string
  categoryLabel: string
  className: string
  title: string
  pdfPage: string
  cars: string
  license: string
  frequency: string
  extra: string
  weeks: SeasonWeek[]
}

export interface SeasonCategory {
  id: string
  label: string
  filename: string
}

export interface SeasonScheduleData {
  categories: SeasonCategory[]
  series: SeasonSeries[]
}