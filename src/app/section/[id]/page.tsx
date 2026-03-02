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
    color: '#5E35D6',
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

  const meta = SECTION_META[id] ?? { emoji: '📖', color: '#5E35D6', description: '' }
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
          background: `linear-gradient(135deg, ${meta.color}dd 0%, ${meta.color}aa 100%)`,
          borderBottom: '2px solid rgba(255,255,255,0.15)',
        }}
        className="px-4 pt-6 pb-8"
      >
        <div className="max-w-4xl mx-auto">
          <Link
            href="/"
            style={{ color: 'rgba(253,246,236,0.7)', fontFamily: 'var(--font-body)' }}
            className="text-xs mb-3 inline-block hover:opacity-100 transition-opacity"
          >
            ← Все разделы
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <div className="text-4xl mb-2">{meta.emoji}</div>
            <h1
              style={{ fontFamily: 'var(--font-heading)', color: '#FDF6EC' }}
              className="text-2xl font-bold mb-1"
            >
              {section.title}
            </h1>
            <p
              style={{ color: 'rgba(253,246,236,0.75)', fontFamily: 'var(--font-body)' }}
              className="text-xs mb-4"
            >
              {meta.description}
            </p>

            {/* Прогресс */}
            <div className="flex items-center gap-3">
              <div
                className="flex-1 h-2.5 rounded-full overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.2)' }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'rgba(253,246,236,0.75)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
                />
              </div>
              <span
                style={{ color: '#FDF6EC', fontFamily: 'var(--font-body)' }}
                className="text-xs font-bold whitespace-nowrap"
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
          style={{ borderTop: '1px solid var(--parchment-deep)' }}
        >
          <Link href={`/section/${id}/quiz`}>
            <button
              className="btn-terracotta w-full py-3.5 text-sm font-bold"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              📝 Обобщающий тест по разделу
            </button>
          </Link>
        </motion.div>
      </main>
    </div>
  )
}
