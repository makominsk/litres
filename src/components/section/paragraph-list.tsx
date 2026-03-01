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

function getStatusInfo(correct: number, answered: number) {
  if (answered === 0) return { status: 'new' as const, color: 'var(--ink-muted)', bg: 'var(--cream-dark)' }
  const pct = correct / answered
  if (pct >= 0.9) return { status: 'gold' as const, color: '#D97706', bg: 'rgba(245,166,35,0.12)' }
  if (pct >= 0.6) return { status: 'silver' as const, color: '#6B7280', bg: 'rgba(107,114,128,0.1)' }
  return { status: 'bronze' as const, color: '#B45309', bg: 'rgba(180,83,9,0.1)' }
}

export function ParagraphList({ paragraphs }: ParagraphListProps) {
  const getParaProgress = useAppStore((s) => s.getParaProgress)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {paragraphs.map((para, i) => {
        const { answered, correct } = getParaProgress(para.id)
        const { status, color, bg } = getStatusInfo(correct, answered)
        const isDone = answered > 0

        return (
          <motion.div
            key={para.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.04 }}
          >
            <Link href={`/paragraph/${para.id}`}>
              <div
                className="glass-card p-4 flex items-center gap-3 group cursor-pointer transition-all"
                style={{
                  borderColor: isDone ? `${color}44` : undefined,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(27,42,74,0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = ''
                  e.currentTarget.style.boxShadow = ''
                }}
              >
                {/* Number badge */}
                <div
                  className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-extrabold"
                  style={{
                    background: isDone ? bg : 'var(--cream)',
                    color: isDone ? color : 'var(--ink-muted)',
                    border: isDone ? `1.5px solid ${color}33` : '1.5px solid var(--cream-deep)',
                  }}
                >
                  {status === 'gold' ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={color} aria-hidden="true">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  ) : status === 'silver' || status === 'bronze' ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20,6 9,17 4,12" />
                    </svg>
                  ) : (
                    <span>{para.id}</span>
                  )}
                </div>

                {/* Title and progress */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-bold leading-snug truncate"
                    style={{ color: 'var(--ink)' }}
                  >
                    {para.title}
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: 'var(--ink-muted)' }}
                  >
                    {answered > 0
                      ? `${correct} из ${answered} верно`
                      : `${para.questions.length} вопросов`}
                  </p>
                </div>

                {/* Arrow */}
                <svg
                  width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="var(--ink-muted)"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className="opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
                  aria-hidden="true"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          </motion.div>
        )
      })}
    </div>
  )
}
