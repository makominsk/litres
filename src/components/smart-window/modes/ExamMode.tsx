'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, CheckCircle, XCircle, RotateCcw, Loader2, ChevronRight, Lightbulb, Mic, Square } from 'lucide-react'
import type { ExamQuestion } from '@/app/api/generate-exam/route'
import textbookData from '@/data/textbook.json'

interface Props {
  initialSectionId?: string
  initialParagraphIds?: number[]
}

interface Section {
  id: string
  title: string
  paragraphs: number[]
}

interface QuestionState {
  answer: string
  submitted: boolean
  isCorrect: boolean | null
  explanation: string
  showHint: boolean
}

const SECTIONS = (textbookData as { sections: Section[] }).sections

function ParagraphSelector({
  onStart,
}: {
  onStart: (paragraphIds: number[], sectionId?: string) => void
}) {
  const [mode, setMode] = useState<'section' | 'paragraphs'>('section')
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [selectedParagraphs, setSelectedParagraphs] = useState<number[]>([])

  function toggleParagraph(id: number) {
    setSelectedParagraphs((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const sectionColor: Record<string, string> = {
    'ancient-greece': 'var(--indigo)',
    'ancient-rome': '#0E7490',
    'germanic-slavic': '#1B6CA8',
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <div className="space-y-1">
        <h2 className="font-bold text-[var(--ink)]">Выбери что проверим</h2>
        <p className="text-xs text-[var(--ink-muted)]">
          Выбери раздел целиком или конкретные параграфы
        </p>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-2">
        {[
          { key: 'section', label: 'По разделу' },
          { key: 'paragraphs', label: 'Параграфы' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setMode(t.key as 'section' | 'paragraphs')}
            className={`flex-1 py-1.5 text-sm font-bold rounded-xl border-2 border-[var(--ink)] transition-colors ${
              mode === t.key ? 'text-white' : 'bg-[var(--bg-dark)] text-[var(--ink)]'
            }`}
            style={mode === t.key ? { background: '#065F46' } : undefined}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Section selection */}
      {mode === 'section' && (
        <div className="space-y-2">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSection(s.id)}
              className={`w-full p-3 rounded-xl border-2 border-[var(--ink)] text-left transition-all ${
                selectedSection === s.id ? 'text-white' : 'bg-white text-[var(--ink)] hover:opacity-80'
              }`}
              style={{
                background: selectedSection === s.id ? sectionColor[s.id] : undefined,
                boxShadow: '3px 3px 0px var(--ink)',
              }}
            >
              <p className="font-bold text-sm">{s.title}</p>
              <p className="text-xs opacity-70">{s.paragraphs.length} параграфов</p>
            </button>
          ))}
          <button
            onClick={() => selectedSection && onStart([], selectedSection)}
            disabled={!selectedSection}
            className="w-full py-2.5 bg-[var(--yellow)] border-2 border-[var(--ink)] rounded-xl font-bold text-sm disabled:opacity-40"
            style={{ boxShadow: '3px 3px 0px var(--ink)' }}
          >
            Начать зачёт по разделу →
          </button>
        </div>
      )}

      {/* Paragraph selection */}
      {mode === 'paragraphs' && (
        <div className="space-y-3">
          {SECTIONS.map((s) => (
            <div key={s.id} className="space-y-1.5">
              <p
                className="text-xs font-bold uppercase tracking-wide px-1"
                style={{ color: sectionColor[s.id] }}
              >
                {s.title}
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                {s.paragraphs.map((id) => (
                  <button
                    key={id}
                    onClick={() => toggleParagraph(id)}
                    className={`h-9 rounded-lg border-2 border-[var(--ink)] text-sm font-bold transition-colors ${
                      selectedParagraphs.includes(id)
                        ? 'text-white'
                        : 'bg-white text-[var(--ink)] hover:opacity-80'
                    }`}
                    style={{
                      background: selectedParagraphs.includes(id) ? sectionColor[s.id] : undefined,
                    }}
                  >
                    §{id}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button
            onClick={() => selectedParagraphs.length > 0 && onStart(selectedParagraphs)}
            disabled={selectedParagraphs.length === 0}
            className="w-full py-2.5 bg-[var(--yellow)] border-2 border-[var(--ink)] rounded-xl font-bold text-sm disabled:opacity-40"
            style={{ boxShadow: '3px 3px 0px var(--ink)' }}
          >
            Начать зачёт ({selectedParagraphs.length} §) →
          </button>
        </div>
      )}
    </div>
  )
}

export function ExamMode({ initialSectionId, initialParagraphIds }: Props) {
  const hasInitialSelection = Boolean(initialSectionId || (initialParagraphIds && initialParagraphIds.length > 0))
  const [phase, setPhase] = useState<'setup' | 'loading' | 'quiz' | 'results'>(
    hasInitialSelection ? 'loading' : 'setup'
  )
  const [questions, setQuestions] = useState<ExamQuestion[]>([])
  const [current, setCurrent] = useState(0)
  const [states, setStates] = useState<Record<string, QuestionState>>({})
  const [loadError, setLoadError] = useState('')
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const didAutoLoadRef = useRef(false)

  const loadQuestions = useCallback(
    async (paragraphIds: number[], sectionId?: string) => {
      setPhase('loading')
      setLoadError('')
      setQuestions([])
      setCurrent(0)
      setStates({})

      try {
        const res = await fetch('/api/generate-exam', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paragraphIds, sectionId, count: 8 }),
        })
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        setQuestions(data.questions ?? [])
        setPhase('quiz')
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Ошибка загрузки вопросов')
        setPhase('setup')
      }
    },
    []
  )

  // Auto-load once when mode opens with preselected params from the assistant.
  useEffect(() => {
    if (didAutoLoadRef.current || !hasInitialSelection) return
    didAutoLoadRef.current = true
    loadQuestions(initialParagraphIds ?? [], initialSectionId)
  }, [hasInitialSelection, initialParagraphIds, initialSectionId, loadQuestions])

  async function submitAnswer(q: ExamQuestion, answer: string) {
    if (states[q.id]?.submitted) return

    // For multiple choice — instant evaluation (normalize to handle minor GPT phrasing mismatches)
    if (q.type === 'multiple') {
      const norm = (s: string) => s.toLowerCase().replace(/[.,!?]/g, '').trim()
      const isCorrect = norm(answer) === norm(q.correctAnswer)
      setStates((prev) => ({
        ...prev,
        [q.id]: {
          answer,
          submitted: true,
          isCorrect,
          explanation: isCorrect
            ? `Верно! ${q.correctAnswer}`
            : `Правильный ответ: ${q.correctAnswer}`,
          showHint: false,
        },
      }))
      return
    }

    // For open/date/term — AI evaluation
    setStates((prev) => ({
      ...prev,
      [q.id]: { answer, submitted: true, isCorrect: null, explanation: '', showHint: false },
    }))

    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q.question,
          studentAnswer: answer,
          paragraphTitle: q.paragraphTitle,
          paragraphContent: `Правильный ответ: ${q.correctAnswer}`,
        }),
      })
      const data = await res.json()
      setStates((prev) => ({
        ...prev,
        [q.id]: {
          ...prev[q.id],
          isCorrect: data.isCorrect,
          explanation: data.explanation,
        },
      }))
    } catch {
      setStates((prev) => ({
        ...prev,
        [q.id]: {
          ...prev[q.id],
          isCorrect: false,
          explanation: `Правильный ответ: ${q.correctAnswer}`,
        },
      }))
    }
  }

  function goNext() {
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1)
    } else {
      const correctCount = Object.values(states).filter((s) => s.isCorrect).length
      setScore({ correct: correctCount, total: questions.length })
      setPhase('results')
    }
  }

  const q = questions[current]
  const state = q ? states[q.id] : undefined
  const isEvaluating = state?.submitted && state.isCorrect === null

  return (
    <div className="flex flex-col h-full">
      {/* Setup */}
      {phase === 'setup' && (
        <>
          {loadError && (
            <div className="p-3 bg-[var(--pink-light)] border-b-2 border-[var(--ink)] text-sm text-[var(--ink)]">
              {loadError}
            </div>
          )}
          <ParagraphSelector onStart={loadQuestions} />
        </>
      )}

      {/* Loading */}
      {phase === 'loading' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6">
          <Loader2 size={32} className="animate-spin" style={{ color: '#065F46' }} />
          <p className="text-sm font-bold text-[var(--ink)]">Составляю вопросы...</p>
          <p className="text-xs text-[var(--ink-muted)]">Клио читает параграфы и придумывает задания</p>
        </div>
      )}

      {/* Quiz */}
      {phase === 'quiz' && q && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Progress bar */}
          <div className="px-3 pt-3 pb-2">
            <div className="flex justify-between text-xs text-[var(--ink-muted)] mb-1">
              <span>Вопрос {current + 1} из {questions.length}</span>
              <span>{q.paragraphTitle}</span>
            </div>
            <div className="h-2 bg-[var(--bg-dark)] rounded-full border border-[var(--ink)] overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: '#065F46' }}
                initial={false}
                animate={{ width: `${((current + 1) / questions.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {/* Question card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={q.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="brutal-card p-3 space-y-3"
              >
                <div className="flex items-start gap-2">
                  <span className="text-xs px-2 py-0.5 text-white rounded-full border border-[var(--ink)] shrink-0 mt-0.5" style={{ background: '#065F46' }}>
                    {q.type === 'open' ? 'Открытый' : q.type === 'multiple' ? 'Выбор' : q.type === 'date' ? 'Дата' : 'Термин'}
                  </span>
                  <p className="text-sm font-bold text-[var(--ink)] leading-snug">{q.question}</p>
                </div>

                {/* Hint button */}
                {q.hint && !state?.submitted && (
                  <button
                    onClick={() =>
                      setStates((prev) => ({
                        ...prev,
                        [q.id]: { ...(prev[q.id] ?? { answer: '', submitted: false, isCorrect: null, explanation: '' }), showHint: true },
                      }))
                    }
                    className="flex items-center gap-1 text-xs text-[var(--yellow-dark)] hover:underline"
                  >
                    <Lightbulb size={12} /> Подсказка
                  </button>
                )}
                {state?.showHint && q.hint && (
                  <p className="text-xs bg-[var(--yellow-light)] border border-[var(--ink)] rounded-lg px-2 py-1.5">
                    {q.hint}
                  </p>
                )}

                {/* Multiple choice */}
                {q.type === 'multiple' && q.options && (
                  <div className="grid grid-cols-1 gap-2">
                    {q.options.map((opt) => {
                      const chosen = state?.answer === opt && state.submitted
                      const isRight = state?.submitted && opt === q.correctAnswer
                      const isWrong = chosen && !isRight
                      return (
                        <button
                          key={opt}
                          onClick={() => !state?.submitted && submitAnswer(q, opt)}
                          disabled={state?.submitted}
                          className={`px-3 py-2 rounded-xl border-2 border-[var(--ink)] text-sm text-left transition-all ${
                            isRight
                              ? 'bg-[#D1FAE5] border-[#065F46]'
                              : isWrong
                                ? 'bg-[var(--pink-light)] border-[var(--pink-dark)]'
                                : state?.submitted
                                  ? 'opacity-50 bg-[var(--bg-dark)]'
                                  : 'bg-white hover:bg-[var(--bg-dark)]'
                          }`}
                        >
                          {opt}
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Open/date/term input */}
                {q.type !== 'multiple' && !state?.submitted && (
                  <OpenAnswer
                    onSubmit={(ans) => submitAnswer(q, ans)}
                    disabled={!!isEvaluating}
                  />
                )}

                {/* Result */}
                {state?.submitted && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-xl border-2 space-y-1 ${
                      state.isCorrect === null
                        ? 'bg-[var(--bg-dark)] border-[var(--ink)]'
                        : state.isCorrect
                          ? 'bg-[#D1FAE5] border-[#065F46]'
                          : 'bg-[var(--pink-light)] border-[var(--pink-dark)]'
                    }`}
                  >
                    {state.isCorrect === null ? (
                      <p className="text-xs flex items-center gap-1">
                        <Loader2 size={12} className="animate-spin" /> Проверяю...
                      </p>
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5">
                          {state.isCorrect ? (
                            <CheckCircle size={14} className="text-[#065F46]" />
                          ) : (
                            <XCircle size={14} className="text-[var(--pink-dark)]" />
                          )}
                          <span className="text-xs font-bold">
                            {state.isCorrect ? 'Правильно!' : 'Не совсем...'}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed">{state.explanation}</p>
                      </>
                    )}
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Next button */}
          <div className="p-3 border-t-2 border-[var(--ink)] bg-white">
            <button
              onClick={goNext}
              disabled={!state?.submitted || isEvaluating}
              className="w-full py-2.5 text-white border-2 border-[var(--ink)] rounded-xl font-bold text-sm disabled:opacity-40 flex items-center justify-center gap-1"
              style={{ background: '#065F46', boxShadow: '3px 3px 0px var(--ink)' }}
            >
              {current < questions.length - 1 ? (
                <><ChevronRight size={16} /> Следующий вопрос</>
              ) : (
                <><GraduationCap size={16} /> Завершить зачёт</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {phase === 'results' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4 text-center">
          <div
            className="w-20 h-20 rounded-2xl border-2 border-[var(--ink)] flex items-center justify-center text-3xl"
            style={{
              background:
                score.correct / score.total >= 0.8
                  ? '#D1FAE5'
                  : score.correct / score.total >= 0.5
                    ? 'var(--yellow-light)'
                    : 'var(--pink-light)',
              boxShadow: '5px 5px 0px var(--ink)',
            }}
          >
            {score.correct / score.total >= 0.8 ? '🏆' : score.correct / score.total >= 0.5 ? '📚' : '💪'}
          </div>

          <div>
            <p className="text-2xl font-black text-[var(--ink)]">
              {score.correct}/{score.total}
            </p>
            <p className="text-sm text-[var(--ink-muted)]">
              {Math.round((score.correct / score.total) * 100)}% правильных ответов
            </p>
          </div>

          <p className="text-sm text-[var(--ink)]">
            {score.correct / score.total >= 0.8
              ? 'Отличный результат! Ты отлично знаешь эту тему!'
              : score.correct / score.total >= 0.5
                ? 'Хороший результат! Повтори параграфы где были ошибки.'
                : 'Не беда! Перечитай параграфы и попробуй ещё раз.'}
          </p>

          <button
            onClick={() => setPhase('setup')}
            className="flex items-center gap-2 px-4 py-2.5 bg-[var(--yellow)] border-2 border-[var(--ink)] rounded-xl font-bold text-sm"
            style={{ boxShadow: '3px 3px 0px var(--ink)' }}
          >
            <RotateCcw size={16} /> Пройти ещё раз
          </button>
        </div>
      )}
    </div>
  )
}

