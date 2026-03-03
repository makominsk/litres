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
import { TextbookModal } from '@/components/textbook/textbook-modal'
import { useAppStore } from '@/stores/app-store'
import { useTextbookStore } from '@/stores/textbook-store'
import textbook from '@/data/textbook.json'
import textbookPages from '@/data/textbook-pages.json'

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

  const clearParagraphAnswers = useAppStore((s) => s.clearParagraphAnswers)
  const openTextbook = useTextbookStore((s) => s.openTextbook)
  const setSelectedParagraphId = useTextbookStore((s) => s.setSelectedParagraphId)

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

  function handleRestart() {
    clearParagraphAnswers(paragraphId)
    setQuestionIndex(0)
    setResult(null)
    setHintLevel(0)
    setHintText('')
    setEvalError(false)
    setShowFunFact(true)
    setDone(false)
  }

  function handleOpenParagraphInTextbook() {
    setSelectedParagraphId(paragraphId)
    const range = textbookPages[String(paragraphId) as keyof typeof textbookPages]
    openTextbook(range?.startPage ?? 1)
  }

  // Экран завершения
  if (done) {
    return (
      <div className="min-h-dvh flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-lg mx-auto w-full text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', duration: 0.6 }}
            className="space-y-6"
          >
            <div style={{ fontSize: 72 }}>🎉</div>
            <h1
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink)' }}
              className="text-3xl font-extrabold"
            >
              Параграф пройден!
            </h1>
            <p
              style={{ color: 'var(--ink-muted)', fontFamily: 'var(--font-body)' }}
              className="text-base font-semibold"
            >
              §{paragraphId} · {para.title}
            </p>

            <div className="grid grid-cols-2 gap-3 w-full">
              <Link href={`/paragraph/${paragraphId}/quiz`} className="col-span-2">
                <button className="btn-terracotta w-full py-3.5 text-base">
                  📝 Тест по датам
                </button>
              </Link>
              <button
                onClick={handleRestart}
                className="btn-brutal-secondary w-full py-3 text-sm col-span-2"
              >
                🔁 Пройти тест снова
              </button>
              <Link href={`/paragraph/${paragraphId}/review`}>
                <button className="btn-brutal-secondary w-full py-3 text-sm">
                  🔄 Ошибки
                </button>
              </Link>
              <Link href={`/section/${sectionId}`}>
                <button className="btn-brutal-secondary w-full py-3 text-sm">
                  ← Раздел
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

      {/* Прогресс параграфа */}
      <div style={{
        background: 'var(--card-bg)',
        borderBottom: '2.5px solid var(--border-color)',
      }}>
        <div className="max-w-2xl mx-auto px-4 py-2 flex items-center gap-3">
          <Link
            href={`/section/${sectionId}`}
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
            }}
          >
            ←
          </Link>
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <span
                style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--ink-muted)', fontWeight: 700 }}
              >
                §{paragraphId} · Вопрос {questionIndex + 1} из {questions.length}
              </span>
            </div>
            <div
              className="h-2.5 rounded-full overflow-hidden"
              style={{ background: 'var(--bg-dark)', border: '1.5px solid var(--border-color)' }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'var(--indigo)' }}
                animate={{ width: `${((questionIndex + (result ? 1 : 0)) / questions.length) * 100}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 px-4 py-5 max-w-2xl mx-auto w-full space-y-5">

        {/* Заголовок параграфа */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="parchment-card p-4 text-center"
        >
          <h1
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink)', fontSize: '20px', fontWeight: 800 }}
          >
            {para.title}
          </h1>
          <button
            type="button"
            onClick={handleOpenParagraphInTextbook}
            className="btn-brutal-secondary mt-3 px-3 py-2 text-xs sm:text-sm"
          >
            📖 Читать этот § в учебнике
          </button>
        </motion.div>

        {/* Карта событий */}
        {para.mapMarkers && (para.mapMarkers as { lat: number; lng: number; name: string; description: string }[]).length > 0 && (
          <EventMap markers={para.mapMarkers as { lat: number; lng: number; name: string; description: string }[]} />
        )}

        {/* Блок вопроса */}
        <AnimatePresence mode="wait">
          <motion.div
            key={questionIndex}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* "Ты знал?" */}
            <AnimatePresence>
              {showFunFact && funFact && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{
                    background: 'var(--yellow-light)',
                    border: '2.5px solid var(--border-color)',
                    borderRadius: '14px',
                    padding: '10px 14px',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--ink)', fontWeight: 800, letterSpacing: '0.08em' }}>
                    ✨ ТЫ ЗНАЛ?
                  </span>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--ink)', marginTop: 4, lineHeight: 1.5 }}>
                    {funFact}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Вопрос */}
            <div
              style={{
                background: 'var(--indigo)',
                border: '2.5px solid var(--border-color)',
                borderRadius: '14px',
                padding: '16px',
                position: 'relative',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.7)',
                    letterSpacing: '0.1em',
                    fontWeight: 800,
                    background: 'rgba(0,0,0,0.2)',
                    padding: '2px 8px',
                    borderRadius: '6px',
                  }}
                >
                  ВОПРОС {questionIndex + 1}
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
                style={{ fontFamily: 'var(--font-heading)', color: '#FFFFFF', fontSize: '18px', lineHeight: 1.6, fontWeight: 600 }}
              >
                {currentQuestion}
              </p>
            </div>

            {/* Если нет результата — показываем ввод */}
            {!result && (
              <div className="space-y-3">
                <HintDisplay hint={hintText} level={hintLevel} />
                <VoiceInput onSubmit={handleAnswerSubmit} disabled={isEvaluating} />

                {isEvaluating && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-4"
                  >
                    <div style={{ fontSize: 28 }}>🤔</div>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--ink-muted)', marginTop: 8, fontWeight: 600 }}>
                      Проверяю твой ответ...
                    </p>
                  </motion.div>
                )}

                {evalError && !isEvaluating && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      background: 'var(--yellow-light)',
                      border: '2.5px solid var(--border-color)',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      textAlign: 'center',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--ink)', fontWeight: 700 }}>
                      Не удалось проверить ответ. Попробуй ещё раз.
                    </p>
                    <button
                      onClick={() => setEvalError(false)}
                      style={{
                        marginTop: 8,
                        fontFamily: 'var(--font-body)',
                        fontSize: '12px',
                        color: 'var(--indigo)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 800,
                        textDecoration: 'underline',
                      }}
                    >
                      Попробовать снова
                    </button>
                  </motion.div>
                )}
              </div>
            )}

            {/* Результат */}
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

      <TextbookModal />
    </div>
  )
}
