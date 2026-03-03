'use client'
import { use } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Header } from '@/components/ui/header'
import { ParagraphList } from '@/components/section/paragraph-list'
import { useAppStore } from '@/stores/app-store'
import textbook from '@/data/textbook.json'

const SECTION_META: Record<string, { emoji: string; color: string; description: string }> = {
  'ancient-greece': {
    emoji: '🏛️',
    color: '#4338CA',
    description: '§1 – §16 · Полисы, войны, олимпийские игры, Александр Македонский',
  },
  'ancient-rome': {
    emoji: '🦅',
    color: '#0E7490',
    description: '§17 – §29 · Республика, Пунические войны, Цезарь, Империя',
  },
  'germanic-slavic': {
    emoji: '🌲',
    color: '#1B6CA8',
    description: '§30 – §31 · Быт племён, обычаи, Великое переселение народов',
  },
}

export default function SectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const getSectionProgress = useAppStore((s) => s.getSectionProgress)

  const section = textbook.sections.find((s) => s.id === id)
  if (!section) notFound()

  const meta = SECTION_META[id] ?? { emoji: '📖', color: '#4338CA', description: '' }
  const paragraphs = section.paragraphs
    .map((num) => textbook.paragraphs[String(num) as keyof typeof textbook.paragraphs])
    .filter(Boolean)

  const { completed, total } = getSectionProgress(section.paragraphs)
  const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="min-h-dvh flex flex-col">
      <Header />

      {/* Шапка раздела */}
      <div
        style={{
          background: meta.color,
          borderBottom: '3px solid var(--border-color)',
        }}
        className="px-4 pt-6 pb-8"
      >
        <div className="max-w-4xl mx-auto">
          <Link
            href="/"
            style={{
              color: '#FFFFFF',
              fontFamily: 'var(--font-body)',
              fontWeight: 800,
              background: 'rgba(0,0,0,0.2)',
              border: '2px solid rgba(255,255,255,0.3)',
              borderRadius: '8px',
              padding: '3px 10px',
              fontSize: '12px',
            }}
            className="inline-block mb-3 hover:opacity-90 transition-opacity"
          >
            ← Все разделы
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <div
              style={{
                fontSize: 36,
                display: 'inline-block',
                background: 'var(--yellow)',
                border: '2.5px solid var(--border-color)',
                borderRadius: '12px',
                padding: '4px 10px',
                boxShadow: '3px 3px 0px var(--shadow-color)',
                marginBottom: 8,
                lineHeight: 1.2,
              }}
            >
              {meta.emoji}
            </div>
            <h1
              style={{ fontFamily: 'var(--font-heading)', color: '#FFFFFF' }}
              className="text-2xl font-extrabold mb-1"
            >
              {section.title}
            </h1>
            <p
              style={{ color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-body)' }}
              className="text-xs mb-4 font-semibold"
            >
              {meta.description}
            </p>

            {/* Прогресс */}
            <div className="flex items-center gap-3">
              <div
                className="flex-1 h-3 rounded-full overflow-hidden"
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1.5px solid rgba(0,0,0,0.2)',
                }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'var(--yellow)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
                />
              </div>
              <span
                style={{
                  color: 'var(--ink)',
                  fontFamily: 'var(--font-body)',
                  background: 'rgba(255,255,255,0.9)',
                  borderRadius: '8px',
                  padding: '2px 8px',
                  fontSize: '12px',
                  fontWeight: 800,
                }}
              >
                {completed} / {total} §
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Список параграфов */}
      <main className="flex-1 px-4 py-5 max-w-4xl mx-auto w-full">
        <ParagraphList paragraphs={paragraphs as { id: number; title: string; questions: string[] }[]} />

        {/* Кнопка обобщающего теста */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 pt-5"
          style={{ borderTop: '2.5px solid var(--border-color)' }}
        >
          <Link href={`/section/${id}/quiz`}>
            <button className="btn-terracotta w-full py-3.5 text-sm">
              📝 Обобщающий тест по разделу
            </button>
          </Link>
        </motion.div>
      </main>
    </div>
  )
}
