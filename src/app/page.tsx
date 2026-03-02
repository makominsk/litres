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
    emoji: '🏛️',
    colorFrom: '#5E35D6',
    colorTo: '#4527A0',
  },
  {
    id: 'ancient-rome',
    title: 'Древний Рим',
    subtitle: 'Республика, легионы, Колизей',
    emoji: '🦅',
    colorFrom: '#0E7490',
    colorTo: '#155E75',
  },
  {
    id: 'germanic-slavic',
    title: 'Германцы и Славяне',
    subtitle: 'Племена, обычаи, переселение',
    emoji: '🌲',
    colorFrom: '#1B6CA8',
    colorTo: '#0D4F7C',
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

  return (
    <div className="min-h-dvh flex flex-col">
      <Header />

      {/* Модалка никнейма */}
      <AnimatePresence>
        {showNickname && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(26,26,46,0.75)', backdropFilter: 'blur(4px)' }}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="parchment-card w-full max-w-sm p-6 text-center"
            >
              <div className="text-5xl mb-3">📜</div>
              <h2
                style={{ fontFamily: 'var(--font-heading)' }}
                className="text-xl font-bold mb-1"
              >
                Привет, путешественник!
              </h2>
              <p
                style={{ color: 'var(--ink-muted)', fontFamily: 'var(--font-body)' }}
                className="text-sm mb-5"
              >
                Как тебя зовут? Я запомню твой прогресс.
              </p>

              <form onSubmit={handleNicknameSubmit} className="space-y-3">
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Введи своё имя..."
                  maxLength={30}
                  autoFocus
                  style={{
                    background: 'var(--parchment-dark)',
                    border: '1.5px solid var(--parchment-deep)',
                    borderRadius: '10px',
                    fontFamily: 'var(--font-body)',
                    color: 'var(--ink)',
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: '16px',
                    outline: 'none',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--terracotta)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--parchment-deep)')}
                />
                {error && (
                  <p style={{ color: 'var(--terracotta)', fontFamily: 'var(--font-body)' }} className="text-xs">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-terracotta w-full py-3 text-sm"
                  style={{ opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? 'Входим...' : 'Начать путешествие →'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 px-4 py-6 max-w-4xl mx-auto w-full">
        {/* Заголовок */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          {student && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              style={{ color: 'var(--ink-muted)', fontFamily: 'var(--font-body)' }}
              className="text-sm mb-1"
            >
              Привет, {student.nickname}! 👋
            </motion.p>
          )}
          <h1
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink)' }}
            className="text-2xl font-bold leading-tight"
          >
            История Древнего мира
          </h1>
          <p
            style={{ color: 'var(--ink-muted)', fontFamily: 'var(--font-body)' }}
            className="text-sm mt-1"
          >
            Выбери раздел для изучения
          </p>
        </motion.div>

        <div className="divider-ornament mb-6">
          <span className="text-xs">✦ ✦ ✦</span>
        </div>

        {/* Карточки разделов */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {SECTIONS.map((section, i) => {
            const paraIds = getSectionParaIds(section.id)
            const { completed } = getSectionProgress(paraIds)
            return (
              <SectionCard
                key={section.id}
                {...section}
                paragraphCount={paraIds.length}
                completedCount={completed}
                delay={i * 0.12}
              />
            )
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-8"
        >
          <p
            style={{ color: 'var(--ink-muted)', fontFamily: 'var(--font-body)' }}
            className="text-xs"
          >
            🎙️ Отвечай голосом или текстом · 🗺️ Смотри карты событий · 🏅 Получай медали
          </p>
        </motion.div>
      </main>
    </div>
  )
}
