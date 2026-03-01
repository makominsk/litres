'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Header } from '@/components/ui/header'
import { SectionCard } from '@/components/home/section-card'
import { useAppStore } from '@/stores/app-store'
import textbook from '@/data/textbook.json'

const SECTIONS = [
  {
    id: 'ancient-greece',
    title: 'Древняя Греция',
    subtitle: 'Демократия, философия, Олимп',
    icon: 'greece',
    colorFrom: '#2563EB',
    colorTo: '#1D4ED8',
    accentColor: '#60A5FA',
  },
  {
    id: 'ancient-rome',
    title: 'Древний Рим',
    subtitle: 'Республика, легионы, Колизей',
    icon: 'rome',
    colorFrom: '#DC2626',
    colorTo: '#B91C1C',
    accentColor: '#FCA5A5',
  },
  {
    id: 'germanic-slavic',
    title: 'Германцы и Славяне',
    subtitle: 'Племена, обычаи, переселение',
    icon: 'slavic',
    colorFrom: '#059669',
    colorTo: '#047857',
    accentColor: '#6EE7B7',
  },
]

function SectionIcon({ icon, size = 32 }: { icon: string; size?: number }) {
  if (icon === 'greece') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 21h18" />
        <path d="M5 21V7l7-4 7 4v14" />
        <path d="M9 21v-8h6v8" />
        <path d="M3 7h18" />
      </svg>
    )
  }
  if (icon === 'rome') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 14c.3-2 .6-3.3.6-5A6.6 6.6 0 0011 2.6a6.6 6.6 0 00-6.6 6.4c0 1.7.3 3 .6 5" />
      <path d="M4 22c1.5-2 3-3.5 3-6h10c0 2.5 1.5 4 3 6" />
      <path d="M7 16h10" />
    </svg>
  )
}

export default function HomePage() {
  const student = useAppStore((s) => s.student)
  const setStudent = useAppStore((s) => s.setStudent)
  const getSectionProgress = useAppStore((s) => s.getSectionProgress)
  const [showNickname, setShowNickname] = useState(false)
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!student) setShowNickname(true)
  }, [student])

  async function handleNicknameSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (nickname.trim().length < 2) {
      setError('Имя должно быть не короче 2 символов')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: nickname.trim() }),
      })
      if (!res.ok) throw new Error('Ошибка сервера')
      const data = await res.json()
      setStudent({ id: data.id, nickname: data.nickname })
      setShowNickname(false)
    } catch {
      setError('Не удалось войти. Попробуй ещё раз.')
    } finally {
      setLoading(false)
    }
  }

  const getSectionParaIds = (sectionId: string) =>
    textbook.sections.find((s) => s.id === sectionId)?.paragraphs ?? []

  // Calculate total progress
  const totalCompleted = SECTIONS.reduce((acc, section) => {
    const paraIds = getSectionParaIds(section.id)
    return acc + getSectionProgress(paraIds).completed
  }, 0)
  const totalParagraphs = SECTIONS.reduce((acc, section) => {
    return acc + getSectionParaIds(section.id).length
  }, 0)

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--cream)' }}>
      <Header />

      {/* Nickname Modal */}
      <AnimatePresence>
        {showNickname && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(27,42,74,0.8)', backdropFilter: 'blur(8px)' }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="glass-card w-full max-w-sm p-8 text-center"
              style={{ background: '#FFFFFF' }}
            >
              {/* Clock icon */}
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{
                  background: 'linear-gradient(135deg, var(--navy) 0%, var(--navy-light) 100%)',
                  boxShadow: '0 8px 24px rgba(27,42,74,0.2)',
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFC857" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12,6 12,12 16,14"/>
                </svg>
              </div>
              <h2
                className="text-xl font-extrabold mb-1"
                style={{ color: 'var(--navy)' }}
              >
                {'Добро пожаловать!'}
              </h2>
              <p
                className="text-sm mb-6"
                style={{ color: 'var(--ink-muted)' }}
              >
                Как тебя зовут? Я запомню твой прогресс.
              </p>

              <form onSubmit={handleNicknameSubmit} className="flex flex-col gap-3">
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Введи своё имя..."
                  maxLength={30}
                  autoFocus
                  className="w-full px-4 py-3 text-base rounded-xl outline-none transition-all"
                  style={{
                    background: 'var(--cream)',
                    border: '2px solid var(--cream-deep)',
                    color: 'var(--ink)',
                    fontWeight: 600,
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--amber)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--cream-deep)')}
                />
                {error && (
                  <p className="text-xs font-semibold" style={{ color: 'var(--coral)' }}>
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3.5 text-sm"
                  style={{ opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? 'Входим...' : 'Начать путешествие'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 px-4 py-6 max-w-4xl mx-auto w-full">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          {student && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-3"
              style={{
                background: 'rgba(245,166,35,0.1)',
                border: '1px solid rgba(245,166,35,0.2)',
              }}
            >
              <span className="text-xs font-bold" style={{ color: 'var(--amber-dark)' }}>
                {'Привет, ' + student.nickname + '!'}
              </span>
              {totalCompleted > 0 && (
                <span className="text-xs font-bold" style={{ color: 'var(--ink-muted)' }}>
                  {' \u00b7 '}{totalCompleted}/{totalParagraphs} {'пройдено'}
                </span>
              )}
            </motion.div>
          )}
          <h1
            className="text-3xl sm:text-4xl font-extrabold leading-tight tracking-tight"
            style={{ color: 'var(--navy)' }}
          >
            {'История Древнего мира'}
          </h1>
          <p
            className="text-sm mt-2 max-w-md mx-auto leading-relaxed"
            style={{ color: 'var(--ink-muted)' }}
          >
            {'Отправляйся в путешествие по эпохам. Выбери раздел и проверь свои знания!'}
          </p>
        </motion.div>

        {/* Section Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {SECTIONS.map((section, i) => {
            const paraIds = getSectionParaIds(section.id)
            const { completed } = getSectionProgress(paraIds)
            return (
              <SectionCard
                key={section.id}
                {...section}
                paragraphCount={paraIds.length}
                completedCount={completed}
                delay={i * 0.1}
              />
            )
          })}
        </div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-10 grid grid-cols-3 gap-3"
        >
          {[
            { icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 2a3 3 0 003-3v1a10 10 0 01-6 0V2a3 3 0 003-3z" />
                <path d="M19 10v2a7 7 0 01-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="22" />
              </svg>
            ), label: 'Голос', desc: 'Отвечай голосом' },
            { icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="8" r="6" />
                <path d="M15.5 14h.5a6 6 0 016 6v1H2v-1a6 6 0 016-6h.5" />
              </svg>
            ), label: 'Медали', desc: 'За достижения' },
            { icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            ), label: 'Карты', desc: 'Событий на карте' },
          ].map((feat) => (
            <div
              key={feat.label}
              className="glass-card p-3 text-center"
            >
              <div
                className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center"
                style={{
                  background: 'rgba(27,42,74,0.06)',
                  color: 'var(--navy)',
                }}
              >
                {feat.icon}
              </div>
              <p className="text-xs font-bold" style={{ color: 'var(--navy)' }}>{feat.label}</p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--ink-muted)' }}>{feat.desc}</p>
            </div>
          ))}
        </motion.div>
      </main>
    </div>
  )
}
