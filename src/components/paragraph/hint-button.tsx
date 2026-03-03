'use client'
import { motion, AnimatePresence } from 'framer-motion'

interface HintButtonProps {
  paragraphId: number
  questionIndex: number
  currentLevel: number
  onHintUsed: (level: number) => void
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
          background: isMaxed ? 'rgba(255,255,255,0.1)' : 'var(--yellow)',
          border: '2px solid var(--border-color)',
          borderRadius: '10px',
          padding: '4px 10px',
          fontSize: '11px',
          fontWeight: 800,
          color: isMaxed ? 'rgba(255,255,255,0.4)' : 'var(--ink)',
          cursor: isMaxed || loading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          whiteSpace: 'nowrap',
          transition: 'all 0.1s',
          boxShadow: isMaxed ? 'none' : '2px 2px 0px var(--shadow-color)',
        }}
      >
        <span>{loading ? '⏳' : '💡'}</span>
        {!isMaxed && <span>{levelLabels[nextLevel]}</span>}
        {isMaxed && <span>✓</span>}
      </button>
    )
  }

  return null
}

export function HintDisplay({ hint, level }: { hint: string; level: number }) {
  return (
    <AnimatePresence>
      {hint && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          style={{
            background: 'var(--yellow-light)',
            border: '2.5px solid var(--border-color)',
            borderRadius: '12px',
            padding: '12px 14px',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{
            fontFamily: 'var(--font-body)',
            fontSize: '11px',
            color: 'var(--ink)',
            fontWeight: 800,
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
            fontWeight: 500,
          }}>
            {hint}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
