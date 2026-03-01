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
    emoji: '\u{1F3DB}',
  },
  {
    id: 'ancient-rome',
    title: 'Древний Рим',
    subtitle: 'Республика, легионы, Колизей',
    icon: 'rome',
    emoji: '\u{1F3DF}',
  },
  {
    id: 'germanic-slavic',
    title: 'Германцы и Славяне',
    subtitle: 'Племена, обычаи, переселение',
    icon: 'slavic',
    emoji: '\u{1F6E1}',
  },
]

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

  const totalCompleted = SECTIONS.reduce((acc, section) => {
    const paraIds = getSectionParaIds(section.id)
    return acc + getSectionProgress(paraIds).completed
  }, 0)
  const totalParagraphs = SECTIONS.reduce((acc, section) => {
    return acc + getSectionParaIds(section.id).length
  }, 0)

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--gray-50)' }}>
      <Header />

      {/* Nickname Modal */}
      <AnimatePresence>
        {showNickname && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(17,24,39,0.6)', backdropFilter: 'blur(8px)' }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="glass-card w-full max-w-sm p-8 text-center"
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{
                  background: 'var(--primary-50)',
                  color: 'var(--primary-600)',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12,6 12,12 16,14"/>
                </svg>
              </div>
              <h2
                className="text-xl font-extrabold mb-1"
                style={{ color: 'var(--gray-900)' }}
              >
                {'Добро пожаловать!'}
              </h2>
              <p
                className="text-sm mb-6"
                style={{ color: 'var(--gray-500)' }}
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
                    background: 'var(--gray-50)',
                    border: '2px solid var(--gray-200)',
                    color: 'var(--gray-900)',
                    fontWeight: 600,
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--primary-500)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--gray-200)')}
                />
                {error && (
                  <p className="text-xs font-semibold" style={{ color: 'var(--error-500)' }}>
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

      <main className="flex-1 px-4 py-8 max-w-3xl mx-auto w-full">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          {student && totalCompleted > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-3"
              style={{
                background: 'var(--primary-50)',
                border: '1px solid var(--primary-100)',
              }}
            >
              <span className="text-xs font-bold" style={{ color: 'var(--primary-600)' }}>
                {totalCompleted}/{totalParagraphs} {'пройдено'}
              </span>
            </motion.div>
          )}
          <h1
            className="text-3xl sm:text-4xl font-extrabold leading-tight tracking-tight text-balance"
            style={{ color: 'var(--gray-900)' }}
          >
            {student ? `Привет, ${student.nickname}!` : 'История Древнего мира'}
          </h1>
          <p
            className="text-base mt-2 max-w-lg leading-relaxed"
            style={{ color: 'var(--gray-500)' }}
          >
            {'Выбери раздел и проверь свои знания. Отвечай голосом или текстом!'}
          </p>
        </motion.div>

        {/* Section Cards */}
        <div className="flex flex-col gap-4">
          {SECTIONS.map((section, i) => {
            const paraIds = getSectionParaIds(section.id)
            const { completed } = getSectionProgress(paraIds)
            return (
              <SectionCard
                key={section.id}
                {...section}
                paragraphCount={paraIds.length}
                completedCount={completed}
                delay={i * 0.08}
              />
            )
          })}
        </div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-10 grid grid-cols-3 gap-3"
        >
          {[
            { label: 'Голосовой ввод', desc: 'Отвечай голосом', icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                <path d="M19 10v2a7 7 0 01-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
              </svg>
            )},
            { label: 'Достижения', desc: 'Получай медали', icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            )},
            { label: 'Карты', desc: 'События на карте', icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            )},
          ].map((feat) => (
            <div key={feat.label} className="glass-card p-4 text-center">
              <div
                className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center"
                style={{ background: 'var(--primary-50)', color: 'var(--primary-600)' }}
              >
                {feat.icon}
              </div>
              <p className="text-xs font-bold" style={{ color: 'var(--gray-900)' }}>{feat.label}</p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--gray-500)' }}>{feat.desc}</p>
            </div>
          ))}
        </motion.div>
      </main>
    </div>
  )
}
