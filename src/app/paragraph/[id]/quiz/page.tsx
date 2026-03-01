'use client'
import { use, useState, useEffect } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Header } from '@/components/ui/header'
import { buildQuiz, QuizQuestion } from '@/lib/quiz-data'
import textbook from '@/data/textbook.json'
import { useAppStore } from '@/stores/app-store'

function getMedalInfo(score: number): { emoji: string; label: string; color: string } {
  if (score >= 90) return { emoji: '🥇', label: 'Золото!', color: 'var(--gold)' }
  if (score >= 60) return { emoji: '🥈', label: 'Серебро!', color: '#9CA3AF' }
  return { emoji: '🥉', label: 'Бронза!', color: '#CD7F32' }
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
    // On initial load, restore saved result from store
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
      <div className="min-h-dvh flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-lg mx-auto w-full text-center">
          <div style={{ fontSize: 56 }} className="mb-4">📅</div>
          <h1
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink)' }}
            className="text-xl font-bold mb-2"
          >
            Тест по датам недоступен
          </h1>
          <p
            style={{ color: 'var(--ink-muted)', fontFamily: 'var(--font-body)' }}
            className="text-sm mb-6"
          >
            Для этого параграфа недостаточно данных о датах.
          </p>
          <Link href={`/paragraph/${paragraphId}`}>
            <button className="btn-terracotta px-8 py-3 text-sm font-bold"
              style={{ fontFamily: 'var(--font-body)' }}>
              ← Назад к параграфу
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
      // correctCount is already updated by handleSelect — don't add again
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

  // ─── Done screen ────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-dvh flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-lg mx-auto w-full text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', duration: 0.6 }}
            className="space-y-5"
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
              transition={{ delay: 0.4, duration: 0.6 }}
              style={{ fontSize: 72 }}
            >
              {medal.emoji}
            </motion.div>

            <div>
              <h1
                style={{ fontFamily: 'var(--font-heading)', color: medal.color, fontSize: 28, fontWeight: 800 }}
              >
                {medal.label}
              </h1>
              <p
                style={{ color: 'var(--ink-muted)', fontFamily: 'var(--font-body)', marginTop: 6 }}
                className="text-sm"
              >
                {correctCount} из {displayTotal} верных ответов ({score}%)
              </p>
            </div>

            {/* Score bar */}
            <div
              className="h-3 rounded-full overflow-hidden w-full"
              style={{ background: 'var(--parchment-dark)' }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: medal.color }}
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>

            <div className="flex flex-col gap-3 w-full pt-2">
              <Link href={`/paragraph/${paragraphId}`}>
                <button className="btn-terracotta w-full py-3.5 text-sm font-bold"
                  style={{ fontFamily: 'var(--font-body)' }}>
                  ← Вернуться к параграфу
                </button>
              </Link>
              <button
                onClick={handleRestart}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontFamily: 'var(--font-body)',
                  fontSize: '14px',
                  fontWeight: 600,
                  background: 'rgba(255,217,61,0.12)',
                  border: '1.5px solid rgba(255,217,61,0.4)',
                  borderRadius: '10px',
                  color: '#D4890A',
                  cursor: 'pointer',
                }}
              >
                🔁 Пройти тест заново
              </button>
              <Link href={`/section/${para.sectionId}`}>
                <button
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontFamily: 'var(--font-body)',
                    fontSize: '14px',
                    fontWeight: 600,
                    background: '#FFFFFF',
                    border: '1.5px solid var(--parchment-deep)',
                    borderRadius: '10px',
                    color: 'var(--ink)',
                    cursor: 'pointer',
                  }}
                >
                  К разделу →
                </button>
              </Link>
            </div>
          </motion.div>
        </main>
      </div>
    )
  }

  // ─── Quiz screen ─────────────────────────────────────────────
  return (
    <div className="min-h-dvh flex flex-col">
      <Header />

      {/* Progress bar */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid var(--parchment-deep)', boxShadow: '0 1px 4px rgba(94,53,214,0.06)' }}>
        <div className="max-w-lg mx-auto px-4 py-2 flex items-center gap-3">
          <Link href={`/paragraph/${paragraphId}`}
            style={{ color: 'var(--ink-muted)', fontFamily: 'var(--font-body)', fontSize: '12px' }}>
            ←
          </Link>
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--ink-muted)' }}>
                Тест по датам · {current + 1} / {questions.length}
              </span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--ink-muted)' }}>
                ✓ {correctCount}
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--parchment-deep)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'var(--terracotta)' }}
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
            className="space-y-5"
          >
            {/* Date card (the "question") */}
            <div
              style={{
                background: 'linear-gradient(135deg, #5E35D6 0%, #4527A0 100%)',
                borderRadius: '16px',
                padding: '24px 20px',
                textAlign: 'center',
              }}
            >
              <div style={{
                fontFamily: 'var(--font-body)',
                fontSize: '10px',
                color: 'rgba(255,255,255,0.6)',
                letterSpacing: '0.12em',
                marginBottom: 16,
              }}>
                📅 ЧТО ПРОИЗОШЛО В ЭТУ ДАТУ?
              </div>
              <div style={{
                display: 'inline-block',
                background: 'rgba(255,217,61,0.2)',
                border: '1.5px solid rgba(255,217,61,0.6)',
                borderRadius: '24px',
                padding: '10px 24px',
                fontFamily: 'var(--font-heading)',
                color: '#FFD93D',
                fontSize: '20px',
                fontWeight: 700,
              }}>
                {q.date}
              </div>
            </div>

            {/* The real question for user */}
            <p style={{
              fontFamily: 'var(--font-body)',
              color: 'var(--ink-muted)',
              fontSize: '12px',
              textAlign: 'center',
            }}>
              Выбери, что произошло в эту дату:
            </p>

            {/* Options */}
            <div className="space-y-3">
              {q.options.map((option, idx) => {
                const isSelected = selected === idx
                const isCorrect = idx === q.correctIndex
                let bg = '#FFFFFF'
                let border = '1.5px solid var(--parchment-deep)'
                let color = 'var(--ink)'
                let icon = ''

                if (answered) {
                  if (isCorrect) {
                    bg = 'rgba(39,174,96,0.1)'
                    border = '2px solid var(--olive)'
                    color = 'var(--ink)'
                    icon = '✓'
                  } else if (isSelected && !isCorrect) {
                    bg = 'rgba(245,158,11,0.1)'
                    border = '2px solid #F59E0B'
                    color = 'var(--ink-muted)'
                    icon = '✗'
                  }
                } else if (isSelected) {
                  bg = 'rgba(67,97,238,0.08)'
                  border = '2px solid var(--sky)'
                }

                return (
                  <motion.button
                    key={idx}
                    onClick={() => handleSelect(idx)}
                    whileTap={answered ? undefined : { scale: 0.98 }}
                    animate={answered && isCorrect ? { scale: [1, 1.02, 1] } : {}}
                    transition={{ duration: 0.3 }}
                    style={{
                      width: '100%',
                      background: bg,
                      border,
                      borderRadius: '12px',
                      padding: '14px 16px',
                      textAlign: 'left',
                      cursor: answered ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                    }}
                  >
                    <span style={{
                      flexShrink: 0,
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: answered && isCorrect
                        ? 'var(--olive)'
                        : answered && isSelected && !isCorrect
                          ? '#F59E0B'
                          : 'var(--parchment-deep)',
                      color: answered && (isCorrect || (isSelected && !isCorrect)) ? '#FFFFFF' : 'var(--ink-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 700,
                      fontFamily: 'var(--font-body)',
                    }}>
                      {icon || String.fromCharCode(65 + idx)}
                    </span>
                    <span style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '13px',
                      color,
                      lineHeight: 1.5,
                    }}>
                      {option}
                    </span>
                  </motion.button>
                )
              })}
            </div>

            {/* Next button */}
            <AnimatePresence>
              {answered && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  {selected === q.correctIndex ? (
                    <div
                      style={{
                        background: 'rgba(107,142,35,0.1)',
                        border: '1.5px solid var(--olive)',
                        borderRadius: '12px',
                        padding: '12px 16px',
                        marginBottom: 12,
                      }}
                    >
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--ink)', fontWeight: 600 }}>
                        🌿 Верно!
                      </p>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--ink-muted)', marginTop: 2 }}>
                        {q.date} — {q.correctEvent}
                      </p>
                    </div>
                  ) : (
                    <div
                      style={{
                        background: 'rgba(245,158,11,0.1)',
                        border: '1.5px solid #F59E0B',
                        borderRadius: '12px',
                        padding: '12px 16px',
                        marginBottom: 12,
                      }}
                    >
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#D97706', fontWeight: 600 }}>
                        Не совсем...
                      </p>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--ink-muted)', marginTop: 2 }}>
                        Правильный ответ: {q.date} — {q.correctEvent}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleNext}
                    className="btn-terracotta w-full py-3.5 text-sm font-bold"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    {current === questions.length - 1 ? 'Завершить тест →' : 'Следующий вопрос →'}
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
