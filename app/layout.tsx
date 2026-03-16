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
    <html lang="en" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-bg-base font-display text-text-primary antialiased">
        {children}
      </body>
    </html>
  )
}
