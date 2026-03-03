'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HISTORY_FACTS } from '@/data/history-facts'

function getNextIndex(currentIndex: number) {
  if (HISTORY_FACTS.length <= 1) return currentIndex
  let nextIndex = currentIndex
  while (nextIndex === currentIndex) {
    nextIndex = Math.floor(Math.random() * HISTORY_FACTS.length)
  }
  return nextIndex
}

export function RandomHistoryFact() {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * HISTORY_FACTS.length))
  const fact = HISTORY_FACTS[index]

  return (
    <div
      className="p-4 sm:p-5"
      style={{
        background: 'var(--card-bg)',
        border: '2.5px solid var(--border-color)',
        borderRadius: '1rem',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            style={{
              color: 'var(--indigo)',
              fontFamily: 'var(--font-body)',
              letterSpacing: '0.08em',
            }}
            className="text-[11px] font-extrabold mb-1"
          >
            НЕОБЫЧНЫЙ ПРОВЕРЕННЫЙ ФАКТ
          </p>
          <h3
            style={{ color: 'var(--ink)', fontFamily: 'var(--font-heading)' }}
            className="text-lg font-extrabold"
          >
            История удивляет
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setIndex((prev) => getNextIndex(prev))}
          className="btn-terracotta shrink-0 px-3 py-2 text-xs"
        >
          Новый факт
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={index}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          style={{
            color: 'var(--ink-light)',
            fontFamily: 'var(--font-body)',
            lineHeight: 1.6,
          }}
          className="text-sm mt-3 font-semibold"
        >
          {fact.text}
        </motion.p>
      </AnimatePresence>

      <a
        href={fact.sourceUrl}
        target="_blank"
        rel="noreferrer"
        style={{ color: 'var(--indigo-dark)', fontFamily: 'var(--font-body)' }}
        className="inline-block mt-3 text-xs font-extrabold underline decoration-2 underline-offset-2"
      >
        Источник: {fact.sourceLabel}
      </a>
    </div>
  )
}
