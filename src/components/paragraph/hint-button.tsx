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
        className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all"
        style={{
          background: isMaxed ? 'rgba(255,255,255,0.08)' : 'rgba(245,166,35,0.2)',
          border: '1px solid rgba(245,166,35,0.35)',
          color: isMaxed ? 'rgba(255,255,255,0.3)' : 'var(--amber-light)',
          cursor: isMaxed || loading ? 'not-allowed' : 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        {loading ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin" aria-hidden="true">
            <path d="M21 12a9 9 0 11-6.219-8.56" />
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M9 21c0 .5.4 1 1 1h4c.6 0 1-.5 1-1v-1H9v1zm3-19C8.1 2 5 5.1 5 9c0 2.4 1.2 4.5 3 5.7V17c0 .5.4 1 1 1h6c.6 0 1-.5 1-1v-2.3c1.8-1.3 3-3.4 3-5.7 0-3.9-3.1-7-7-7z" />
          </svg>
        )}
        {!isMaxed && <span>{levelLabels[nextLevel]}</span>}
        {isMaxed && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="20,6 9,17 4,12" />
          </svg>
        )}
      </button>
    )
  }

  return null
}

// Hint display component
export function HintDisplay({ hint, level }: { hint: string; level: number }) {
  return (
    <AnimatePresence>
      {hint && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="rounded-xl p-4 overflow-hidden"
          style={{
            background: 'rgba(245,166,35,0.06)',
            border: '1.5px solid rgba(245,166,35,0.15)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: 'rgba(245,166,35,0.15)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--amber)" aria-hidden="true">
                <path d="M9 21c0 .5.4 1 1 1h4c.6 0 1-.5 1-1v-1H9v1zm3-19C8.1 2 5 5.1 5 9c0 2.4 1.2 4.5 3 5.7V17c0 .5.4 1 1 1h6c.6 0 1-.5 1-1v-2.3c1.8-1.3 3-3.4 3-5.7 0-3.9-3.1-7-7-7z" />
              </svg>
            </div>
            <span className="text-[11px] font-extrabold tracking-wider" style={{ color: 'var(--amber-dark)' }}>
              {'ПОДСКАЗКА '}{level}{' ИЗ 3'}
            </span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--ink)' }}>
            {hint}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
