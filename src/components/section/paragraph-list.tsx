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
          >
            <Link href={`/paragraph/${para.id}`}>
              <div
                className="parchment-card p-4 flex items-center gap-3 group cursor-pointer"
                style={{
                  borderColor: isDone ? 'var(--olive)' : undefined,
                  borderWidth: isDone ? '1.5px' : undefined,
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateX(4px)'
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(61,43,31,0.12)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = ''
                  e.currentTarget.style.boxShadow = ''
                }}
              >
                {/* Номер параграфа */}
                <div
                  className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{
                    background: isDone ? 'var(--olive)' : 'var(--parchment-deep)',
                    color: isDone ? '#FDF6EC' : 'var(--ink-muted)',
                    fontFamily: 'var(--font-heading)',
                  }}
                >
                  {medal ?? `§${para.id}`}
                </div>

                {/* Заголовок и прогресс */}
                <div className="flex-1 min-w-0">
                  <p
                    style={{ fontFamily: 'var(--font-body)', color: 'var(--ink)' }}
                    className="text-sm font-semibold leading-snug truncate"
                  >
                    {para.title}
                  </p>
                  <p
                    style={{ color: 'var(--ink-muted)', fontFamily: 'var(--font-body)' }}
                    className="text-xs mt-0.5"
                  >
                    {answered > 0
                      ? `${answered} вопросов · ${correct} верно`
                      : `${para.questions.length} вопросов`}
                  </p>
                </div>

                {/* Стрелка */}
                <span
                  style={{ color: 'var(--terracotta)' }}
                  className="text-lg opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
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
