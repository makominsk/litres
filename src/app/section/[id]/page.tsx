'use client'
import { use } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Header } from '@/components/ui/header'
import { ParagraphList } from '@/components/section/paragraph-list'
import { useAppStore } from '@/stores/app-store'
import textbook from '@/data/textbook.json'

const SECTION_META: Record<string, {
  color: string
  colorLight: string
  description: string
  iconPath: string
}> = {
  'ancient-greece': {
    color: '#2563EB',
    colorLight: '#DBEAFE',
    description: 'Полисы, войны, олимпийские игры, Александр Македонский',
    iconPath: 'M3 21h18 M5 21V7l7-4 7 4v14 M9 21v-8h6v8 M3 7h18',
  },
  'ancient-rome': {
    color: '#DC2626',
    colorLight: '#FEE2E2',
    description: 'Республика, Пунические войны, Цезарь, Империя',
    iconPath: 'M12 2L2 7h20L12 2z M4 7v10h16V7 M4 17h16v4H4z M8 7v10 M12 7v10 M16 7v10',
  },
  'germanic-slavic': {
    color: '#059669',
    colorLight: '#D1FAE5',
    description: 'Быт племён, обычаи, Великое переселение народов',
    iconPath: 'M17 14c.3-2 .6-3.3.6-5A6.6 6.6 0 0011 2.6a6.6 6.6 0 00-6.6 6.4c0 1.7.3 3 .6 5 M4 22c1.5-2 3-3.5 3-6h10c0 2.5 1.5 4 3 6 M7 16h10',
  },
}

export default function SectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const getSectionProgress = useAppStore((s) => s.getSectionProgress)

  const section = textbook.sections.find((s) => s.id === id)
  if (!section) notFound()

  const meta = SECTION_META[id] ?? {
    color: '#6B7280',
    colorLight: '#F3F4F6',
    description: '',
    iconPath: '',
  }
  const paragraphs = section.paragraphs
    .map((num) => textbook.paragraphs[String(num) as keyof typeof textbook.paragraphs])
    .filter(Boolean)

  const { completed, total } = getSectionProgress(section.paragraphs)
  const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--cream)' }}>
      <Header />

      {/* Section Hero */}
      <div
        className="px-4 pt-6 pb-8 relative overflow-hidden"
        style={{
          background: `linear-gradient(160deg, ${meta.color} 0%, ${meta.color}dd 100%)`,
        }}
      >
        {/* Decorative dots */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        <div className="max-w-4xl mx-auto relative">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold mb-4 px-3 py-1 rounded-full transition-all hover:opacity-100"
            style={{
              color: 'rgba(255,255,255,0.8)',
              background: 'rgba(255,255,255,0.1)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            {'Все разделы'}
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            {/* Section icon */}
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
              style={{
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(4px)',
                color: '#FFFFFF',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={meta.iconPath} />
              </svg>
            </div>

            <h1
              className="text-2xl font-extrabold mb-1 tracking-tight"
              style={{ color: '#FFFFFF' }}
            >
              {section.title}
            </h1>
            <p
              className="text-xs mb-5"
              style={{ color: 'rgba(255,255,255,0.7)' }}
            >
              {meta.description}
            </p>

            {/* Progress */}
            <div className="flex items-center gap-3">
              <div
                className="flex-1 h-2.5 rounded-full overflow-hidden"
                style={{ background: 'rgba(0,0,0,0.2)' }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'rgba(255,255,255,0.8)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
                />
              </div>
              <span
                className="text-xs font-extrabold whitespace-nowrap"
                style={{ color: '#FFFFFF' }}
              >
                {completed} / {total}
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Paragraph List */}
      <main className="flex-1 px-4 py-5 max-w-4xl mx-auto w-full">
        <ParagraphList paragraphs={paragraphs as { id: number; title: string; questions: string[] }[]} />

        {/* Section Quiz Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8"
        >
          <Link href={`/section/${id}/quiz`}>
            <button
              className="btn-navy w-full py-4 text-sm flex items-center justify-center gap-2"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14,2 14,8 20,8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              {'Обобщающий тест по разделу'}
            </button>
          </Link>
        </motion.div>
      </main>
    </div>
  )
}
