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

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'iRacing Season Planner',
    template: '%s | iRacing Season Planner',
  },
  description: 'Planera din iRacing-säsong. Optimera inköp av banor och maximera ditt deltagande.',
  openGraph: {
    title: 'iRacing Season Planner',
    description: 'Planera din iRacing-säsong. Optimera inköp av banor och maximera ditt deltagande.',
    type: 'website',
    locale: 'sv_SE',
    siteName: 'iRacing Season Planner',
  },
  robots: {
    index: true,
    follow: true,
  },
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
