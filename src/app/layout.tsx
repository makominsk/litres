import type { Metadata } from 'next'
import { Comfortaa, Nunito } from 'next/font/google'
import { TooltipProvider } from '@/components/ui/tooltip'
import './globals.css'

const comfortaa = Comfortaa({
  weight: ['400', '600', '700'],
  subsets: ['latin', 'cyrillic'],
  variable: '--font-comfortaa',
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
    <html lang="ru" className={`${comfortaa.variable} ${nunito.variable}`}>
      <body className="antialiased">
        <TooltipProvider delayDuration={300}>
          {children}
        </TooltipProvider>
      </body>
    </html>
  )
}
