'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface HintButtonProps {
  paragraphId: number
  questionIndex: number
  currentLevel: number
  onHintUsed: (level: number) => void
}

export function HintButton({ paragraphId, questionIndex, currentLevel, onHintUsed }: HintButtonProps) {
  const [hint, setHint] = useState('')
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const nextLevel = Math.min(currentLevel + 1, 3) as 1 | 2 | 3
  const isMaxed = currentLevel >= 3

  const levelLabels = {
    1: 'Лёгкая подсказка',
    2: 'Подсказка посильнее',
    3: 'Полный ответ',
  }

  async function requestHint() {
    if (isMaxed || loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paragraphId, questionIndex, hintLevel: nextLevel }),
      })
      const data = await res.json()
      setHint(data.hint)
      onHintUsed(nextLevel)
      setIsOpen(true)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={requestHint}
        disabled={isMaxed || loading}
        style={{
          fontFamily: 'var(--font-body)',
          background: isMaxed ? 'var(--parchment-dark)' : 'rgba(201,151,58,0.15)',
          border: '1.5px solid rgba(201,151,58,0.4)',
          borderRadius: '10px',
          padding: '8px 16px',
          fontSize: '12px',
          fontWeight: 600,
          color: isMaxed ? 'var(--ink-muted)' : 'var(--gold)',
          cursor: isMaxed || loading ? 'not-allowed' : 'pointer',
          opacity: isMaxed ? 0.5 : 1,
          transition: 'all 0.15s',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {loading ? '⏳' : '💡'}
        {loading ? 'Думаю...' : isMaxed ? 'Все подсказки использованы' : levelLabels[nextLevel]}
        {!isMaxed && !loading && (
          <span style={{ opacity: 0.6, fontSize: '10px' }}>({nextLevel}/3)</span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && hint && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              background: 'rgba(201,151,58,0.1)',
              border: '1.5px solid rgba(201,151,58,0.35)',
              borderRadius: '10px',
              padding: '12px 14px',
            }}
          >
            <div style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--gold)', fontWeight: 700, marginBottom: 6 }}>
              💡 Подсказка {currentLevel} из 3
            </div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--ink)', lineHeight: 1.6 }}>
              {hint}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
