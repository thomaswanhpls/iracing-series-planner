import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { SeasonCategory, SeasonScheduleData, SeasonSeries, SeasonWeek } from '@/lib/season-schedules/types'

const season2Categories: SeasonCategory[] = [
  { id: 'sports-car', label: 'Sports Car', filename: 'sports-car-2026-season-2.md' },
  { id: 'formula-car', label: 'Formula Car', filename: 'formula-car-2026-season-2.md' },
  { id: 'oval', label: 'Oval', filename: 'oval-2026-season-2.md' },
  { id: 'dirt-road', label: 'Dirt Road', filename: 'dirt-road-2026-season-2.md' },
  { id: 'dirt-oval', label: 'Dirt Oval', filename: 'dirt-oval-2026-season-2.md' },
  { id: 'unranked', label: 'Unranked', filename: 'unranked-2026-season-2.md' },
]

interface ParsedTable {
  headers: string[]
  rows: string[][]
  endIndex: number
}

function normalize(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function splitMarkdownRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim())
}

function parseTable(lines: string[], startIndex: number): ParsedTable | null {
  if (!lines[startIndex]?.trim().startsWith('|')) {
    return null
  }

  const headers = splitMarkdownRow(lines[startIndex])
  const separator = lines[startIndex + 1]?.trim() ?? ''
  if (!separator.startsWith('|') || !separator.includes('---')) {
    return null
  }

  const rows: string[][] = []
  let index = startIndex + 2
  while (index < lines.length && lines[index].trim().startsWith('|')) {
    rows.push(splitMarkdownRow(lines[index]))
    index += 1
  }

  return { headers, rows, endIndex: index }
}

function toDetailsMap(table: ParsedTable | null) {
  const values = new Map<string, string>()
  if (!table) return values

  for (const row of table.rows) {
    const key = row[0] ?? ''
    const value = row[1] ?? ''
    if (key) values.set(normalize(key), value)
  }

  return values
}

function toWeeks(table: ParsedTable | null): SeasonWeek[] {
  if (!table) return []

  const normalizedHeaders = table.headers.map(normalize)
  const weekIdx = normalizedHeaders.findIndex((header) => header.includes('vecka') || header === 'week')
  const startDateIdx = normalizedHeaders.findIndex(
    (header) => header.includes('startdatum') || header.includes('start date')
  )
  const trackIdx = normalizedHeaders.findIndex((header) => header.includes('bana') || header.includes('track'))
  const lengthIdx = normalizedHeaders.findIndex((header) => header.includes('langd') || header.includes('length'))
  const refIdx = normalizedHeaders.findIndex(
    (header) => header.includes('referenspass') || header.includes('reference')
  )
  const notesIdx = normalizedHeaders.findIndex(
    (header) => header.includes('noteringar') || header.includes('notes')
  )

  const weeks = table.rows.map((row) => ({
    week: row[weekIdx] ?? '',
    startDate: row[startDateIdx] ?? '',
    track: row[trackIdx] ?? '',
    length: row[lengthIdx] ?? '',
    referenceSession: row[refIdx] ?? '',
    notes: row[notesIdx] ?? '',
  }))

  const seen = new Set<string>()
  return weeks.filter((week) => {
    const signature = [
      week.week,
      week.startDate,
      week.track,
      week.length,
      week.referenceSession,
    ].join('|')

    if (seen.has(signature)) return false
    seen.add(signature)
    return true
  })
}

function parseOverviewClassMap(lines: string[]) {
  const classBySeries = new Map<string, string>()

  for (let i = 0; i < lines.length; i += 1) {
    const table = parseTable(lines, i)
    if (!table) continue

    const headers = table.headers.map(normalize)
    const hasClass = headers.some((header) => header.includes('klass') || header.includes('class'))
    const hasSeries = headers.some((header) => header.includes('serie') || header.includes('series'))

    if (!hasClass || !hasSeries) {
      i = table.endIndex
      continue
    }

    const classIdx = headers.findIndex((header) => header.includes('klass') || header.includes('class'))
    const seriesIdx = headers.findIndex((header) => header.includes('serie') || header.includes('series'))

    for (const row of table.rows) {
      const className = row[classIdx] ?? ''
      const title = row[seriesIdx] ?? ''
      if (className && title) classBySeries.set(title, className)
    }

    break
  }

  return classBySeries
}

function createSeriesId(categoryId: string, title: string) {
  const slug = normalize(title)
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

  return `${categoryId}-${slug}`
}

function parseCategoryMarkdown(category: SeasonCategory, markdown: string): SeasonSeries[] {
  const lines = markdown.split(/\r?\n/)
  const classBySeries = parseOverviewClassMap(lines)
  const parsedSeries: SeasonSeries[] = []

  let currentClass = 'Unknown Class'

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim()

    if (line.startsWith('## ')) {
      const heading = line.replace(/^##\s+/, '').trim()
      if (!heading.toLowerCase().includes('oversikt') && !heading.toLowerCase().includes('översikt')) {
        currentClass = heading
      }
    }

    if (!line.startsWith('### ')) continue

    const title = line.replace(/^###\s+/, '').trim()
    let endIndex = lines.length
    for (let j = i + 1; j < lines.length; j += 1) {
      if (lines[j].trim().startsWith('### ')) {
        endIndex = j
        break
      }
    }

    const sectionLines = lines.slice(i + 1, endIndex)
    let detailsTable: ParsedTable | null = null
    let weeksTable: ParsedTable | null = null

    for (let sectionIndex = 0; sectionIndex < sectionLines.length; sectionIndex += 1) {
      const table = parseTable(sectionLines, sectionIndex)
      if (!table) continue

      const normalizedHeaders = table.headers.map(normalize)
      const isWeeksTable = normalizedHeaders.some((header) => header.includes('vecka') || header === 'week')

      if (isWeeksTable) {
        weeksTable = table
      } else if (!detailsTable) {
        detailsTable = table
      }

      sectionIndex = table.endIndex - 1
    }

    const details = toDetailsMap(detailsTable)
    const className = classBySeries.get(title) ?? currentClass

    parsedSeries.push({
      id: createSeriesId(category.id, title),
      categoryId: category.id,
      categoryLabel: category.label,
      className,
      title,
      pdfPage: details.get('pdf-sida') ?? details.get('pdf page') ?? '',
      cars: details.get('bil(ar)') ?? details.get('cars') ?? '',
      license: details.get('licens') ?? details.get('license') ?? '',
      frequency: details.get('frekvens') ?? details.get('frequency') ?? '',
      extra: details.get('ovrigt') ?? details.get('övrigt') ?? details.get('extra') ?? '',
      weeks: toWeeks(weeksTable),
    })

    i = endIndex - 1
  }

  return parsedSeries
}

export async function getSeason2Schedules(): Promise<SeasonScheduleData> {
  'use cache'

  const docsPath = join(process.cwd(), 'docs', '2026-season-2')

  const categoryResults = await Promise.all(
    season2Categories.map(async (category) => {
      const filePath = join(docsPath, category.filename)
      const markdown = await readFile(filePath, 'utf8')
      return parseCategoryMarkdown(category, markdown)
    })
  )

  const series = categoryResults.flat()

  return {
    categories: season2Categories,
    series,
  }
}
