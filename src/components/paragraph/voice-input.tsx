'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/components/ui/toast'

interface VoiceInputProps {
  onSubmit: (text: string) => void
  disabled?: boolean
}

type RecordingState = 'idle' | 'recording' | 'transcribing'

function getStoredMode(): 'voice' | 'text' {
  if (typeof window === 'undefined') return 'voice'
  return (localStorage.getItem('input-mode') as 'voice' | 'text') ?? 'voice'
}

export function VoiceInput({ onSubmit, disabled }: VoiceInputProps) {
  const { showToast } = useToast()
  const [editableText, setEditableText] = useState('')
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'voice' | 'text'>('voice')
  const [highlight, setHighlight] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  // Восстановить режим из localStorage
  useEffect(() => {
    setMode(getStoredMode())
  }, [])

  const startRecording = useCallback(async () => {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      // Тактильный feedback при начале записи
      navigator.vibrate?.(50)

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        setRecordingState('transcribing')

        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const formData = new FormData()
        formData.append('audio', blob)

        try {
          const res = await fetch('/api/transcribe', { method: 'POST', body: formData })
          const data = await res.json()
          if (data.text) {
            setEditableText(data.text)
            // Подсветка textarea после транскрибации
            setHighlight(true)
            setTimeout(() => setHighlight(false), 1500)
          } else {
            setError('Не удалось распознать речь. Попробуй ещё раз.')
            showToast('Не удалось распознать речь', 'error')
          }
        } catch {
          setError('Ошибка при распознавании. Попробуй ещё раз.')
          showToast('Ошибка сети при распознавании', 'error')
        } finally {
          setRecordingState('idle')
        }
      }

      mediaRecorder.start()
      setRecordingState('recording')
    } catch {
      setError('Нет доступа к микрофону. Разреши доступ в браузере.')
      showToast('Нет доступа к микрофону', 'error')
    }
  }, [showToast])

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop()
  }, [])

  function handleVoiceToggle() {
    if (recordingState === 'recording') {
      stopRecording()
    } else if (recordingState === 'idle') {
      startRecording()
    }
  }

  function handleSubmit() {
    if (!editableText.trim()) return
    onSubmit(editableText.trim())
    setEditableText('')
  }

  function switchMode(m: 'voice' | 'text') {
    if (recordingState === 'recording') stopRecording()
    setMode(m)
    setError('')
    localStorage.setItem('input-mode', m)
  }

  // Ctrl+Enter / Cmd+Enter для отправки
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  const isRecording = recordingState === 'recording'
  const isTranscribing = recordingState === 'transcribing'
  const busyNotRecording = (isTranscribing || !!disabled)

  return (
    <div className="space-y-3">
      {/* Переключатель режимов */}
      <div className="flex justify-center gap-2">
        {(['voice', 'text'] as const).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            style={{
              fontFamily: 'var(--font-body)',
              background: mode === m ? 'var(--indigo)' : 'var(--card-bg)',
              color: mode === m ? '#FFFFFF' : 'var(--ink)',
              border: '2.5px solid var(--border-color)',
              borderRadius: '10px',
              padding: '6px 18px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: mode === m ? '2px 2px 0px var(--shadow-color)' : 'var(--shadow-sm)',
              transition: 'all 0.1s',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {m === 'voice' ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                </svg>
                Голос
              </>
            ) : '✏️ Текст'}
          </button>
        ))}
      </div>

      {/* Кнопка микрофона */}
      {mode === 'voice' && (
        <div className="flex flex-col items-center gap-2 py-1">
          <motion.button
            onClick={handleVoiceToggle}
            disabled={busyNotRecording}
            whileTap={{ scale: 0.93 }}
            animate={isRecording ? { scale: [1, 1.07, 1], transition: { repeat: Infinity, duration: 1.1 } } : {}}
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: isRecording
                ? 'var(--pink)'
                : isTranscribing
                ? 'var(--yellow-light)'
                : 'var(--card-bg)',
              border: '3px solid var(--border-color)',
              cursor: busyNotRecording ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.5 : 1,
              transition: 'background 0.2s, border-color 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isRecording ? '4px 4px 0px #9F1239' : 'var(--shadow-sm)',
              color: isRecording ? '#FFFFFF' : 'var(--ink)',
            }}
          >
            {isTranscribing
              ? <span className="brutal-spinner--dark brutal-spinner" />
              : isRecording
              ? <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="2"/></svg>
              : <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
            }
          </motion.button>

          {/* Состояние под кнопкой */}
          <div style={{ textAlign: 'center', minHeight: 36 }}>
            {isTranscribing ? (
              <div className="flex flex-col items-center gap-1">
                <div className="sound-bars">
                  <span /><span /><span /><span />
                </div>
                <p style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-muted)', fontSize: 11, fontWeight: 600 }}>
                  Распознаю речь<span className="loading-dots" />
                </p>
              </div>
            ) : (
              <p style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-muted)', fontSize: 11, lineHeight: 1.4, fontWeight: 600 }}>
                {isRecording
                  ? '🔴 Говори… когда закончишь, нажми Стоп'
                  : 'Нажми Старт для записи ответа. Когда всё скажешь, нажми Стоп'}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Ошибка */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--pink-dark)', margin: 0, fontWeight: 700 }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Текстовое поле */}
      <div className="relative">
        <textarea
          value={editableText}
          onChange={(e) => setEditableText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            mode === 'voice'
              ? 'Нажми на микрофон и говори — ответ появится здесь...'
              : 'Напиши свой ответ здесь...'
          }
          rows={4}
          disabled={disabled || isTranscribing}
          className={highlight ? 'textarea-highlight' : ''}
          style={{
            width: '100%',
            background: highlight ? 'var(--yellow-light)' : 'var(--card-bg)',
            border: `2.5px solid var(--border-color)`,
            borderRadius: '12px',
            fontFamily: 'var(--font-body)',
            color: 'var(--ink)',
            padding: '10px 14px',
            fontSize: '14px',
            lineHeight: 1.6,
            resize: 'vertical',
            outline: 'none',
            transition: 'box-shadow 0.15s, background-color 0.5s',
            opacity: disabled || isTranscribing ? 0.6 : 1,
            boxShadow: editableText ? 'var(--shadow-sm)' : 'inset 2px 2px 0px rgba(0,0,0,0.05)',
            fontWeight: 500,
          }}
        />
        {/* Счётчик символов + подсказка Ctrl+Enter */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: 'var(--font-body)',
            fontSize: '10px',
            color: 'var(--ink-muted)',
            marginTop: 4,
            padding: '0 4px',
            fontWeight: 600,
          }}
        >
          <span>{editableText.length > 0 ? `${editableText.length} симв.` : ''}</span>
          {mode === 'text' && editableText.trim() && (
            <span>Ctrl+Enter для отправки</span>
          )}
        </div>
      </div>

      {/* Кнопка отправки */}
      <button
        onClick={handleSubmit}
        disabled={disabled || !editableText.trim() || isTranscribing}
        className="btn-terracotta w-full py-3 text-sm"
        style={{
          opacity: disabled || !editableText.trim() || isTranscribing ? 0.5 : 1,
          cursor: disabled || !editableText.trim() || isTranscribing ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        {disabled ? (
          <>
            <span className="brutal-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
            Проверяю ответ
            <span className="loading-dots" />
          </>
        ) : (
          'Проверить ответ →'
        )}
      </button>
    </div>
  )
}
