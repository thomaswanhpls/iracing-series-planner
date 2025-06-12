import { SeriesCalendar } from '@/components/series-calendar'

export default function Dashboard() {
  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">Series Dashboard</h1>
      <SeriesCalendar />
    </main>
  )
}
