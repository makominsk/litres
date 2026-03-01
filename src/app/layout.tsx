import type { Metadata } from 'next'
import { Merriweather, Nunito } from 'next/font/google'
import { TooltipProvider } from '@/components/ui/tooltip'
import './globals.css'

const merriweather = Merriweather({
  weight: ['400', '700', '900'],
  subsets: ['latin', 'cyrillic'],
  variable: '--font-merriweather',
  display: 'swap',
})

const nunito = Nunito({
  weight: ['400', '600', '700', '800'],
  subsets: ['latin', 'cyrillic'],
  variable: '--font-nunito',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'История Древнего мира — 5 класс',
  description: 'Голосовой помощник по истории Древнего мира для учеников 5 класса',
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" className={`${merriweather.variable} ${nunito.variable}`}>
      <body className="antialiased">
        <TooltipProvider delayDuration={300}>
          {children}
        </TooltipProvider>
      </body>
    </html>
  )
}
