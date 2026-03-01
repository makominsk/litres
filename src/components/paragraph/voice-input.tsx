'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSpeechRecognition } from '@/hooks/use-speech-recognition'

interface VoiceInputProps {
  onSubmit: (text: string) => void
  disabled?: boolean
}

export function VoiceInput({ onSubmit, disabled }: VoiceInputProps) {
  const { isListening, transcript, isSupported, start, stop, reset } = useSpeechRecognition()
  const [textValue, setTextValue] = useState('')
  const [mode, setMode] = useState<'voice' | 'text'>(isSupported ? 'voice' : 'text')

  const currentAnswer = mode === 'voice' ? transcript : textValue

  function handleSubmit() {
    if (!currentAnswer.trim()) return
    onSubmit(currentAnswer.trim())
    reset()
    setTextValue('')
  }

  function handleVoiceToggle() {
    if (isListening) {
      stop()
    } else {
      reset()
      start()
    }
  }

  return (
    <div className="space-y-3">
      {/* Переключатель режима */}
      <div className="flex gap-2">
        {isSupported && (
          <button
            onClick={() => setMode('voice')}
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
        )}
        <button
          onClick={() => { setMode('text'); stop() }}
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

      {/* Голосовой режим */}
      {mode === 'voice' && (
        <div className="space-y-3">
          <div className="flex flex-col items-center gap-3">
            {/* Кнопка микрофона */}
            <motion.button
              onClick={handleVoiceToggle}
              disabled={disabled}
              whileTap={{ scale: 0.95 }}
              className={isListening ? 'mic-pulsing' : ''}
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: isListening
                  ? 'var(--terracotta)'
                  : 'var(--parchment-dark)',
                border: `2px solid ${isListening ? 'var(--terracotta-dark)' : 'var(--parchment-deep)'}`,
                fontSize: 28,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                transition: 'background 0.2s, border-color 0.2s',
              }}
            >
              {isListening ? '⏹️' : '🎙️'}
            </motion.button>
            <p
              style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-muted)' }}
              className="text-xs"
            >
              {isListening ? 'Говори... нажми ещё раз чтобы остановить' : 'Нажми и говори'}
            </p>
          </div>

          {/* Транскрипт */}
          <AnimatePresence>
            {transcript && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                  background: 'var(--parchment-dark)',
                  border: '1.5px solid var(--terracotta)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  fontFamily: 'var(--font-body)',
                  color: 'var(--ink)',
                  fontSize: '14px',
                  lineHeight: 1.5,
                }}
              >
                {transcript}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Текстовый режим */}
      {mode === 'text' && (
        <textarea
          value={textValue}
          onChange={(e) => setTextValue(e.target.value)}
          placeholder="Напиши свой ответ здесь..."
          rows={3}
          disabled={disabled}
          style={{
            width: '100%',
            background: 'var(--parchment-dark)',
            border: '1.5px solid var(--parchment-deep)',
            borderRadius: '10px',
            fontFamily: 'var(--font-body)',
            color: 'var(--ink)',
            padding: '10px 14px',
            fontSize: '14px',
            resize: 'vertical',
            outline: 'none',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--terracotta)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--parchment-deep)')}
        />
      )}

      {/* Кнопка отправить */}
      <button
        onClick={handleSubmit}
        disabled={disabled || !currentAnswer.trim()}
        className="btn-terracotta w-full py-3 text-sm font-bold"
        style={{
          fontFamily: 'var(--font-body)',
          opacity: disabled || !currentAnswer.trim() ? 0.5 : 1,
          cursor: disabled || !currentAnswer.trim() ? 'not-allowed' : 'pointer',
        }}
      >
        Проверить ответ →
      </button>
    </div>
  )
}
