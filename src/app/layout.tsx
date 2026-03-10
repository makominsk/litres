import type { Metadata } from 'next'
import { Rubik, Nunito } from 'next/font/google'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ToastProvider } from '@/components/ui/toast'
import { OfflineBanner } from '@/components/ui/offline-banner'
import { SmartWindowProvider } from '@/components/smart-window/SmartWindowProvider'
import './globals.css'

const rubik = Rubik({
  weight: ['400', '600', '700', '800', '900'],
  subsets: ['latin', 'cyrillic'],
  variable: '--font-rubik',
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
    <html lang="ru" className={`${rubik.variable} ${nunito.variable}`}>
      <body className="antialiased">
        <TooltipProvider delayDuration={300}>
          <ToastProvider>
            <OfflineBanner />
            {children}
            <SmartWindowProvider />
          </ToastProvider>
        </TooltipProvider>
      </body>
    </html>
  )
}
