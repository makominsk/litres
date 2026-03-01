'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSpeechRecognition } from '@/hooks/use-speech-recognition'

interface VoiceInputProps {
  onSubmit: (text: string) => void
  disabled?: boolean
}

export function VoiceInput({ onSubmit, disabled }: VoiceInputProps) {
  const { isListening, transcript, isSupported, start, stop, reset } = useSpeechRecognition()
  const [editableText, setEditableText] = useState('')
  const [mode, setMode] = useState<'voice' | 'text'>('voice')

  // Как только пришёл транскрипт — вставляем в поле
  useEffect(() => {
    if (transcript) {
      setEditableText(transcript)
    }
  }, [transcript])

  function handleSubmit() {
    if (!editableText.trim()) return
    onSubmit(editableText.trim())
    reset()
    setEditableText('')
  }

  function handleVoiceToggle() {
    if (isListening) {
      stop()
    } else {
      setEditableText('')
      reset()
      start()
    }
  }

  function switchMode(m: 'voice' | 'text') {
    if (isListening) stop()
    setMode(m)
  }

  return (
    <div className="space-y-3">

      {/* Переключатель — показываем только если браузер поддерживает голос */}
      {isSupported && (
        <div className="flex gap-2">
          <button
            onClick={() => switchMode('voice')}
            style={{
              fontFamily: 'var(--font-body)',
              background: mode === 'voice' ? 'var(--terracotta)' : 'var(--parchment-dark)',
              color: mode === 'voice' ? '#FDF6EC' : 'var(--ink-muted)',
              border: '1.5px solid var(--parchment-deep)',
              borderRadius: '8px',
              padding: '6px 14px',
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
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            ✏️ Текст
          </button>
        </div>
      )}

      {/* Кнопка микрофона — только в голосовом режиме */}
      {mode === 'voice' && isSupported && (
        <div className="flex items-center gap-3">
          <motion.button
            onClick={handleVoiceToggle}
            disabled={disabled}
            whileTap={{ scale: 0.95 }}
            className={isListening ? 'mic-pulsing' : ''}
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: isListening ? 'var(--terracotta)' : 'var(--parchment-dark)',
              border: `2px solid ${isListening ? '#a03a20' : 'var(--parchment-deep)'}`,
              fontSize: 24,
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.5 : 1,
              flexShrink: 0,
              transition: 'background 0.2s, border-color 0.2s',
            }}
          >
            {isListening ? '⏹️' : '🎙️'}
          </motion.button>
          <p style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-muted)', fontSize: 12, lineHeight: 1.4 }}>
            {isListening
              ? '🔴 Говори... нажми ещё раз чтобы остановить'
              : 'Нажми на микрофон и говори'}
          </p>
        </div>
      )}

      {/* Единое текстовое поле — и для голоса, и для текста */}
      <textarea
        value={editableText}
        onChange={(e) => setEditableText(e.target.value)}
        placeholder={
          mode === 'voice' && isSupported
            ? 'Нажми на микрофон и говори — ответ появится здесь...'
            : 'Напиши свой ответ здесь...'
        }
        rows={4}
        disabled={disabled}
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
        }}
        onFocus={(e) => (e.target.style.borderColor = 'var(--terracotta)')}
        onBlur={(e) => {
          e.target.style.borderColor = editableText ? 'var(--terracotta)' : 'var(--parchment-deep)'
        }}
      />

      {/* Кнопка отправки */}
      <button
        onClick={handleSubmit}
        disabled={disabled || !editableText.trim()}
        className="btn-terracotta w-full py-3 text-sm font-bold"
        style={{
          fontFamily: 'var(--font-body)',
          opacity: disabled || !editableText.trim() ? 0.5 : 1,
          cursor: disabled || !editableText.trim() ? 'not-allowed' : 'pointer',
        }}
      >
        Проверить ответ →
      </button>
    </div>
  )
}
