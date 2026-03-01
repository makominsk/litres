'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface SectionCardProps {
  id: string
  title: string
  subtitle: string
  icon: string
  emoji: string
  paragraphCount: number
  completedCount: number
  delay?: number
}

function SectionIcon({ icon }: { icon: string }) {
  if (icon === 'greece') {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 21h18" />
        <path d="M5 21V7l7-4 7 4v14" />
        <path d="M9 21v-8h6v8" />
        <path d="M3 7h18" />
      </svg>
    )
  }
  if (icon === 'rome') {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2L2 7h20L12 2z" />
        <path d="M4 7v10h16V7" />
        <path d="M4 17h16v4H4z" />
        <path d="M8 7v10" />
        <path d="M12 7v10" />
        <path d="M16 7v10" />
      </svg>
    )
  }
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 14c.3-2 .6-3.3.6-5A6.6 6.6 0 0011 2.6a6.6 6.6 0 00-6.6 6.4c0 1.7.3 3 .6 5" />
      <path d="M4 22c1.5-2 3-3.5 3-6h10c0 2.5 1.5 4 3 6" />
      <path d="M7 16h10" />
    </svg>
  )
}

export function SectionCard({
  id, title, subtitle, icon, emoji,
  paragraphCount, completedCount, delay = 0,
}: SectionCardProps) {
  const progress = paragraphCount > 0 ? (completedCount / paragraphCount) * 100 : 0
  const isDone = completedCount === paragraphCount && paragraphCount > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
    >
      <Link href={`/section/${id}`} className="block group">
        <div
          className="glass-card p-5 flex items-center gap-5 transition-all"
          style={{ cursor: 'pointer' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.borderColor = 'var(--primary-200, #C7D2FE)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = ''
            e.currentTarget.style.borderColor = ''
          }}
        >
          {/* Icon */}
          <div
            className="shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
            style={{
              background: 'var(--primary-50)',
              color: 'var(--primary-600)',
            }}
          >
            <SectionIcon icon={icon} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h2
                className="text-base font-extrabold leading-tight truncate"
                style={{ color: 'var(--gray-900)' }}
              >
                {title}
              </h2>
              {isDone && (
                <span
                  className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ background: 'var(--success-100)', color: 'var(--success-500)' }}
                >
                  {'Пройден'}
                </span>
              )}
            </div>
            <p
              className="text-xs mb-3 leading-snug"
              style={{ color: 'var(--gray-500)' }}
            >
              {subtitle}
            </p>

            {/* Progress bar */}
            <div className="flex items-center gap-3">
              <div
                className="flex-1 h-1.5 rounded-full overflow-hidden"
                style={{ background: 'var(--gray-100)' }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: isDone ? 'var(--success-500)' : 'var(--primary-500)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.6, delay: delay + 0.2, ease: 'easeOut' }}
                />
              </div>
              <span
                className="text-[11px] font-bold shrink-0"
                style={{ color: 'var(--gray-500)' }}
              >
                {completedCount}/{paragraphCount}
              </span>
            </div>
          </div>

          {/* Arrow */}
          <svg
            width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="var(--gray-300)"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className="shrink-0 group-hover:translate-x-1 transition-transform"
            aria-hidden="true"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </div>
      </Link>
    </motion.div>
  )
}
