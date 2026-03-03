'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface SectionCardProps {
  id: string
  title: string
  subtitle: string
  emoji: string
  paragraphCount: number
  completedCount: number
  colorFrom: string
  colorTo: string
  delay?: number
}

export function SectionCard({
  id, title, subtitle, emoji,
  paragraphCount, completedCount,
  colorFrom, colorTo, delay = 0,
}: SectionCardProps) {
  const progress = paragraphCount > 0 ? (completedCount / paragraphCount) * 100 : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      whileHover={{ y: -4, transition: { duration: 0.15 } }}
    >
      <Link href={`/section/${id}`} className="block">
        <div
          className="rounded-2xl overflow-hidden relative group cursor-pointer"
          style={{
            background: `linear-gradient(135deg, ${colorFrom} 0%, ${colorTo} 100%)`,
            border: '2.5px solid var(--border-color)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div className="relative p-4 pb-4">
            {/* Бейдж с количеством параграфов */}
            <div className="flex justify-between items-start mb-3">
              <div
                style={{
                  fontSize: 28,
                  background: 'var(--yellow)',
                  border: '2px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '2px 8px',
                  boxShadow: '2px 2px 0px var(--shadow-color)',
                  lineHeight: 1.3,
                }}
              >
                {emoji}
              </div>
              <div
                style={{
                  background: 'var(--yellow)',
                  color: 'var(--ink)',
                  fontFamily: 'var(--font-body)',
                  border: '2px solid var(--border-color)',
                  borderRadius: '20px',
                  boxShadow: '2px 2px 0px var(--shadow-color)',
                }}
                className="text-xs font-extrabold px-3 py-0.5 whitespace-nowrap"
              >
                {paragraphCount} §
              </div>
            </div>

            {/* Заголовок */}
            <h2
              style={{ fontFamily: 'var(--font-heading)', color: '#FFFFFF' }}
              className="text-base font-bold leading-tight mb-0.5"
            >
              {title}
            </h2>
            <p
              style={{ color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-body)' }}
              className="text-xs mb-4 leading-snug"
            >
              {subtitle}
            </p>

            {/* Прогресс */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span
                  style={{ color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-body)' }}
                  className="text-xs font-bold"
                >
                  Пройдено
                </span>
                <span
                  style={{
                    color: 'var(--ink)',
                    fontFamily: 'var(--font-body)',
                    background: 'rgba(255,255,255,0.9)',
                    borderRadius: '6px',
                    padding: '1px 6px',
                    fontSize: '11px',
                    fontWeight: 800,
                  }}
                >
                  {completedCount}/{paragraphCount}
                </span>
              </div>
              <div
                className="h-2.5 rounded-full overflow-hidden"
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1.5px solid rgba(0,0,0,0.2)',
                }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'var(--yellow)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, delay: delay + 0.3, ease: 'easeOut' }}
                />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
