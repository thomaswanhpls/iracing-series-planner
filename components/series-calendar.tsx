'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, THead, TBody, Th, Tr, Td } from '@/components/ui/table'
import { cn } from '@/lib/utils'

export type Series = {
  id: string
  name: string
  schedule: string[]
}

const seriesData: Series[] = [
  {
    id: 'mx5',
    name: 'MX-5 Cup',
    schedule: [
      'Daytona',
      'Charlotte',
      'Okayama',
      'Brands Hatch',
      'Virginia',
      'Oulton Park',
      'Sonoma',
      'Road America',
      'Lime Rock',
      'Barber',
      'Laguna Seca',
      'Road Atlanta',
    ],
  },
  {
    id: 'f1600',
    name: 'Formula 1600',
    schedule: [
      'Road Atlanta',
      'Lime Rock',
      'VIR',
      'Interlagos',
      'Zolder',
      'Zandvoort',
      'Red Bull Ring',
      'Nogaro',
      'Snetterton',
      'Road America',
      'Silverstone',
      'Daytona',
    ],
  },
]

const allTracks = Array.from(new Set(seriesData.flatMap((s) => s.schedule)))

export function SeriesCalendar() {
  const [ownedTracks, setOwnedTracks] = useState<string[]>([])
  const [interestedSeries, setInterestedSeries] = useState<string[]>([])

  const toggleTrack = (track: string) => {
    setOwnedTracks((prev) =>
      prev.includes(track) ? prev.filter((t) => t !== track) : [...prev, track]
    )
  }

  const toggleSeries = (id: string) => {
    setInterestedSeries((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  return (
    <div className="grid gap-4">
      <Card>
        <h2 className="font-bold mb-2">Banor jag äger</h2>
        <div className="grid grid-cols-2 gap-2">
          {allTracks.map((track) => (
            <label key={track} className="flex items-center space-x-2">
              <Checkbox
                checked={ownedTracks.includes(track)}
                onChange={() => toggleTrack(track)}
              />
              <span>{track}</span>
            </label>
          ))}
        </div>
      </Card>
      <Card>
        <h2 className="font-bold mb-2">Racingserier</h2>
        {seriesData.map((series) => (
          <div key={series.id} className="mb-4">
            <div className="flex items-center space-x-2 mb-1">
              <Checkbox
                checked={interestedSeries.includes(series.id)}
                onChange={() => toggleSeries(series.id)}
              />
              <h3 className="font-semibold">{series.name}</h3>
            </div>
            <Table>
              <THead>
                <Tr>
                  <Th>Vecka</Th>
                  <Th>Bana</Th>
                </Tr>
              </THead>
              <TBody>
                {series.schedule.map((track, idx) => (
                  <Tr key={track + idx}>
                    <Td>{idx + 1}</Td>
                    <Td className={cn(ownedTracks.includes(track) && 'font-bold')}>
                      {track}
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </div>
        ))}
      </Card>
    </div>
  )
}
