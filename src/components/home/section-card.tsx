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

          <div className="relative p-4 pb-4">
            {/* Бейдж с количеством параграфов */}
            <div className="flex justify-between items-start mb-3">
              <div className="text-3xl filter drop-shadow-sm">{emoji}</div>
              <div
                style={{
                  background: 'rgba(253,246,236,0.2)',
                  color: '#FDF6EC',
                  fontFamily: 'var(--font-body)',
                }}
                className="text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
              >
                {paragraphCount} §
              </div>
            </div>

            {/* Заголовок */}
            <h2
              style={{ fontFamily: 'var(--font-heading)', color: '#FDF6EC' }}
              className="text-base font-bold leading-tight mb-0.5"
            >
              {title}
            </h2>
            <p
              style={{ color: 'rgba(253,246,236,0.7)', fontFamily: 'var(--font-body)' }}
              className="text-xs mb-4 leading-snug"
            >
              {subtitle}
            </p>

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
                  {completedCount}/{paragraphCount}
                </span>
              </div>
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ background: 'rgba(61,43,31,0.25)' }}
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
        </div>
      </Link>
    </motion.div>
  )
}
