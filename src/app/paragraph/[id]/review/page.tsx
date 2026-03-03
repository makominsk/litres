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

  if (reviewQuestions.length === 0) {
    return (
      <div className="min-h-dvh flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-lg mx-auto w-full text-center">
          <div style={{ fontSize: 56 }} className="mb-4">🌿</div>
          <h1
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink)' }}
            className="text-xl font-extrabold mb-2"
          >
            Ошибок нет!
          </h1>
          <p
            style={{ color: 'var(--ink-muted)', fontFamily: 'var(--font-body)' }}
            className="text-sm mb-6 font-semibold"
          >
            Ты ответил правильно на все вопросы этого параграфа.
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
            <div style={{ fontSize: 64 }}>🔄</div>
            <h1 style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink)', fontSize: 22, fontWeight: 900 }}>
              Повторение завершено!
            </h1>
            <p style={{ color: 'var(--ink-muted)', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600 }}>
              Повторил {reviewQuestions.length} {reviewQuestions.length === 1 ? 'вопрос' : 'вопроса'}
            </p>
            <div className="flex flex-col gap-3 w-full pt-2">
              <Link href={`/paragraph/${paragraphId}/quiz`}>
                <button className="btn-terracotta w-full py-3.5 text-sm">
                  📝 Тест по датам
                </button>
              </Link>
              <Link href={`/paragraph/${paragraphId}`}>
                <button className="btn-brutal-secondary w-full py-3 text-sm">
                  ← Назад к параграфу
                </button>
              </Link>
            </div>
          </motion.div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <Header />

      {/* Progress */}
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
                🔄 Повторение ошибок · {current + 1} / {reviewQuestions.length}
              </span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{
              background: 'var(--bg-dark)',
              border: '1.5px solid var(--border-color)',
            }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'var(--sky)' }}
                animate={{ width: `${((current + (result ? 1 : 0)) / reviewQuestions.length) * 100}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 px-4 py-5 max-w-lg mx-auto w-full space-y-4">
        {/* Paragraph context */}
        <div
          className="parchment-card p-3"
          style={{ display: 'flex', alignItems: 'center', gap: 10 }}
        >
          <div style={{
            background: 'var(--sky)',
            color: '#FFFFFF',
            borderRadius: '10px',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            flexShrink: 0,
            border: '2px solid var(--border-color)',
            boxShadow: '2px 2px 0px var(--shadow-color)',
          }}>
            🔄
          </div>
          <div>
            <p style={{ fontFamily: 'var(--font-body)', color: 'var(--ink)', fontSize: 12, fontWeight: 700 }}>
              §{paragraphId} · {para.title}
            </p>
            <p style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-muted)', fontSize: 11, fontWeight: 600 }}>
              Работаем над ошибками
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
            className="space-y-4"
          >
            {/* Question */}
            <div style={{
              background: 'var(--sky)',
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
                ВОПРОС {currentQ.idx + 1} (ПОВТОРЕНИЕ)
              </div>
              <p style={{
                fontFamily: 'var(--font-heading)',
                color: '#FFFFFF',
                fontSize: '15px',
                lineHeight: 1.6,
                fontWeight: 600,
              }}>
                {currentQ.question}
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
