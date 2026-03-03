'use client'
import { use, useState } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Header } from '@/components/ui/header'
import { VoiceInput } from '@/components/paragraph/voice-input'
import { ExplanationCard } from '@/components/paragraph/explanation-card'
import { useAppStore } from '@/stores/app-store'
import textbook from '@/data/textbook.json'

interface EvaluateResult {
  isCorrect: boolean
  score: number
  explanation: string
  funFact: string
  modernAnalogy: string
  mnemonic: string
}

interface QuizItem {
  paragraphId: number
  paragraphTitle: string
  paragraphContent: string
  questionIndex: number
  question: string
}

const SECTION_META: Record<string, { emoji: string; color: string; name: string }> = {
  'ancient-greece': { emoji: '🏛️', color: '#4338CA', name: 'Древняя Греция' },
  'ancient-rome': { emoji: '🦅', color: '#0E7490', name: 'Древний Рим' },
  'germanic-slavic': { emoji: '🌲', color: '#1B6CA8', name: 'Германцы и славяне' },
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildSectionQuiz(sectionId: string, paragraphIds: number[]): QuizItem[] {
  const items: QuizItem[] = []
  paragraphIds.forEach((pid) => {
    const para = textbook.paragraphs[String(pid) as keyof typeof textbook.paragraphs]
    if (!para) return
    para.questions.slice(0, 2).forEach((q, qi) => {
      items.push({
        paragraphId: pid,
        paragraphTitle: para.title,
        paragraphContent: para.content,
        questionIndex: qi,
        question: q,
      })
    })
  })
  return shuffleArray(items).slice(0, 10)
}

function getMedalInfo(score: number): { emoji: string; label: string; color: string } {
  if (score >= 90) return { emoji: '🥇', label: 'Отлично!', color: 'var(--yellow)' }
  if (score >= 60) return { emoji: '🥈', label: 'Хорошо!', color: '#9CA3AF' }
  return { emoji: '🥉', label: 'Продолжай учиться!', color: '#CD7F32' }
}

export default function SectionQuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const student = useAppStore((s) => s.student)

  const section = textbook.sections.find((s) => s.id === id)
  if (!section) notFound()

  const meta = SECTION_META[id] ?? { emoji: '📖', color: '#4338CA', name: section.title }

  const [questions] = useState<QuizItem[]>(() => buildSectionQuiz(id, section.paragraphs))
  const [current, setCurrent] = useState(0)
  const [result, setResult] = useState<EvaluateResult | null>(null)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [done, setDone] = useState(false)

  const q = questions[current]
  const isLast = current === questions.length - 1
  const score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0
  const medal = getMedalInfo(score)

  async function handleAnswerSubmit(answerText: string) {
    setIsEvaluating(true)
    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q.question,
          studentAnswer: answerText,
          paragraphTitle: q.paragraphTitle,
          paragraphContent: q.paragraphContent,
        }),
      })
      if (!res.ok) throw new Error('Evaluate failed')
      const data: EvaluateResult = await res.json()
      setResult(data)
      if (data.isCorrect) setCorrectCount((c) => c + 1)

      if (student) {
        fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'quiz',
            studentId: student.id,
            paragraphId: q.paragraphId,
            score: data.isCorrect ? 100 : 0,
            totalQuestions: 1,
          }),
        }).catch(console.error)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsEvaluating(false)
    }
  }

  function handleNext() {
    if (isLast) {
      setDone(true)
    } else {
      setResult(null)
      setCurrent((c) => c + 1)
    }
  }

  // ─── Done screen ─────────────────────────────────────────────
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
              <h1 style={{
                fontFamily: 'var(--font-heading)',
                color: 'var(--ink)',
                fontSize: 26,
                fontWeight: 900,
              }}>
                {medal.label}
              </h1>
              <p style={{
                color: 'var(--ink-muted)',
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                marginTop: 6,
                fontWeight: 600,
              }}>
                {meta.emoji} {meta.name}
              </p>
              <p style={{
                color: 'var(--ink-muted)',
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                marginTop: 4,
                fontWeight: 700,
              }}>
                {correctCount} из {questions.length} верных ответов ({score}%)
              </p>
            </div>

            {/* Score bar */}
            <div className="h-4 rounded-full overflow-hidden w-full" style={{
              background: 'var(--bg-dark)',
              border: '2px solid var(--border-color)',
            }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: medal.color }}
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>

            {/* Results breakdown */}
            <div className="parchment-card p-4 text-left space-y-2">
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--ink-muted)', fontWeight: 800, letterSpacing: '0.08em' }}>
                ИТОГ ПО ВОПРОСАМ
              </p>
              {questions.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span style={{ fontSize: 12 }}>{i < correctCount ? '✅' : '❌'}</span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--ink-muted)', fontWeight: 600 }}>
                    §{item.paragraphId} — {item.question.slice(0, 50)}{item.question.length > 50 ? '...' : ''}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 w-full pt-1">
              <Link href={`/section/${id}`}>
                <button className="btn-terracotta w-full py-3.5 text-sm">
                  ← Вернуться к разделу
                </button>
              </Link>
              <Link href="/">
                <button className="btn-brutal-secondary w-full py-3 text-sm">
                  На главную
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
        <div className="max-w-2xl mx-auto px-4 py-2 flex items-center gap-3">
          <Link href={`/section/${id}`}
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
                {meta.emoji} Обобщающий тест · {current + 1} / {questions.length}
              </span>
              <span style={{
                fontFamily: 'var(--font-body)',
                fontSize: '11px',
                color: 'var(--ink)',
                fontWeight: 800,
                background: 'var(--yellow-light)',
                borderRadius: '6px',
                padding: '1px 6px',
              }}>
                ✓ {correctCount}
              </span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{
              background: 'var(--bg-dark)',
              border: '1.5px solid var(--border-color)',
            }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: meta.color }}
                animate={{ width: `${((current + (result ? 1 : 0)) / questions.length) * 100}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 px-4 py-5 max-w-2xl mx-auto w-full space-y-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Source paragraph badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--yellow-light)',
              border: '2px solid var(--border-color)',
              borderRadius: 10,
              padding: '4px 12px',
              boxShadow: '2px 2px 0px var(--shadow-color)',
            }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--ink)', fontWeight: 800 }}>
                §{q.paragraphId} · {q.paragraphTitle}
              </span>
            </div>

            {/* Question card */}
            <div style={{
              background: meta.color,
              border: '2.5px solid var(--border-color)',
              borderRadius: '14px',
              padding: '16px',
              boxShadow: 'var(--shadow-md)',
            }}>
              <div style={{
                fontFamily: 'var(--font-body)',
                fontSize: '10px',
                color: 'rgba(255,255,255,0.7)',
                letterSpacing: '0.1em',
                marginBottom: 8,
                fontWeight: 800,
              }}>
                ВОПРОС {current + 1}
              </div>
              <p style={{
                fontFamily: 'var(--font-heading)',
                color: '#FFFFFF',
                fontSize: '15px',
                lineHeight: 1.6,
                fontWeight: 600,
              }}>
                {q.question}
              </p>
            </div>

            {!result && (
              <div className="space-y-3">
                <VoiceInput onSubmit={handleAnswerSubmit} disabled={isEvaluating} />

                {isEvaluating && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-4"
                  >
                    <div style={{ fontSize: 28 }}>🤔</div>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--ink-muted)', marginTop: 8, fontWeight: 600 }}>
                      Проверяю твой ответ...
                    </p>
                  </motion.div>
                )}
              </div>
            )}

            {result && (
              <ExplanationCard result={result} onNext={handleNext} isLast={isLast} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
