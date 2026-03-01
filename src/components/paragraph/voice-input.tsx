'use client'
import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface VoiceInputProps {
  onSubmit: (text: string) => void
  disabled?: boolean
}

type RecordingState = 'idle' | 'recording' | 'transcribing'

export function VoiceInput({ onSubmit, disabled }: VoiceInputProps) {
  const [editableText, setEditableText] = useState('')
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'voice' | 'text'>('voice')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = useCallback(async () => {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

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
          } else {
            setError('Не удалось распознать речь. Попробуй ещё раз.')
          }
        } catch {
          setError('Ошибка при распознавании. Попробуй ещё раз.')
        } finally {
          setRecordingState('idle')
        }
      }

      mediaRecorder.start()
      setRecordingState('recording')
    } catch {
      setError('Нет доступа к микрофону. Разреши доступ в браузере.')
    }
  }, [])

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
  }

  const isRecording = recordingState === 'recording'
  const isTranscribing = recordingState === 'transcribing'
  const busyNotRecording = (isTranscribing || !!disabled)

  return (
    <div className="flex flex-col gap-3">
      {/* Mode toggle */}
      <div className="flex justify-center gap-2">
        <button
          onClick={() => switchMode('voice')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all"
          style={{
            background: mode === 'voice' ? 'var(--navy)' : '#FFFFFF',
            color: mode === 'voice' ? '#FFFFFF' : 'var(--ink-muted)',
            border: mode === 'voice' ? '1.5px solid var(--navy)' : '1.5px solid var(--cream-deep)',
            cursor: 'pointer',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
            <path d="M19 10v2a7 7 0 01-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
          {'Голос'}
        </button>
        <button
          onClick={() => switchMode('text')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all"
          style={{
            background: mode === 'text' ? 'var(--navy)' : '#FFFFFF',
            color: mode === 'text' ? '#FFFFFF' : 'var(--ink-muted)',
            border: mode === 'text' ? '1.5px solid var(--navy)' : '1.5px solid var(--cream-deep)',
            cursor: 'pointer',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
          </svg>
          {'Текст'}
        </button>
      </div>

      {/* Mic button */}
      {mode === 'voice' && (
        <div className="flex flex-col items-center gap-2 py-2">
          <motion.button
            onClick={handleVoiceToggle}
            disabled={busyNotRecording}
            whileTap={{ scale: 0.93 }}
            animate={isRecording ? { scale: [1, 1.05, 1], transition: { repeat: Infinity, duration: 1.1 } } : {}}
            className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all"
            style={{
              background: isRecording
                ? 'var(--coral)'
                : isTranscribing
                ? 'var(--cream-dark)'
                : 'var(--navy)',
              boxShadow: isRecording
                ? '0 4px 24px rgba(255,107,107,0.4)'
                : '0 4px 16px rgba(27,42,74,0.2)',
              border: 'none',
              cursor: busyNotRecording ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.5 : 1,
              color: '#FFFFFF',
            }}
          >
            {isTranscribing ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--ink-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin" aria-hidden="true">
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
            ) : isRecording ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                <path d="M19 10v2a7 7 0 01-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
              </svg>
            )}
          </motion.button>
          <p className="text-[11px] text-center leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
            {isRecording
              ? 'Говори... Нажми для остановки'
              : isTranscribing
              ? 'Распознаю речь...'
              : 'Нажми для записи ответа'}
          </p>
        </div>
      )}

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs font-semibold"
            style={{ color: 'var(--coral)' }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Text area */}
      <textarea
        value={editableText}
        onChange={(e) => setEditableText(e.target.value)}
        placeholder={
          mode === 'voice'
            ? 'Нажми на микрофон — ответ появится здесь...'
            : 'Напиши свой ответ здесь...'
        }
        rows={4}
        disabled={disabled || isTranscribing}
        className="w-full px-4 py-3 text-sm leading-relaxed rounded-xl outline-none resize-y transition-all"
        style={{
          background: '#FFFFFF',
          border: `2px solid ${editableText ? 'var(--amber)' : 'var(--cream-deep)'}`,
          color: 'var(--ink)',
          opacity: disabled || isTranscribing ? 0.6 : 1,
        }}
        onFocus={(e) => (e.target.style.borderColor = 'var(--amber)')}
        onBlur={(e) => {
          e.target.style.borderColor = editableText ? 'var(--amber)' : 'var(--cream-deep)'
        }}
      />

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={disabled || !editableText.trim() || isTranscribing}
        className="btn-primary w-full py-3.5 text-sm flex items-center justify-center gap-2"
        style={{
          opacity: disabled || !editableText.trim() || isTranscribing ? 0.4 : 1,
          cursor: disabled || !editableText.trim() || isTranscribing ? 'not-allowed' : 'pointer',
        }}
      >
        {'Проверить ответ'}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}
