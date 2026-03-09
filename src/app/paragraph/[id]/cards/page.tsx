'use client'
import { use, useState, useMemo } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Header } from '@/components/ui/header'
import textbook from '@/data/textbook.json'

interface Card {
  front: string
  back: string
  type: 'term' | 'date'
}

export default function CardsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const paragraphId = parseInt(id)
  if (isNaN(paragraphId) || paragraphId < 1 || paragraphId > 31) notFound()

  const para = textbook.paragraphs[id as keyof typeof textbook.paragraphs]
  if (!para) notFound()

  const cards = useMemo<Card[]>(() => {
    const result: Card[] = []
    const terms = (para as { terms?: { term: string; definition: string }[] }).terms
    const dates = (para as { dates?: { date: string; event: string }[] }).dates

    if (terms) {
      for (const t of terms) {
        result.push({ front: t.term, back: t.definition, type: 'term' })
      }
    }
    if (dates) {
      for (const d of dates) {
        result.push({ front: d.date, back: d.event, type: 'date' })
      }
    }
    return result
  }, [para])

  const [current, setCurrent] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown] = useState(0)

  if (cards.length === 0) {
    return (
      <div className="min-h-dvh flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-lg mx-auto w-full text-center">
          <div style={{ fontSize: 56 }} className="mb-4">🃏</div>
          <h1
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink)' }}
            className="text-xl font-extrabold mb-2"
          >
            Карточек пока нет
          </h1>
          <p
            style={{ color: 'var(--ink-muted)', fontFamily: 'var(--font-body)' }}
            className="text-sm mb-6 font-semibold"
          >
            Для этого параграфа нет терминов и дат.
          </p>
          <Link href={`/paragraph/${paragraphId}`}>
            <button className="btn-terracotta px-8 py-3 text-sm">
              ← Назад к параграфу
            </button>
          </Link>
        </main>
      </div>
    )
  }

  const card = cards[current]
  const isDone = current >= cards.length

  function handleFlip() {
    setFlipped((f) => !f)
  }

  function handleKnow() {
    setKnown((k) => k + 1)
    goNext()
  }

  function handleDontKnow() {
    goNext()
  }

  function goNext() {
    setFlipped(false)
    setCurrent((c) => c + 1)
  }

  function goPrevManual() {
    setFlipped(false)
    setCurrent((c) => Math.max(c - 1, 0))
  }

  function goNextManual() {
    setFlipped(false)
    setCurrent((c) => Math.min(c + 1, cards.length - 1))
  }

  function handleRestart() {
    setCurrent(0)
    setFlipped(false)
    setKnown(0)
  }

  // Экран завершения
  if (isDone) {
    const pct = Math.round((known / cards.length) * 100)
    return (
      <div className="min-h-dvh flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-lg mx-auto w-full text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', duration: 0.6 }}
            className="space-y-5"
          >
            <div style={{ fontSize: 64 }}>🃏</div>
            <h1
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink)', fontSize: 24, fontWeight: 900 }}
            >
              Карточки пройдены!
            </h1>
            <p
              style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-muted)', fontSize: 14, fontWeight: 700 }}
            >
              Знаю: {known} из {cards.length} ({pct}%)
            </p>

            <div
              className="h-4 rounded-full overflow-hidden w-full"
              style={{ background: 'var(--bg-dark)', border: '2px solid var(--border-color)' }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: pct >= 80 ? '#059669' : pct >= 50 ? 'var(--yellow)' : 'var(--pink)' }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>

            <div className="flex flex-col gap-3 w-full pt-2">
              <button onClick={handleRestart} className="btn-terracotta w-full py-3.5 text-sm">
                🔁 Пройти ещё раз
              </button>
              <Link href={`/paragraph/${paragraphId}`}>
                <button className="btn-brutal-secondary w-full py-3 text-sm">
                  ← Назад к параграфу
                </button>
              </Link>
            </div>
          </motion.div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <Header />

      {/* Progress */}
      <div style={{ background: 'var(--card-bg)', borderBottom: '2.5px solid var(--border-color)' }}>
        <div className="max-w-lg mx-auto px-4 py-2 flex items-center gap-3">
          <Link
            href={`/paragraph/${paragraphId}`}
            style={{
              color: 'var(--ink)',
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              fontWeight: 800,
              background: 'var(--yellow-light)',
              border: '2px solid var(--border-color)',
              borderRadius: '8px',
              padding: '2px 8px',
              boxShadow: '2px 2px 0px var(--shadow-color)',
            }}
          >
            ←
          </Link>
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--ink-muted)', fontWeight: 700 }}>
                Карточки · {current + 1} / {cards.length}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '11px',
                  fontWeight: 800,
                  color: 'var(--ink)',
                  background: 'var(--yellow-light)',
                  borderRadius: '6px',
                  padding: '1px 6px',
                }}
              >
                ✓ {known}
              </span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-dark)', border: '1.5px solid var(--border-color)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'var(--indigo)' }}
                animate={{ width: `${((current + 1) / cards.length) * 100}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full flex flex-col items-center justify-center">
        {/* Тип карточки */}
        <div
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '11px',
            fontWeight: 800,
            color: card.type === 'term' ? 'var(--indigo)' : 'var(--yellow-dark)',
            letterSpacing: '0.1em',
            marginBottom: 12,
          }}
        >
          {card.type === 'term' ? '📚 ТЕРМИН' : '📅 ДАТА'}
        </div>

        {/* Карточка с flip */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${current}-${flipped}`}
            initial={{ rotateY: 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: -90, opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={handleFlip}
            style={{
              width: '100%',
              minHeight: 200,
              background: flipped ? '#D1FAE5' : 'var(--indigo)',
              border: '2.5px solid var(--border-color)',
              borderRadius: '18px',
              padding: '28px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: flipped ? '5px 5px 0px #065F46' : 'var(--shadow-md)',
              textAlign: 'center',
              userSelect: 'none',
            }}
          >
            {!flipped ? (
              <>
                <p style={{
                  fontFamily: 'var(--font-heading)',
                  color: '#FFFFFF',
                  fontSize: '22px',
                  fontWeight: 800,
                  lineHeight: 1.4,
                }}>
                  {card.front}
                </p>
                <p style={{
                  fontFamily: 'var(--font-body)',
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: '11px',
                  fontWeight: 700,
                  marginTop: 16,
                }}>
                  Нажми, чтобы перевернуть
                </p>
              </>
            ) : (
              <p style={{
                fontFamily: 'var(--font-body)',
                color: 'var(--ink)',
                fontSize: '16px',
                fontWeight: 600,
                lineHeight: 1.6,
              }}>
                {card.back}
              </p>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Навигация по карточкам */}
        <div className="flex items-center justify-between w-full mt-3">
          <button
            onClick={goPrevManual}
            disabled={current === 0}
            className="btn-brutal-secondary px-4 py-2 text-sm"
            style={{ opacity: current === 0 ? 0.5 : 1 }}
          >
            ← Назад
          </button>
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '12px',
              fontWeight: 800,
              color: 'var(--ink-muted)',
            }}
          >
            {current + 1} / {cards.length}
          </span>
          <button
            onClick={goNextManual}
            disabled={current === cards.length - 1}
            className="btn-brutal-secondary px-4 py-2 text-sm"
            style={{ opacity: current === cards.length - 1 ? 0.5 : 1 }}
          >
            Вперёд →
          </button>
        </div>

        {/* Кнопки Знаю / Не знаю */}
        <div className="flex gap-3 w-full mt-5">
          <button
            onClick={handleDontKnow}
            className="btn-brutal-secondary flex-1 py-3 text-sm"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            Не знаю
          </button>
          <button
            onClick={handleKnow}
            className="btn-terracotta flex-1 py-3 text-sm"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            Знаю!
          </button>
        </div>
      </main>
    </div>
  )
}
