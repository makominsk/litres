import type { Metadata, Viewport } from 'next'
import { Nunito } from 'next/font/google'
import { TooltipProvider } from '@/components/ui/tooltip'
import './globals.css'

const nunito = Nunito({
  weight: ['400', '600', '700', '800', '900'],
  subsets: ['latin', 'cyrillic'],
  variable: '--font-nunito',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ИстoriКвест -- Тесты по истории для 5 класса',
  description: 'Интерактивные тесты по истории Древнего мира для учеников 5 класса. Отвечай голосом или текстом!',
}

export const viewport: Viewport = {
  themeColor: '#4F46E5',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" className={nunito.variable}>
      <body className="antialiased font-sans">
        <TooltipProvider delayDuration={300}>
          {children}
        </TooltipProvider>
      </body>
    </html>
  )
}
