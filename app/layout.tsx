import './globals.css'
import type { Metadata } from 'next'
import { ReactNode } from 'react'
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500'],
})

export const metadata: Metadata = {
  title: {
    default: 'iRacing Season Planner',
    template: '%s | iRacing Season Planner',
  },
  description: 'Plan your iRacing season. Optimize track purchases and maximize your participation.',
  openGraph: {
    title: 'iRacing Season Planner',
    description: 'Plan your iRacing season. Optimize track purchases and maximize your participation.',
    type: 'website',
    siteName: 'iRacing Season Planner',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-bg-base font-display text-text-primary antialiased">
        {children}
      </body>
    </html>
  )
}
