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
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <Link href={`/section/${id}`} className="block">
        <div
          className="rounded-2xl overflow-hidden relative group cursor-pointer"
          style={{
            background: `linear-gradient(135deg, ${colorFrom} 0%, ${colorTo} 100%)`,
            boxShadow: '0 4px 20px rgba(61,43,31,0.15), 0 1px 3px rgba(61,43,31,0.1)',
            border: '1.5px solid rgba(255,255,255,0.2)',
          }}
        >
          {/* Декоративный паттерн */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 80%, white 1px, transparent 1px),
                radial-gradient(circle at 80% 20%, white 1px, transparent 1px),
                radial-gradient(circle at 50% 50%, white 0.5px, transparent 0.5px)`,
              backgroundSize: '40px 40px, 40px 40px, 20px 20px',
            }}
          />

          <div className="relative p-5 pb-4">
            {/* Эмодзи + заголовок */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-4xl mb-2 filter drop-shadow-sm">{emoji}</div>
                <h2
                  style={{ fontFamily: 'var(--font-heading)', color: '#FDF6EC' }}
                  className="text-lg font-bold leading-tight"
                >
                  {title}
                </h2>
                <p
                  style={{ color: 'rgba(253,246,236,0.75)', fontFamily: 'var(--font-body)' }}
                  className="text-xs mt-0.5"
                >
                  {subtitle}
                </p>
              </div>
              <div
                style={{
                  background: 'rgba(253,246,236,0.2)',
                  color: '#FDF6EC',
                  fontFamily: 'var(--font-body)',
                }}
                className="text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap"
              >
                {paragraphCount} §
              </div>
            </div>

            {/* Прогресс */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span
                  style={{ color: 'rgba(253,246,236,0.8)', fontFamily: 'var(--font-body)' }}
                  className="text-xs"
                >
                  Пройдено
                </span>
                <span
                  style={{ color: '#FDF6EC', fontFamily: 'var(--font-body)' }}
                  className="text-xs font-bold"
                >
                  {completedCount} / {paragraphCount}
                </span>
              </div>
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ background: 'rgba(61,43,31,0.2)' }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'rgba(253,246,236,0.7)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, delay: delay + 0.3, ease: 'easeOut' }}
                />
              </div>
            </div>
          </div>

          {/* Стрелка */}
          <div
            className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
            style={{ color: '#FDF6EC' }}
          >
            →
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
