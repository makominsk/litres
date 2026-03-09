'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Header } from '@/components/ui/header'
import { useAppStore } from '@/stores/app-store'
import { ACHIEVEMENTS } from '@/lib/achievements'

export default function AchievementsPage() {
  const achievements = useAppStore((s) => s.achievements)
  const unlocked = new Set(achievements)

  return (
    <div className="min-h-dvh flex flex-col">
      <Header />
      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
        <div className="text-center mb-6">
          <div style={{ fontSize: 48 }}>🏅</div>
          <h1
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink)', fontSize: 24, fontWeight: 900 }}
            className="mt-2"
          >
            Достижения
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-muted)', fontSize: 13, fontWeight: 700, marginTop: 4 }}>
            {achievements.length} из {ACHIEVEMENTS.length} открыто
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {ACHIEVEMENTS.map((a, i) => {
            const isUnlocked = unlocked.has(a.id)
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  background: isUnlocked ? 'var(--card-bg)' : 'var(--bg-dark)',
                  border: '2.5px solid var(--border-color)',
                  borderRadius: '14px',
                  padding: '16px 12px',
                  textAlign: 'center',
                  boxShadow: isUnlocked ? 'var(--shadow-sm)' : 'none',
                  opacity: isUnlocked ? 1 : 0.5,
                }}
              >
                <div style={{ fontSize: 32, filter: isUnlocked ? 'none' : 'grayscale(1)' }}>
                  {a.emoji}
                </div>
                <div style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '13px',
                  fontWeight: 800,
                  color: 'var(--ink)',
                  marginTop: 6,
                }}>
                  {a.name}
                </div>
                <div style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--ink-muted)',
                  marginTop: 2,
                  lineHeight: 1.3,
                }}>
                  {a.description}
                </div>
              </motion.div>
            )
          })}
        </div>

        <div className="mt-6">
          <Link href="/">
            <button className="btn-brutal-secondary w-full py-3 text-sm">
              ← На главную
            </button>
          </Link>
        </div>
      </main>
    </div>
  )
}
