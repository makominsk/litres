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
    <div className="space-y-3">
      {/* Переключатель режимов — по центру */}
      <div className="flex justify-center gap-2">
        <button
          onClick={() => switchMode('voice')}
          style={{
            fontFamily: 'var(--font-body)',
            background: mode === 'voice' ? 'var(--terracotta)' : 'var(--parchment-dark)',
            color: mode === 'voice' ? '#FDF6EC' : 'var(--ink-muted)',
            border: '1.5px solid var(--parchment-deep)',
            borderRadius: '8px',
            padding: '6px 18px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          🎙️ Голос
        </button>
        <button
          onClick={() => switchMode('text')}
          style={{
            fontFamily: 'var(--font-body)',
            background: mode === 'text' ? 'var(--terracotta)' : 'var(--parchment-dark)',
            color: mode === 'text' ? '#FDF6EC' : 'var(--ink-muted)',
            border: '1.5px solid var(--parchment-deep)',
            borderRadius: '8px',
            padding: '6px 18px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          ✏️ Текст
        </button>
      </div>

      {/* Кнопка микрофона — по центру */}
      {mode === 'voice' && (
        <div className="flex flex-col items-center gap-2 py-1">
          <motion.button
            onClick={handleVoiceToggle}
            disabled={busyNotRecording}
            whileTap={{ scale: 0.93 }}
            animate={isRecording ? { scale: [1, 1.07, 1], transition: { repeat: Infinity, duration: 1.1 } } : {}}
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: isRecording
                ? 'var(--terracotta)'
                : isTranscribing
                ? 'rgba(201,151,58,0.25)'
                : 'var(--parchment-dark)',
              border: `2px solid ${isRecording ? '#a03a20' : 'var(--parchment-deep)'}`,
              fontSize: 28,
              cursor: busyNotRecording ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.5 : 1,
              transition: 'background 0.2s, border-color 0.2s',
            }}
          >
            {isTranscribing ? '⏳' : isRecording ? '⏹️' : '🎙️'}
          </motion.button>
          <p style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-muted)', fontSize: 11, textAlign: 'center', lineHeight: 1.4 }}>
            {isRecording
              ? '🔴 Говори… нажми ещё раз чтобы остановить'
              : isTranscribing
              ? 'Распознаю речь...'
              : 'Нажми и говори по-русски'}
          </p>
        </div>
      )}

      {/* Ошибка */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--terracotta)', margin: 0 }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Текстовое поле */}
      <textarea
        value={editableText}
        onChange={(e) => setEditableText(e.target.value)}
        placeholder={
          mode === 'voice'
            ? 'Нажми на микрофон и говори — ответ появится здесь...'
            : 'Напиши свой ответ здесь...'
        }
        rows={4}
        disabled={disabled || isTranscribing}
        style={{
          width: '100%',
          background: 'var(--parchment-dark)',
          border: `1.5px solid ${editableText ? 'var(--terracotta)' : 'var(--parchment-deep)'}`,
          borderRadius: '10px',
          fontFamily: 'var(--font-body)',
          color: 'var(--ink)',
          padding: '10px 14px',
          fontSize: '14px',
          lineHeight: 1.6,
          resize: 'vertical',
          outline: 'none',
          transition: 'border-color 0.15s',
          opacity: disabled || isTranscribing ? 0.6 : 1,
        }}
        onFocus={(e) => (e.target.style.borderColor = 'var(--terracotta)')}
        onBlur={(e) => {
          e.target.style.borderColor = editableText ? 'var(--terracotta)' : 'var(--parchment-deep)'
        }}
      />

      {/* Кнопка отправки */}
      <button
        onClick={handleSubmit}
        disabled={disabled || !editableText.trim() || isTranscribing}
        className="btn-terracotta w-full py-3 text-sm font-bold"
        style={{
          fontFamily: 'var(--font-body)',
          opacity: disabled || !editableText.trim() || isTranscribing ? 0.5 : 1,
          cursor: disabled || !editableText.trim() || isTranscribing ? 'not-allowed' : 'pointer',
        }}
      >
        Проверить ответ →
      </button>
    </div>
  )
}
