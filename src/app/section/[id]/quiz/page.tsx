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

const SECTION_META: Record<string, { color: string; name: string }> = {
  'ancient-greece': { color: '#2563EB', name: 'Древняя Греция' },
  'ancient-rome': { color: '#DC2626', name: 'Древний Рим' },
  'germanic-slavic': { color: '#059669', name: 'Германцы и славяне' },
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

function getMedalInfo(score: number): { label: string; color: string; iconColor: string } {
  if (score >= 90) return { label: 'Отлично!', color: '#D97706', iconColor: '#F5A623' }
  if (score >= 60) return { label: 'Хорошо!', color: '#6B7280', iconColor: '#9CA3AF' }
  return { label: 'Продолжай!', color: '#B45309', iconColor: '#D97706' }
}

export default function SectionQuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const student = useAppStore((s) => s.student)

  const section = textbook.sections.find((s) => s.id === id)
  if (!section) notFound()

  const meta = SECTION_META[id] ?? { color: '#6B7280', name: section.title }

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
              style={{ background: `${medal.iconColor}18`, border: `2px solid ${medal.iconColor}33` }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill={medal.iconColor} aria-hidden="true">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>

            <div>
              <h1 className="text-2xl font-extrabold" style={{ color: medal.color }}>
                {medal.label}
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--ink-muted)' }}>
                {meta.name}
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--ink-muted)' }}>
                {correctCount}{' из '}{questions.length}{' верных ('}{score}{'%)'}
              </p>
            </div>

            <div className="h-3 rounded-full overflow-hidden w-full" style={{ background: 'var(--cream-dark)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: medal.iconColor }}
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>

            {/* Results breakdown */}
            <div className="glass-card p-4 text-left flex flex-col gap-2">
              <p className="text-[11px] font-bold tracking-wider" style={{ color: 'var(--ink-muted)' }}>
                {'ИТОГ ПО ВОПРОСАМ'}
              </p>
              {questions.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                    style={{
                      background: i < correctCount ? 'rgba(45,212,168,0.1)' : 'rgba(255,107,107,0.08)',
                      color: i < correctCount ? 'var(--teal)' : 'var(--coral)',
                    }}
                  >
                    {i < correctCount ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="20,6 9,17 4,12" />
                      </svg>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    )}
                  </div>
                  <span className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                    {'\u00a7'}{item.paragraphId}{' \u2014 '}{item.question.slice(0, 50)}{item.question.length > 50 ? '...' : ''}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 w-full pt-1">
              <Link href={`/section/${id}`}>
                <button className="btn-primary w-full py-3.5 text-sm">
                  {'Вернуться к разделу'}
                </button>
              </Link>
              <Link href="/">
                <button
                  className="w-full py-3 text-sm font-bold rounded-xl"
                  style={{
                    background: 'var(--cream-dark)',
                    border: '1.5px solid var(--cream-deep)',
                    color: 'var(--ink)',
                    cursor: 'pointer',
                  }}
                >
                  {'На главную'}
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
        <div className="max-w-2xl mx-auto px-4 py-2.5 flex items-center gap-3">
          <Link
            href={`/section/${id}`}
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
                {'Обобщающий тест \u00b7 '}{current + 1}{' / '}{questions.length}
              </span>
              <span className="text-xs font-bold" style={{ color: 'var(--teal)' }}>
                {correctCount}{' верно'}
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--cream)' }}>
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

      <main className="flex-1 px-4 py-5 max-w-2xl mx-auto w-full flex flex-col gap-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-4"
          >
            {/* Source badge */}
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full self-start"
              style={{
                background: `${meta.color}10`,
                border: `1px solid ${meta.color}30`,
              }}
            >
              <span className="text-[11px] font-bold" style={{ color: meta.color }}>
                {'\u00a7'}{q.paragraphId}{' \u00b7 '}{q.paragraphTitle}
              </span>
            </div>

            {/* Question card */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: `linear-gradient(135deg, ${meta.color} 0%, ${meta.color}dd 100%)`,
              }}
            >
              <div className="text-[10px] font-bold tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {'ВОПРОС '}{current + 1}
              </div>
              <p className="text-[15px] leading-relaxed font-semibold" style={{ color: '#FFFFFF' }}>
                {q.question}
              </p>
            </div>

            {!result && (
              <div className="flex flex-col gap-3">
                <VoiceInput onSubmit={handleAnswerSubmit} disabled={isEvaluating} />

                {isEvaluating && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-4"
                  >
                    <div className="w-12 h-12 rounded-2xl mx-auto mb-2 flex items-center justify-center animate-pulse"
                      style={{ background: 'rgba(245,166,35,0.1)' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--ink-muted)' }}>
                      {'Проверяю твой ответ...'}
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
