'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAppStore } from '@/stores/app-store'

interface Paragraph {
  id: number
  title: string
  questions: string[]
}

interface ParagraphListProps {
  paragraphs: Paragraph[]
}

function getMedalEmoji(correct: number, total: number) {
  if (total === 0) return null
  const pct = correct / total
  if (pct >= 0.9) return '🥇'
  if (pct >= 0.6) return '🥈'
  return '🥉'
}

export function ParagraphList({ paragraphs }: ParagraphListProps) {
  const getParaProgress = useAppStore((s) => s.getParaProgress)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {paragraphs.map((para, i) => {
        const { answered, correct } = getParaProgress(para.id)
        const medal = getMedalEmoji(correct, answered)
        const isDone = answered > 0

        return (
          <motion.div
            key={para.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: i * 0.06 }}
            className="flex items-stretch gap-2"
          >
            <Link href={`/paragraph/${para.id}`} className="flex-1">
              <div
                className="p-4 flex items-center gap-3 group cursor-pointer h-full"
                style={{
                  background: 'var(--card-bg)',
                  border: '2.5px solid var(--border-color)',
                  borderRadius: '1rem',
                  boxShadow: isDone ? '4px 4px 0px #065F46' : 'var(--shadow-sm)',
                  transition: 'transform 0.1s, box-shadow 0.1s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translate(-2px, -2px)'
                  e.currentTarget.style.boxShadow = isDone ? '6px 6px 0px #065F46' : 'var(--shadow-md)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = ''
                  e.currentTarget.style.boxShadow = isDone ? '4px 4px 0px #065F46' : 'var(--shadow-sm)'
                }}
              >
                {/* Номер параграфа */}
                <div
                  className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-extrabold"
                  style={{
                    background: isDone ? '#059669' : 'var(--indigo)',
                    color: '#FFFFFF',
                    fontFamily: 'var(--font-heading)',
                    border: '2px solid var(--border-color)',
                    boxShadow: '2px 2px 0px var(--shadow-color)',
                  }}
                >
                  {medal ?? `§${para.id}`}
                </div>

                {/* Заголовок и прогресс */}
                <div className="flex-1 min-w-0">
                  <p
                    style={{ fontFamily: 'var(--font-body)', color: 'var(--ink)' }}
                    className="text-sm font-bold leading-snug truncate"
                  >
                    {para.title}
                  </p>
                  <p
                    style={{ color: 'var(--ink-muted)', fontFamily: 'var(--font-body)' }}
                    className="text-xs mt-0.5 font-semibold"
                  >
                    {answered > 0
                      ? `${answered} вопросов · ${correct} верно`
                      : `${para.questions.length} вопросов`}
                  </p>
                </div>

                {/* Стрелка */}
                <span
                  style={{
                    color: 'var(--ink)',
                    fontWeight: 900,
                    fontSize: '18px',
                  }}
                  className="opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
                >
                  →
                </span>
              </div>
            </Link>

          </motion.div>
        )
      })}
    </div>
  )
}
