'use client'
import { use, useState, useEffect } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Header } from '@/components/ui/header'
import { buildQuiz, QuizQuestion } from '@/lib/quiz-data'
import textbook from '@/data/textbook.json'
import { useAppStore } from '@/stores/app-store'

function getMedalInfo(score: number): { label: string; color: string; bg: string; iconColor: string } {
  if (score >= 90) return { label: 'Отлично!', color: '#D97706', bg: 'rgba(245,166,35,0.1)', iconColor: '#F5A623' }
  if (score >= 60) return { label: 'Хорошо!', color: '#6B7280', bg: 'rgba(107,114,128,0.08)', iconColor: '#9CA3AF' }
  return { label: 'Продолжай!', color: '#B45309', bg: 'rgba(180,83,9,0.08)', iconColor: '#D97706' }
}

export default function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const student = useAppStore((s) => s.student)
  const saveQuizResult = useAppStore((s) => s.saveQuizResult)
  const clearQuizResult = useAppStore((s) => s.clearQuizResult)

  const paragraphId = parseInt(id)
  if (isNaN(paragraphId) || paragraphId < 1 || paragraphId > 31) notFound()

  const para = textbook.paragraphs[id as keyof typeof textbook.paragraphs]
  if (!para) notFound()

  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [done, setDone] = useState(false)
  const [restartKey, setRestartKey] = useState(0)

  useEffect(() => {
    if (restartKey === 0) {
      const saved = useAppStore.getState().getQuizResult(paragraphId)
      if (saved) {
        setCorrectCount(saved.correctCount)
        setTotalCount(saved.totalCount)
        setDone(true)
      }
    }
    setQuestions(buildQuiz(paragraphId))
  }, [paragraphId, restartKey])

  if (questions.length === 0 && !done) {
    return (
      <div className="min-h-dvh flex flex-col" style={{ background: 'var(--cream)' }}>
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-lg mx-auto w-full text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--cream-dark)' }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--ink-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <h1
            className="text-xl font-extrabold mb-2"
            style={{ color: 'var(--navy)' }}
          >
            {'Тест по датам недоступен'}
          </h1>
          <p className="text-sm mb-6" style={{ color: 'var(--ink-muted)' }}>
            {'Для этого параграфа недостаточно данных о датах.'}
          </p>
          <Link href={`/paragraph/${paragraphId}`}>
            <button className="btn-primary px-8 py-3 text-sm">
              {'Назад к параграфу'}
            </button>
          </Link>
        </main>
      </div>
    )
  }

  const q = questions[current]
  const displayTotal = done ? totalCount : questions.length
  const score = displayTotal > 0 ? Math.round((correctCount / displayTotal) * 100) : 0
  const medal = getMedalInfo(score)

  function handleSelect(idx: number) {
    if (answered) return
    setSelected(idx)
    setAnswered(true)
    if (idx === q.correctIndex) {
      setCorrectCount((c) => c + 1)
    }

    if (student) {
      fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'quiz',
          studentId: student.id,
          paragraphId,
          score: idx === q.correctIndex ? 100 : 0,
          totalQuestions: 1,
        }),
      }).catch(console.error)
    }
  }

  function handleNext() {
    if (current === questions.length - 1) {
      const finalTotal = questions.length
      setTotalCount(finalTotal)
      saveQuizResult({ paragraphId, correctCount, totalCount: finalTotal })
      setDone(true)
    } else {
      setCurrent((c) => c + 1)
      setSelected(null)
      setAnswered(false)
    }
  }

  function handleRestart() {
    clearQuizResult(paragraphId)
    setCurrent(0)
    setSelected(null)
    setAnswered(false)
    setCorrectCount(0)
    setTotalCount(0)
    setDone(false)
    setRestartKey((k) => k + 1)
  }

  // Done screen
  if (done) {
    return (
      <div className="min-h-dvh flex flex-col" style={{ background: 'var(--cream)' }}>
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-lg mx-auto w-full text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', duration: 0.6 }}
            className="flex flex-col gap-5 w-full"
          >
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto"
              style={{
                background: medal.bg,
                border: `2px solid ${medal.color}33`,
              }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill={medal.iconColor} aria-hidden="true">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>

            <div>
              <h1
                className="text-2xl font-extrabold"
                style={{ color: medal.color }}
              >
                {medal.label}
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--ink-muted)' }}>
                {correctCount}{' из '}{displayTotal}{' верных ответов ('}{score}{'%)'}
              </p>
            </div>

            {/* Score bar */}
            <div
              className="h-3 rounded-full overflow-hidden w-full"
              style={{ background: 'var(--cream-dark)' }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: medal.iconColor }}
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>

            <div className="flex flex-col gap-3 w-full pt-2">
              <Link href={`/paragraph/${paragraphId}`}>
                <button className="btn-primary w-full py-3.5 text-sm">
                  {'Вернуться к параграфу'}
                </button>
              </Link>
              <button
                onClick={handleRestart}
                className="w-full py-3 text-sm font-bold rounded-xl"
                style={{
                  background: 'rgba(37,99,235,0.08)',
                  border: '1.5px solid rgba(37,99,235,0.2)',
                  color: '#2563EB',
                  cursor: 'pointer',
                }}
              >
                {'Пройти тест заново'}
              </button>
              <Link href={`/section/${para.sectionId}`}>
                <button
                  className="w-full py-3 text-sm font-bold rounded-xl"
                  style={{
                    background: 'var(--cream-dark)',
                    border: '1.5px solid var(--cream-deep)',
                    color: 'var(--ink)',
                    cursor: 'pointer',
                  }}
                >
                  {'К разделу'}
                </button>
              </Link>
            </div>
          </motion.div>
        </main>
      </div>
    )
  }

  // Quiz screen
  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--cream)' }}>
      <Header />

      {/* Progress bar */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid var(--cream-deep)' }}>
        <div className="max-w-lg mx-auto px-4 py-2.5 flex items-center gap-3">
          <Link
            href={`/paragraph/${paragraphId}`}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--cream)', color: 'var(--ink-muted)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold" style={{ color: 'var(--ink-muted)' }}>
                {'Тест по датам \u00b7 '}{current + 1}{' / '}{questions.length}
              </span>
              <span className="text-xs font-bold" style={{ color: 'var(--teal)' }}>
                {correctCount}{' верно'}
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--cream)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'var(--amber)' }}
                animate={{ width: `${((current + (answered ? 1 : 0)) / questions.length) * 100}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 px-4 py-5 max-w-lg mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-5"
          >
            {/* Date card */}
            <div
              className="rounded-2xl p-6 text-center"
              style={{
                background: 'linear-gradient(135deg, var(--navy) 0%, var(--navy-light) 100%)',
              }}
            >
              <div className="text-[10px] font-bold tracking-widest mb-4" style={{ color: 'var(--amber-light)' }}>
                {'ЧТО ПРОИЗОШЛО В ЭТУ ДАТУ?'}
              </div>
              <div
                className="inline-block px-6 py-2.5 rounded-full text-xl font-extrabold"
                style={{
                  background: 'rgba(245,166,35,0.15)',
                  border: '2px solid rgba(245,166,35,0.3)',
                  color: 'var(--amber)',
                }}
              >
                {q.date}
              </div>
            </div>

            <p className="text-xs font-semibold text-center" style={{ color: 'var(--ink-muted)' }}>
              {'Выбери правильный ответ:'}
            </p>

            {/* Options */}
            <div className="flex flex-col gap-3">
              {q.options.map((option, idx) => {
                const isSelected = selected === idx
                const isCorrect = idx === q.correctIndex

                let bg = '#FFFFFF'
                let border = '1.5px solid var(--cream-deep)'
                let textColor = 'var(--ink)'
                let badgeBg = 'var(--cream)'
                let badgeColor = 'var(--ink-muted)'

                if (answered) {
                  if (isCorrect) {
                    bg = 'rgba(45,212,168,0.08)'
                    border = '2px solid var(--teal)'
                    badgeBg = 'var(--teal)'
                    badgeColor = '#FFFFFF'
                  } else if (isSelected && !isCorrect) {
                    bg = 'rgba(255,107,107,0.06)'
                    border = '2px solid var(--coral)'
                    textColor = 'var(--ink-muted)'
                    badgeBg = 'var(--coral)'
                    badgeColor = '#FFFFFF'
                  }
                }

                return (
                  <motion.button
                    key={idx}
                    onClick={() => handleSelect(idx)}
                    whileTap={answered ? undefined : { scale: 0.98 }}
                    animate={answered && isCorrect ? { scale: [1, 1.02, 1] } : {}}
                    transition={{ duration: 0.3 }}
                    className="w-full rounded-xl p-4 text-left flex items-start gap-3 cursor-pointer"
                    style={{
                      background: bg,
                      border,
                      cursor: answered ? 'default' : 'pointer',
                    }}
                  >
                    <span
                      className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                      style={{
                        background: badgeBg,
                        color: badgeColor,
                      }}
                    >
                      {answered && isCorrect ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="20,6 9,17 4,12" />
                        </svg>
                      ) : answered && isSelected && !isCorrect ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      ) : (
                        String.fromCharCode(65 + idx)
                      )}
                    </span>
                    <span className="text-sm leading-relaxed" style={{ color: textColor }}>
                      {option}
                    </span>
                  </motion.button>
                )
              })}
            </div>

            {/* Feedback & Next */}
            <AnimatePresence>
              {answered && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col gap-3"
                >
                  {selected === q.correctIndex ? (
                    <div
                      className="rounded-xl p-4"
                      style={{
                        background: 'rgba(45,212,168,0.08)',
                        border: '1.5px solid rgba(45,212,168,0.2)',
                      }}
                    >
                      <p className="text-sm font-bold" style={{ color: 'var(--teal-dark)' }}>
                        {'Верно!'}
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'var(--ink-muted)' }}>
                        {q.date}{' \u2014 '}{q.correctEvent}
                      </p>
                    </div>
                  ) : (
                    <div
                      className="rounded-xl p-4"
                      style={{
                        background: 'rgba(255,107,107,0.06)',
                        border: '1.5px solid rgba(255,107,107,0.2)',
                      }}
                    >
                      <p className="text-sm font-bold" style={{ color: 'var(--coral)' }}>
                        {'Не совсем...'}
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'var(--ink-muted)' }}>
                        {'Правильный ответ: '}{q.date}{' \u2014 '}{q.correctEvent}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleNext}
                    className="btn-primary w-full py-3.5 text-sm"
                  >
                    {current === questions.length - 1 ? 'Завершить тест' : 'Следующий вопрос'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
