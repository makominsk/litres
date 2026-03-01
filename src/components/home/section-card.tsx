'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface SectionCardProps {
  id: string
  title: string
  subtitle: string
  icon: string
  paragraphCount: number
  completedCount: number
  colorFrom: string
  colorTo: string
  accentColor: string
  delay?: number
}

function SectionIcon({ icon }: { icon: string }) {
  if (icon === 'greece') {
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 21h18" />
        <path d="M5 21V7l7-4 7 4v14" />
        <path d="M9 21v-8h6v8" />
        <path d="M3 7h18" />
      </svg>
    )
  }
  if (icon === 'rome') {
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 14c.3-2 .6-3.3.6-5A6.6 6.6 0 0011 2.6a6.6 6.6 0 00-6.6 6.4c0 1.7.3 3 .6 5" />
      <path d="M4 22c1.5-2 3-3.5 3-6h10c0 2.5 1.5 4 3 6" />
      <path d="M7 16h10" />
    </svg>
  )
}

export function SectionCard({
  id, title, subtitle, icon,
  paragraphCount, completedCount,
  colorFrom, colorTo, accentColor, delay = 0,
}: SectionCardProps) {
  const progress = paragraphCount > 0 ? (completedCount / paragraphCount) * 100 : 0
  const isDone = completedCount === paragraphCount && paragraphCount > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
    >
      <Link href={`/section/${id}`} className="block">
        <div
          className="rounded-2xl overflow-hidden relative group cursor-pointer"
          style={{
            background: `linear-gradient(160deg, ${colorFrom} 0%, ${colorTo} 100%)`,
            boxShadow: `0 8px 32px ${colorFrom}33, 0 2px 4px rgba(0,0,0,0.06)`,
          }}
        >
          {/* Decorative pattern */}
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: `radial-gradient(circle at 30% 70%, white 1px, transparent 1px),
                radial-gradient(circle at 70% 30%, white 1px, transparent 1px)`,
              backgroundSize: '32px 32px',
            }}
          />

          <div className="relative p-5 pb-5">
            {/* Header row */}
            <div className="flex justify-between items-start mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  color: '#FFFFFF',
                  backdropFilter: 'blur(4px)',
                }}
              >
                <SectionIcon icon={icon} />
              </div>
              {isDone ? (
                <div
                  className="px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1"
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    color: '#FFFFFF',
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                  {'Пройден'}
                </div>
              ) : (
                <div
                  className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    color: 'rgba(255,255,255,0.9)',
                  }}
                >
                  {paragraphCount} {'параграфов'}
                </div>
              )}
            </div>

            {/* Title */}
            <h2
              className="text-lg font-extrabold leading-tight mb-0.5"
              style={{ color: '#FFFFFF' }}
            >
              {title}
            </h2>
            <p
              className="text-xs mb-5 leading-snug"
              style={{ color: 'rgba(255,255,255,0.7)' }}
            >
              {subtitle}
            </p>

            {/* Progress */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span
                  className="text-xs font-semibold"
                  style={{ color: 'rgba(255,255,255,0.7)' }}
                >
                  {'Прогресс'}
                </span>
                <span
                  className="text-xs font-extrabold"
                  style={{ color: '#FFFFFF' }}
                >
                  {completedCount}/{paragraphCount}
                </span>
              </div>
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ background: 'rgba(0,0,0,0.2)' }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: accentColor }}
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
