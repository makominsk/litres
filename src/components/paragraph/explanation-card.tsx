'use client'
import { motion } from 'framer-motion'
import { useAudioPlayer } from '@/hooks/use-audio-player'

interface EvaluateResult {
  isCorrect: boolean
  score: number
  explanation: string
  funFact: string
  modernAnalogy: string
  mnemonic: string
}

interface ExplanationCardProps {
  result: EvaluateResult
  onNext: () => void
  isLast: boolean
}

export function ExplanationCard({ result, onNext, isLast }: ExplanationCardProps) {
  const { play, stop, isPlaying, isLoading, isError } = useAudioPlayer()

  const scoreColor =
    result.score >= 80 ? 'var(--teal)' :
    result.score >= 50 ? 'var(--amber)' :
    'var(--coral)'

  const scoreBg =
    result.score >= 80 ? 'rgba(45,212,168,0.08)' :
    result.score >= 50 ? 'rgba(245,166,35,0.08)' :
    'rgba(255,107,107,0.06)'

  const scoreBorder =
    result.score >= 80 ? 'rgba(45,212,168,0.2)' :
    result.score >= 50 ? 'rgba(245,166,35,0.2)' :
    'rgba(255,107,107,0.15)'

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="flex flex-col gap-4"
    >
      {/* Score */}
      <div
        className="rounded-xl p-4 flex items-center gap-3"
        style={{
          background: scoreBg,
          border: `1.5px solid ${scoreBorder}`,
        }}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${scoreColor}18` }}
        >
          {result.score >= 80 ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill={scoreColor} aria-hidden="true">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          ) : result.score >= 50 ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={scoreColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14 9V5a3 3 0 00-6 0v1" />
              <path d="M18 11a6.002 6.002 0 01-12 0V9h12v2z" />
              <path d="M12 17v4" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={scoreColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
          )}
        </div>
        <div>
          <div className="text-base font-extrabold" style={{ color: scoreColor }}>
            {result.score >= 80 ? 'Отлично!' : result.score >= 50 ? 'Хорошо!' : 'Ты на верном пути!'}
          </div>
          <div className="text-xs" style={{ color: 'var(--ink-muted)' }}>
            {result.score}{' / 100 баллов'}
          </div>
        </div>
      </div>

      {/* Audio player */}
      <motion.button
        onClick={() => isPlaying ? stop() : play(result.explanation)}
        disabled={isLoading}
        className="w-full p-4 rounded-xl flex items-center justify-center gap-2.5 text-sm font-bold transition-all"
        style={{
          background: isError
            ? 'rgba(255,107,107,0.06)'
            : isPlaying
            ? 'rgba(37,99,235,0.08)'
            : '#FFFFFF',
          border: isError
            ? '1.5px solid rgba(255,107,107,0.2)'
            : isPlaying
            ? '1.5px solid rgba(37,99,235,0.2)'
            : '1.5px solid var(--cream-deep)',
          cursor: isLoading ? 'wait' : 'pointer',
          color: isError ? 'var(--coral)' : isPlaying ? '#2563EB' : 'var(--navy)',
        }}
      >
        {isLoading ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin" aria-hidden="true">
            <path d="M21 12a9 9 0 11-6.219-8.56" />
          </svg>
        ) : isPlaying ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polygon points="11,5 6,9 2,9 2,15 6,15 11,19 11,5" />
            <path d="M15.54 8.46a5 5 0 010 7.07" />
            <path d="M19.07 4.93a10 10 0 010 14.14" />
          </svg>
        )}
        {isLoading
          ? 'Загружаю аудио...'
          : isPlaying
          ? 'Пауза'
          : isError
          ? 'Ошибка \u2014 нажми ещё раз'
          : 'Слушать пояснение'}
      </motion.button>

      {/* Explanation text */}
      <div className="glass-card p-4">
        <p className="text-sm leading-relaxed" style={{ color: 'var(--ink)' }}>
          {result.explanation}
        </p>
      </div>

      {/* Fun fact */}
      {result.funFact && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl p-4"
          style={{
            background: 'rgba(245,166,35,0.06)',
            border: '1.5px solid rgba(245,166,35,0.15)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,166,35,0.15)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--amber)" aria-hidden="true">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <span className="text-[11px] font-extrabold tracking-wider" style={{ color: 'var(--amber-dark)' }}>
              {'ИНТЕРЕСНЫЙ ФАКТ'}
            </span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--ink)' }}>
            {result.funFact}
          </p>
        </motion.div>
      )}

      {/* Modern analogy */}
      {result.modernAnalogy && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl p-4"
          style={{
            background: 'rgba(37,99,235,0.04)',
            border: '1.5px solid rgba(37,99,235,0.12)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(37,99,235,0.08)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
              </svg>
            </div>
            <span className="text-[11px] font-extrabold tracking-wider" style={{ color: '#2563EB' }}>
              {'СРАВНИ С СЕГОДНЯ'}
            </span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--ink)' }}>
            {result.modernAnalogy}
          </p>
        </motion.div>
      )}

      {/* Mnemonic */}
      {result.mnemonic && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl p-4 text-center"
          style={{
            background: 'linear-gradient(135deg, var(--navy) 0%, var(--navy-light) 100%)',
          }}
        >
          <div className="text-[10px] font-bold tracking-widest mb-2" style={{ color: 'var(--amber-light)' }}>
            {'КАК ЗАПОМНИТЬ'}
          </div>
          <p className="text-sm font-semibold italic leading-relaxed" style={{ color: 'var(--amber-light)' }}>
            {'\u00ab'}{result.mnemonic}{'\u00bb'}
          </p>
        </motion.div>
      )}

      {/* Next button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={onNext}
        className="btn-primary w-full py-3.5 text-sm flex items-center justify-center gap-2"
      >
        {isLast ? 'Завершить параграф' : 'Следующий вопрос'}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </motion.button>
    </motion.div>
  )
}
