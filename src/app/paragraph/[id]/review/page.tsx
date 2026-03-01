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

export default function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const paragraphId = parseInt(id)
  if (isNaN(paragraphId) || paragraphId < 1 || paragraphId > 31) notFound()

  const para = textbook.paragraphs[id as keyof typeof textbook.paragraphs]
  if (!para) notFound()

  const getWrongQuestions = useAppStore((s) => s.getWrongQuestions)
  const saveAnswer = useAppStore((s) => s.saveAnswer)
  const student = useAppStore((s) => s.student)

  const wrongIndices = getWrongQuestions(paragraphId)
  const reviewQuestions = wrongIndices.map((idx) => ({ idx, question: para.questions[idx] })).filter((q) => !!q.question)

  const [current, setCurrent] = useState(0)
  const [result, setResult] = useState<EvaluateResult | null>(null)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [done, setDone] = useState(false)

  // No wrong answers
  if (reviewQuestions.length === 0) {
    return (
      <div className="min-h-dvh flex flex-col" style={{ background: 'var(--cream)' }}>
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-lg mx-auto w-full text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(45,212,168,0.1)' }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20,6 9,17 4,12" />
            </svg>
          </div>
          <h1
            className="text-xl font-extrabold mb-2"
            style={{ color: 'var(--navy)' }}
          >
            {'Ошибок нет!'}
          </h1>
          <p className="text-sm mb-6" style={{ color: 'var(--ink-muted)' }}>
            {'Ты ответил правильно на все вопросы этого параграфа.'}
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

  const currentQ = reviewQuestions[current]
  const isLast = current === reviewQuestions.length - 1

  async function handleAnswerSubmit(answerText: string) {
    setIsEvaluating(true)
    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQ.question,
          studentAnswer: answerText,
          paragraphTitle: para.title,
          paragraphContent: para.content,
        }),
      })
      if (!res.ok) throw new Error('Evaluate failed')
      const data: EvaluateResult = await res.json()
      setResult(data)

      saveAnswer({
        paragraphId,
        questionIndex: currentQ.idx,
        isCorrect: data.isCorrect,
        hintLevel: 0,
      })

      if (student) {
        fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'answer',
            studentId: student.id,
            paragraphId,
            questionIndex: currentQ.idx,
            answerText,
            isCorrect: data.isCorrect,
            hintLevel: 0,
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
              style={{
                background: 'rgba(37,99,235,0.08)',
                border: '2px solid rgba(37,99,235,0.15)',
              }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="23,4 23,10 17,10" />
                <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
              </svg>
            </div>
            <h1 className="text-xl font-extrabold" style={{ color: 'var(--navy)' }}>
              {'Повторение завершено!'}
            </h1>
            <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>
              {'Повторил '}{reviewQuestions.length}{reviewQuestions.length === 1 ? ' вопрос' : ' вопроса'}
            </p>
            <div className="flex flex-col gap-3 w-full pt-2">
              <Link href={`/paragraph/${paragraphId}/quiz`}>
                <button className="btn-primary w-full py-3.5 text-sm">
                  {'Тест по датам'}
                </button>
              </Link>
              <Link href={`/paragraph/${paragraphId}`}>
                <button
                  className="w-full py-3 text-sm font-bold rounded-xl"
                  style={{
                    background: 'var(--cream-dark)',
                    border: '1.5px solid var(--cream-deep)',
                    color: 'var(--ink)',
                    cursor: 'pointer',
                  }}
                >
                  {'Назад к параграфу'}
                </button>
              </Link>
            </div>
          </motion.div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--cream)' }}>
      <Header />

      {/* Progress */}
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
                {'Повторение \u00b7 '}{current + 1}{' / '}{reviewQuestions.length}
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--cream)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: '#2563EB' }}
                animate={{ width: `${((current + (result ? 1 : 0)) / reviewQuestions.length) * 100}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 px-4 py-5 max-w-lg mx-auto w-full flex flex-col gap-4">
        {/* Paragraph context */}
        <div
          className="glass-card p-3 flex items-center gap-3"
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'rgba(37,99,235,0.08)', color: '#2563EB' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="23,4 23,10 17,10" />
              <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold" style={{ color: 'var(--ink)' }}>
              {'\u00a7'}{paragraphId}{' \u00b7 '}{para.title}
            </p>
            <p className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>
              {'Работаем над ошибками'}
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-4"
          >
            {/* Question */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              }}
            >
              <div className="text-[10px] font-bold tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {'ВОПРОС '}{currentQ.idx + 1}{' (ПОВТОРЕНИЕ)'}
              </div>
              <p className="text-[15px] leading-relaxed font-semibold" style={{ color: '#FFFFFF' }}>
                {currentQ.question}
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
