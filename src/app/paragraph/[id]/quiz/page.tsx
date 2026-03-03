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
  if (score >= 90) return { emoji: '🥇', label: 'Золото!', color: 'var(--yellow)' }
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
            className="text-xl font-extrabold mb-2"
          >
            Тест по датам недоступен
          </h1>
          <p
            style={{ color: 'var(--ink-muted)', fontFamily: 'var(--font-body)' }}
            className="text-sm mb-6 font-semibold"
          >
            Для этого параграфа недостаточно данных о датах.
          </p>
          <Link href={`/paragraph/${paragraphId}`}>
            <button className="btn-terracotta px-8 py-3 text-sm">
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
                style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink)', fontSize: 28, fontWeight: 900 }}
              >
                {medal.label}
              </h1>
              <p
                style={{ color: 'var(--ink-muted)', fontFamily: 'var(--font-body)', marginTop: 6 }}
                className="text-sm font-bold"
              >
                {correctCount} из {displayTotal} верных ответов ({score}%)
              </p>
            </div>

            {/* Score bar */}
            <div
              className="h-4 rounded-full overflow-hidden w-full"
              style={{
                background: 'var(--bg-dark)',
                border: '2px solid var(--border-color)',
              }}
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
                <button className="btn-terracotta w-full py-3.5 text-sm">
                  ← Вернуться к параграфу
                </button>
              </Link>
              <button
                onClick={handleRestart}
                className="btn-brutal-secondary w-full py-3 text-sm"
              >
                🔁 Пройти тест заново
              </button>
              <Link href={`/section/${para.sectionId}`}>
                <button className="btn-brutal-secondary w-full py-3 text-sm">
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
      <div style={{
        background: 'var(--card-bg)',
        borderBottom: '2.5px solid var(--border-color)',
      }}>
        <div className="max-w-lg mx-auto px-4 py-2 flex items-center gap-3">
          <Link href={`/paragraph/${paragraphId}`}
            style={{
              color: 'var(--ink)',
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              fontWeight: 800,
              background: 'var(--yellow-light)',
              border: '2px solid var(--border-color)',
              borderRadius: '8px',
              padding: '2px 8px',
              boxShadow: '2px 2px 0px var(--shadow-color)',
            }}>
            ←
          </Link>
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--ink-muted)', fontWeight: 700 }}>
                Тест по датам · {current + 1} / {questions.length}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '11px',
                  color: 'var(--ink)',
                  fontWeight: 800,
                  background: 'var(--yellow-light)',
                  borderRadius: '6px',
                  padding: '1px 6px',
                }}
              >
                ✓ {correctCount}
              </span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{
              background: 'var(--bg-dark)',
              border: '1.5px solid var(--border-color)',
            }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'var(--indigo)' }}
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
            {/* Date card */}
            <div
              style={{
                background: 'var(--indigo)',
                border: '2.5px solid var(--border-color)',
                borderRadius: '16px',
                padding: '24px 20px',
                textAlign: 'center',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <div style={{
                fontFamily: 'var(--font-body)',
                fontSize: '10px',
                color: 'rgba(255,255,255,0.7)',
                letterSpacing: '0.12em',
                marginBottom: 16,
                fontWeight: 800,
              }}>
                📅 ЧТО ПРОИЗОШЛО В ЭТУ ДАТУ?
              </div>
              <div style={{
                display: 'inline-block',
                background: 'var(--yellow)',
                border: '2.5px solid var(--border-color)',
                borderRadius: '14px',
                padding: '10px 24px',
                fontFamily: 'var(--font-heading)',
                color: 'var(--ink)',
                fontSize: '20px',
                fontWeight: 900,
                boxShadow: '3px 3px 0px var(--shadow-color)',
              }}>
                {q.date}
              </div>
            </div>

            <p style={{
              fontFamily: 'var(--font-body)',
              color: 'var(--ink-muted)',
              fontSize: '12px',
              textAlign: 'center',
              fontWeight: 700,
            }}>
              Выбери, что произошло в эту дату:
            </p>

            {/* Options */}
            <div className="space-y-3">
              {q.options.map((option, idx) => {
                const isSelected = selected === idx
                const isCorrect = idx === q.correctIndex
                let bg = 'var(--card-bg)'
                let border = '2.5px solid var(--border-color)'
                let color = 'var(--ink)'
                let icon = ''
                let shadow = 'var(--shadow-sm)'

                if (answered) {
                  if (isCorrect) {
                    bg = '#D1FAE5'
                    border = '2.5px solid var(--border-color)'
                    color = 'var(--ink)'
                    icon = '✓'
                    shadow = '3px 3px 0px #065F46'
                  } else if (isSelected && !isCorrect) {
                    bg = 'var(--pink-light)'
                    border = '2.5px solid var(--border-color)'
                    color = 'var(--ink)'
                    icon = '✗'
                    shadow = '3px 3px 0px #9F1239'
                  }
                } else if (isSelected) {
                  bg = 'var(--yellow-light)'
                  border = '2.5px solid var(--border-color)'
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
                      borderRadius: '14px',
                      padding: '14px 16px',
                      textAlign: 'left',
                      cursor: answered ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      boxShadow: shadow,
                      transition: 'transform 0.1s, box-shadow 0.1s',
                    }}
                  >
                    <span style={{
                      flexShrink: 0,
                      width: 26,
                      height: 26,
                      borderRadius: '8px',
                      background: answered && isCorrect
                        ? '#059669'
                        : answered && isSelected && !isCorrect
                          ? 'var(--pink)'
                          : 'var(--indigo)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 900,
                      fontFamily: 'var(--font-body)',
                      border: '2px solid var(--border-color)',
                    }}>
                      {icon || String.fromCharCode(65 + idx)}
                    </span>
                    <span style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '13px',
                      color,
                      lineHeight: 1.5,
                      fontWeight: 600,
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
                        background: '#D1FAE5',
                        border: '2.5px solid var(--border-color)',
                        borderRadius: '12px',
                        padding: '12px 16px',
                        marginBottom: 12,
                        boxShadow: '3px 3px 0px #065F46',
                      }}
                    >
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--ink)', fontWeight: 800 }}>
                        🌿 Верно!
                      </p>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--ink-muted)', marginTop: 2, fontWeight: 600 }}>
                        {q.date} — {q.correctEvent}
                      </p>
                    </div>
                  ) : (
                    <div
                      style={{
                        background: 'var(--yellow-light)',
                        border: '2.5px solid var(--border-color)',
                        borderRadius: '12px',
                        padding: '12px 16px',
                        marginBottom: 12,
                        boxShadow: 'var(--shadow-sm)',
                      }}
                    >
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--ink)', fontWeight: 800 }}>
                        Не совсем...
                      </p>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--ink-muted)', marginTop: 2, fontWeight: 600 }}>
                        Правильный ответ: {q.date} — {q.correctEvent}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleNext}
                    className="btn-terracotta w-full py-3.5 text-sm"
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
