'use client'
import { use, useState } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Header } from '@/components/ui/header'
import { VoiceInput } from '@/components/paragraph/voice-input'
import { ExplanationCard } from '@/components/paragraph/explanation-card'
import { HintButton, HintDisplay } from '@/components/paragraph/hint-button'
import { EventMap } from '@/components/paragraph/event-map'
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

const FUN_FACTS: Record<string, string[]> = {
  'ancient-greece': [
    'Греки изобрели демократию — систему, которой мы пользуемся сегодня!',
    'Олимпийские игры проводились каждые 4 года — как и сейчас!',
    'Слово «школа» происходит от греческого «схоле» — свободное время.',
  ],
  'ancient-rome': [
    'Слово «календарь» пришло из Древнего Рима!',
    'Римляне строили дороги так хорошо, что некоторые из них служат до сих пор.',
    'Слово «кандидат» происходит от лат. candidus — белый (кандидаты носили белые тоги).',
  ],
  'germanic-slavic': [
    'Название «Европа» возможно пришло от финикийского слова «закат».',
    'Первое письменное упоминание славян датируется VI веком н. э.',
    'Германцы и славяне сыграли ключевую роль в образовании средневековых государств.',
  ],
}

export default function ParagraphPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const student = useAppStore((s) => s.student)
  const saveAnswer = useAppStore((s) => s.saveAnswer)

  const paragraphId = parseInt(id)
  if (isNaN(paragraphId) || paragraphId < 1 || paragraphId > 31) notFound()

  const para = textbook.paragraphs[id as keyof typeof textbook.paragraphs]
  if (!para) notFound()

  const answers = useAppStore((s) => s.answers)

  const answeredIndices = new Set(
    answers.filter((a) => a.paragraphId === paragraphId).map((a) => a.questionIndex)
  )
  const allAnswered = para.questions.every((_, i) => answeredIndices.has(i))
  const firstUnanswered = (() => {
    const idx = para.questions.findIndex((_, i) => !answeredIndices.has(i))
    return idx === -1 ? 0 : idx
  })()

  const [questionIndex, setQuestionIndex] = useState(firstUnanswered)
  const [result, setResult] = useState<EvaluateResult | null>(null)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [evalError, setEvalError] = useState(false)
  const [hintLevel, setHintLevel] = useState(0)
  const [hintText, setHintText] = useState('')
  const [hintLoading, setHintLoading] = useState(false)
  const [done, setDone] = useState(allAnswered)
  const [showFunFact, setShowFunFact] = useState(true)

  const questions = para.questions
  const currentQuestion = questions[questionIndex]
  const isLast = questionIndex === questions.length - 1
  const sectionId = para.sectionId
  const funFacts = FUN_FACTS[sectionId] ?? FUN_FACTS['ancient-greece']
  const funFact = funFacts[questionIndex % funFacts.length]

  async function handleAnswerSubmit(answerText: string) {
    setIsEvaluating(true)
    setShowFunFact(false)
    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQuestion,
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
        questionIndex,
        isCorrect: data.isCorrect,
        hintLevel,
      })

      if (student) {
        fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'answer',
            studentId: student.id,
            paragraphId,
            questionIndex,
            answerText,
            isCorrect: data.isCorrect,
            hintLevel,
          }),
        }).catch(console.error)
      }
    } catch (err) {
      console.error(err)
      setEvalError(true)
    } finally {
      setIsEvaluating(false)
    }
  }

  function handleNext() {
    if (isLast) {
      setDone(true)
    } else {
      setResult(null)
      setHintLevel(0)
      setHintText('')
      setEvalError(false)
      setShowFunFact(true)
      setQuestionIndex((i) => i + 1)
    }
  }

  // Completion screen
  if (done) {
    return (
      <div className="min-h-dvh flex flex-col" style={{ background: 'var(--cream)' }}>
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-lg mx-auto w-full text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', duration: 0.6 }}
            className="flex flex-col gap-5"
          >
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto"
              style={{
                background: 'linear-gradient(135deg, var(--teal) 0%, var(--teal-dark) 100%)',
                boxShadow: '0 8px 32px rgba(45,212,168,0.3)',
              }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20,6 9,17 4,12" />
              </svg>
            </div>
            <div>
              <h1
                className="text-2xl font-extrabold"
                style={{ color: 'var(--navy)' }}
              >
                {'Параграф пройден!'}
              </h1>
              <p
                className="text-sm mt-1"
                style={{ color: 'var(--ink-muted)' }}
              >
                {'\u00a7'}{paragraphId} {'\u00b7'} {para.title}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full">
              <Link href={`/paragraph/${paragraphId}/quiz`} className="col-span-2">
                <button className="btn-primary w-full py-3.5 text-sm flex items-center justify-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14,2 14,8 20,8" />
                  </svg>
                  {'Тест по датам'}
                </button>
              </Link>
              <Link href={`/paragraph/${paragraphId}/review`}>
                <button
                  className="w-full py-3 text-xs font-bold rounded-xl transition-all"
                  style={{
                    background: 'rgba(37,99,235,0.08)',
                    border: '1.5px solid rgba(37,99,235,0.2)',
                    color: '#2563EB',
                  }}
                >
                  {'Ошибки'}
                </button>
              </Link>
              <Link href={`/section/${sectionId}`}>
                <button
                  className="w-full py-3 text-xs font-bold rounded-xl transition-all"
                  style={{
                    background: 'var(--cream-dark)',
                    border: '1.5px solid var(--cream-deep)',
                    color: 'var(--ink)',
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

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--cream)' }}>
      <Header />

      {/* Progress bar */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid var(--cream-deep)' }}>
        <div className="max-w-2xl mx-auto px-4 py-2.5 flex items-center gap-3">
          <Link
            href={`/section/${sectionId}`}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: 'var(--cream)', color: 'var(--ink-muted)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold" style={{ color: 'var(--ink-muted)' }}>
                {'\u00a7'}{paragraphId} {'\u00b7'} {'Вопрос '}{questionIndex + 1}{' из '}{questions.length}
              </span>
            </div>
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ background: 'var(--cream)' }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'var(--amber)' }}
                animate={{ width: `${((questionIndex + (result ? 1 : 0)) / questions.length) * 100}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 px-4 py-5 max-w-2xl mx-auto w-full flex flex-col gap-4">

        {/* Paragraph title */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4 text-center"
        >
          <h1
            className="text-base font-extrabold"
            style={{ color: 'var(--navy)' }}
          >
            {para.title}
          </h1>
        </motion.div>

        {/* Event map */}
        {para.mapMarkers && (para.mapMarkers as { lat: number; lng: number; name: string; description: string }[]).length > 0 && (
          <EventMap markers={para.mapMarkers as { lat: number; lng: number; name: string; description: string }[]} />
        )}

        {/* Question block */}
        <AnimatePresence mode="wait">
          <motion.div
            key={questionIndex}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-4"
          >
            {/* Fun fact */}
            <AnimatePresence>
              {showFunFact && funFact && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-xl p-3"
                  style={{
                    background: 'rgba(245,166,35,0.08)',
                    border: '1.5px solid rgba(245,166,35,0.15)',
                  }}
                >
                  <span className="text-[10px] font-extrabold tracking-wider" style={{ color: 'var(--amber-dark)' }}>
                    {'ТЫ ЗНАЛ?'}
                  </span>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--ink)' }}>
                    {funFact}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Question card */}
            <div
              className="rounded-2xl p-5 relative"
              style={{
                background: 'linear-gradient(135deg, var(--navy) 0%, var(--navy-light) 100%)',
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className="text-[10px] font-bold tracking-widest"
                  style={{ color: 'var(--amber-light)' }}
                >
                  {'ВОПРОС '}{questionIndex + 1}
                </div>
                {!result && !isEvaluating && (
                  <HintButton
                    paragraphId={paragraphId}
                    questionIndex={questionIndex}
                    currentLevel={hintLevel}
                    onHintUsed={setHintLevel}
                    compact
                    onReceiveHint={setHintText}
                    loading={hintLoading}
                    onSetLoading={setHintLoading}
                  />
                )}
              </div>
              <p
                className="text-[15px] leading-relaxed font-semibold"
                style={{ color: '#FFFFFF' }}
              >
                {currentQuestion}
              </p>
            </div>

            {/* Input area */}
            {!result && (
              <div className="flex flex-col gap-3">
                <HintDisplay hint={hintText} level={hintLevel} />
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

                {evalError && !isEvaluating && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="rounded-xl p-4 text-center"
                    style={{
                      background: 'rgba(255,107,107,0.08)',
                      border: '1.5px solid rgba(255,107,107,0.2)',
                    }}
                  >
                    <p className="text-sm font-semibold" style={{ color: 'var(--coral)' }}>
                      {'Не удалось проверить ответ. Попробуй ещё раз.'}
                    </p>
                    <button
                      onClick={() => setEvalError(false)}
                      className="mt-2 text-xs font-bold underline"
                      style={{ color: 'var(--coral)', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      {'Попробовать снова'}
                    </button>
                  </motion.div>
                )}
              </div>
            )}

            {/* Result */}
            {result && (
              <ExplanationCard
                result={result}
                onNext={handleNext}
                isLast={isLast}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
