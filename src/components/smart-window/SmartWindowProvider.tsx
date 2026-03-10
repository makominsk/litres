'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { SmartWindow } from './SmartWindow'
import type { SmartMode } from '@/types/smart-window'

/**
 * Global floating button + SmartWindow drawer.
 * Rendered in the root layout so it's available on every page.
 */
export function SmartWindowProvider() {
  const [isOpen, setIsOpen] = useState(false)
  const [initialMode] = useState<SmartMode>('discussion')

  return (
    <>
      {/* Floating trigger button */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', delay: 0.5 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 px-4 py-3 bg-[var(--indigo)] text-white border-2 border-[var(--ink)] rounded-2xl font-bold text-sm shadow-none hover:bg-[var(--indigo-dark)] transition-colors"
          style={{ boxShadow: '5px 5px 0px var(--ink)' }}
          aria-label="Открыть умного помощника Клио"
        >
          <Sparkles size={18} />
          <span className="hidden sm:inline">Клио</span>
        </motion.button>
      )}

      {/* SmartWindow drawer */}
      <SmartWindow
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        initialMode={initialMode}
      />
    </>
  )
}