function OpenAnswer({ onSubmit, disabled }: { onSubmit: (answer: string) => void; disabled: boolean }) {
  const [value, setValue] = useState('')
  const [recState, setRecState] = useState<'idle' | 'recording' | 'transcribing'>('idle')
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  async function toggleRecording() {
    if (recState === 'recording') {
      mediaRef.current?.stop()
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      mediaRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        setRecState('transcribing')
        try {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
          const form = new FormData()
          form.append('audio', blob, 'recording.webm')
          const res = await fetch('/api/transcribe', { method: 'POST', body: form })
          const data = await res.json()
          if (data.text) setValue((prev) => (prev ? prev + ' ' + data.text : data.text))
        } catch {
          // ignore transcription errors
        } finally {
          setRecState('idle')
        }
      }

      recorder.start()
      setRecState('recording')
    } catch {
      setRecState('idle')
    }
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Напиши или надиктуй свой ответ..."
          rows={3}
          disabled={disabled || recState !== 'idle'}
          className="w-full px-3 py-2 pr-10 border-2 border-[var(--ink)] rounded-xl text-sm resize-none focus:outline-none focus:border-[var(--indigo)] bg-[var(--bg)]"
        />
        <button
          onClick={toggleRecording}
          disabled={disabled || recState === 'transcribing'}
          title={recState === 'recording' ? 'Остановить запись' : 'Надиктовать ответ'}
          className="absolute bottom-2 right-2 w-7 h-7 rounded-lg border-2 border-[var(--ink)] flex items-center justify-center transition-colors disabled:opacity-40"
          style={{
            background: recState === 'recording' ? '#DC2626' : '#065F46',
            boxShadow: '1.5px 1.5px 0px var(--ink)',
          }}
        >
          {recState === 'transcribing' ? (
            <Loader2 size={13} className="text-white animate-spin" />
          ) : recState === 'recording' ? (
            <Square size={11} className="text-white fill-white" />
          ) : (
            <Mic size={13} className="text-white" />
          )}
        </button>
      </div>
      {recState === 'recording' && (
        <p className="text-xs text-[#DC2626] flex items-center gap-1 animate-pulse">
          <span className="w-2 h-2 bg-[#DC2626] rounded-full inline-block" />
          Запись... нажми кнопку чтобы остановить
        </p>
      )}
      <button
        onClick={() => onSubmit(value)}
        disabled={!value.trim() || disabled || recState !== 'idle'}
        className="w-full py-2 text-white border-2 border-[var(--ink)] rounded-xl font-bold text-sm disabled:opacity-40"
        style={{ background: '#065F46', boxShadow: '3px 3px 0px var(--ink)' }}
      >
        Проверить
      </button>
    </div>
  )
}
