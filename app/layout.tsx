import './globals.css'
import { ReactNode } from 'react'
import { JetBrains_Mono, DM_Sans } from 'next/font/google'

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata = {
  title: 'iRacing Season Planner',
  description: 'Plan your season. Save money. Race more.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable} ${dmSans.variable}`}>
      <body className="min-h-screen bg-bg-base text-text-primary font-body antialiased">
        {children}
      </body>
    </html>
  )
}
