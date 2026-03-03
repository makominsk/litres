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

  const scoreBg =
    result.score >= 80 ? '#D1FAE5' :
    result.score >= 50 ? 'var(--yellow-light)' :
    'var(--pink-light)'

  const scoreShadow =
    result.score >= 80 ? '3px 3px 0px #065F46' :
    result.score >= 50 ? '3px 3px 0px #92400E' :
    '3px 3px 0px #9F1239'

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
          border: '2.5px solid var(--border-color)',
          borderRadius: '14px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          boxShadow: scoreShadow,
        }}
      >
        <div style={{ fontSize: 28 }}>
          {result.score >= 80 ? '🌟' : result.score >= 50 ? '👍' : '💪'}
        </div>
        <div>
          <div
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink)', fontSize: '18px', fontWeight: 800 }}
          >
            {result.score >= 80 ? 'Отлично!' : result.score >= 50 ? 'Хорошо!' : 'Ты на верном пути!'}
          </div>
          <div
            style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-muted)', fontSize: '13px', fontWeight: 700 }}
          >
            {result.score} / 100 баллов
          </div>
        </div>
      </div>

      {/* Кнопка озвучки */}
      <motion.button
        onClick={() => isPlaying ? stop() : play(result.explanation)}
        disabled={isLoading}
        animate={isLoading ? {} : isPlaying ? {} : { scale: [1, 1.03, 1] }}
        transition={{ repeat: isPlaying ? 0 : Infinity, duration: 2 }}
        className="btn-brutal-indigo"
        style={{
          width: '100%',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          fontSize: '16px',
          cursor: isLoading ? 'wait' : 'pointer',
          opacity: isError ? 0.8 : 1,
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
            fontSize: '16px',
            lineHeight: 1.7,
            fontWeight: 500,
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
            background: 'var(--yellow-light)',
            border: '2.5px solid var(--border-color)',
            borderRadius: '14px',
            padding: '12px 16px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--ink)', fontWeight: 800, marginBottom: 4 }}>
            💡 Знаешь ли ты?
          </div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--ink)', lineHeight: 1.6, fontWeight: 500 }}>
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
            background: '#DBEAFE',
            border: '2.5px solid var(--border-color)',
            borderRadius: '14px',
            padding: '12px 16px',
            boxShadow: '3px 3px 0px #1E3A5F',
          }}
        >
          <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--ink)', fontWeight: 800, marginBottom: 4 }}>
            🔗 Сравни с сегодняшним днём
          </div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--ink)', lineHeight: 1.6, fontWeight: 500 }}>
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
            background: 'var(--indigo)',
            border: '2.5px solid var(--border-color)',
            borderRadius: '14px',
            padding: '14px 16px',
            textAlign: 'center',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginBottom: 6, letterSpacing: '0.1em', fontWeight: 800 }}>
            🧠 КАК ЗАПОМНИТЬ
          </div>
          <p style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', color: 'var(--yellow)', fontStyle: 'italic', lineHeight: 1.5, fontWeight: 700 }}>
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
        className="btn-terracotta w-full py-3.5 text-base"
      >
        {isLast ? '🏁 Завершить параграф' : 'Следующий вопрос →'}
      </motion.button>
    </motion.div>
  )
}
