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
    result.score >= 80 ? 'var(--olive)' :
    result.score >= 50 ? 'var(--gold)' :
    '#F59E0B'

  const scoreBg =
    result.score >= 80 ? 'rgba(39,174,96,0.1)' :
    result.score >= 50 ? 'rgba(245,166,35,0.12)' :
    'rgba(245,158,11,0.1)'

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="space-y-4"
    >
      {/* Оценка */}
      <div
        style={{
          background: scoreBg,
          border: `1.5px solid ${scoreColor}`,
          borderRadius: '12px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div style={{ fontSize: 28 }}>
          {result.score >= 80 ? '🌟' : result.score >= 50 ? '👍' : '💪'}
        </div>
        <div>
          <div
            style={{ fontFamily: 'var(--font-heading)', color: scoreColor, fontSize: '15px', fontWeight: 700 }}
          >
            {result.score >= 80 ? 'Отлично!' : result.score >= 50 ? 'Хорошо!' : 'Ты на верном пути!'}
          </div>
          <div
            style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-muted)', fontSize: '11px' }}
          >
            {result.score} / 100 баллов
          </div>
        </div>
      </div>

      {/* Кнопка озвучки — крупная, заметная */}
      <motion.button
        onClick={() => isPlaying ? stop() : play(result.explanation)}
        disabled={isLoading}
        animate={isLoading ? {} : isPlaying ? {} : { scale: [1, 1.03, 1] }}
        transition={{ repeat: isPlaying ? 0 : Infinity, duration: 2 }}
        style={{
          width: '100%',
          padding: '14px 16px',
          background: isError
            ? 'rgba(239,68,68,0.08)'
            : isPlaying
            ? 'rgba(67,97,238,0.12)'
            : 'linear-gradient(135deg, rgba(67,97,238,0.08), rgba(67,97,238,0.04))',
          border: `1.5px solid ${isError ? '#EF4444' : 'rgba(67,97,238,0.35)'}`,
          borderRadius: '12px',
          cursor: isLoading ? 'wait' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          fontFamily: 'var(--font-body)',
          fontSize: '14px',
          fontWeight: 600,
          color: isError ? '#EF4444' : 'var(--sky)',
        }}
      >
        <span style={{ fontSize: 20 }}>
          {isLoading ? '⏳' : isPlaying ? '⏸️' : isError ? '⚠️' : '🔊'}
        </span>
        {isLoading
          ? 'Загружаю аудио...'
          : isPlaying
          ? 'Пауза'
          : isError
          ? 'Ошибка — нажми ещё раз'
          : 'Слушать пояснение учителя'}
      </motion.button>

      {/* Пояснение */}
      <div className="parchment-card p-4">
        <p
          style={{
            fontFamily: 'var(--font-body)',
            color: 'var(--ink)',
            fontSize: '14px',
            lineHeight: 1.7,
          }}
        >
          {result.explanation}
        </p>
      </div>

      {/* Интересный факт */}
      {result.funFact && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            background: 'linear-gradient(135deg, rgba(201,151,58,0.12), rgba(201,151,58,0.05))',
            border: '1.5px solid rgba(201,151,58,0.4)',
            borderRadius: '12px',
            padding: '12px 16px',
          }}
        >
          <div style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--gold)', fontWeight: 700, marginBottom: 4 }}>
            💡 Знаешь ли ты?
          </div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--ink)', lineHeight: 1.6 }}>
            {result.funFact}
          </p>
        </motion.div>
      )}

      {/* Современная аналогия */}
      {result.modernAnalogy && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            background: 'rgba(67,97,238,0.06)',
            border: '1.5px solid rgba(67,97,238,0.25)',
            borderRadius: '12px',
            padding: '12px 16px',
          }}
        >
          <div style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--sky)', fontWeight: 700, marginBottom: 4 }}>
            🔗 Сравни с сегодняшним днём
          </div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--ink)', lineHeight: 1.6 }}>
            {result.modernAnalogy}
          </p>
        </motion.div>
      )}

      {/* Мнемоника */}
      {result.mnemonic && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          style={{
            background: 'linear-gradient(135deg, #4527A0, #5E35D6)',
            borderRadius: '12px',
            padding: '12px 16px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontFamily: 'var(--font-body)', fontSize: '10px', color: 'rgba(255,255,255,0.6)', marginBottom: 6, letterSpacing: '0.1em' }}>
            🧠 КАК ЗАПОМНИТЬ
          </div>
          <p style={{ fontFamily: 'var(--font-heading)', fontSize: '14px', color: 'var(--gold-light)', fontStyle: 'italic', lineHeight: 1.5 }}>
            «{result.mnemonic}»
          </p>
        </motion.div>
      )}

      {/* Кнопка далее */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={onNext}
        className="btn-terracotta w-full py-3.5 text-sm font-bold"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        {isLast ? '🏁 Завершить параграф' : 'Следующий вопрос →'}
      </motion.button>
    </motion.div>
  )
}
