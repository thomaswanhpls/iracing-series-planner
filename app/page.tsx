import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center space-y-4">
      <h1 className="text-4xl font-bold">Welcome to Next.js!</h1>
      <Link href="/dashboard" className="text-blue-600 underline">
        Go to dashboard
      </Link>
    </main>
  )
}
