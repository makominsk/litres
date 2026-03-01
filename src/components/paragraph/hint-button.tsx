'use client'
import { motion, AnimatePresence } from 'framer-motion'

interface HintButtonProps {
  paragraphId: number
  questionIndex: number
  currentLevel: number
  onHintUsed: (level: number) => void
  // compact mode: renders only the small trigger button; fires onReceiveHint with result
  compact?: boolean
  onReceiveHint?: (text: string) => void
  loading?: boolean
  onSetLoading?: (v: boolean) => void
}

const levelLabels: Record<1 | 2 | 3, string> = {
  1: 'Подсказка',
  2: 'Сильнее',
  3: 'Ответ',
}

export function HintButton({
  paragraphId, questionIndex, currentLevel, onHintUsed,
  compact, onReceiveHint, loading, onSetLoading,
}: HintButtonProps) {
  const nextLevel = Math.min(currentLevel + 1, 3) as 1 | 2 | 3
  const isMaxed = currentLevel >= 3

  async function requestHint() {
    if (isMaxed || loading) return
    onSetLoading?.(true)
    try {
      const res = await fetch('/api/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paragraphId, questionIndex, hintLevel: nextLevel }),
      })
      const data = await res.json()
      if (!data.hint) return
      onHintUsed(nextLevel)
      onReceiveHint?.(data.hint)
    } catch (err) {
      console.error(err)
    } finally {
      onSetLoading?.(false)
    }
  }

  if (compact) {
    return (
      <button
        onClick={requestHint}
        disabled={isMaxed || loading}
        title={isMaxed ? 'Все подсказки использованы' : levelLabels[nextLevel]}
        style={{
          fontFamily: 'var(--font-body)',
          background: isMaxed ? 'rgba(253,246,236,0.08)' : 'rgba(201,151,58,0.25)',
          border: '1px solid rgba(201,151,58,0.45)',
          borderRadius: '20px',
          padding: '4px 10px',
          fontSize: '11px',
          fontWeight: 600,
          color: isMaxed ? 'rgba(253,246,236,0.35)' : 'rgba(253,246,236,0.9)',
          cursor: isMaxed || loading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          whiteSpace: 'nowrap',
          transition: 'all 0.15s',
        }}
      >
        <span>{loading ? '⏳' : '💡'}</span>
        {!isMaxed && <span>{levelLabels[nextLevel]}</span>}
        {isMaxed && <span>✓</span>}
      </button>
    )
  }

  // Full mode (legacy, not used in main flow)
  return null
}

// Отдельный компонент для отображения текста подсказки
export function HintDisplay({ hint, level }: { hint: string; level: number }) {
  return (
    <AnimatePresence>
      {hint && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          style={{
            background: 'rgba(201,151,58,0.1)',
            border: '1.5px solid rgba(201,151,58,0.35)',
            borderRadius: '10px',
            padding: '12px 14px',
            overflow: 'hidden',
          }}
        >
          <div style={{
            fontFamily: 'var(--font-body)',
            fontSize: '11px',
            color: 'var(--gold)',
            fontWeight: 700,
            marginBottom: 6,
          }}>
            💡 Подсказка {level} из 3
          </div>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '13px',
            color: 'var(--ink)',
            lineHeight: 1.6,
            margin: 0,
          }}>
            {hint}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
