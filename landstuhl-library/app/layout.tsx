import type { Metadata } from 'next'
import { Inter, Playfair_Display, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Landstuhl Library — Your Community Library in Germany',
  description:
    'Books, tech, community programs & more at Landstuhl Regional Medical Center. Free library cards for all SOFA-eligible patrons.',
  keywords: ['Landstuhl', 'library', 'military library', 'Germany', 'LRMC', 'SOFA'],
  openGraph: {
    title: 'Landstuhl Library',
    description: 'Your community library at LRMC, Germany.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${jetbrains.variable}`}>
      <body className="antialiased overflow-x-hidden">{children}</body>
    </html>
  )
}
