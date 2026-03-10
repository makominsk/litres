'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MessageCircle, FileText, GraduationCap, Globe, Sparkles } from 'lucide-react'
import type { SmartMode, ModeParams } from '@/types/smart-window'
import { DiscussionMode } from './modes/DiscussionMode'
import { ReportMode } from './modes/ReportMode'
import { ExamMode } from './modes/ExamMode'
import { SearchMode } from './modes/SearchMode'

// ─── Mode config ──────────────────────────────────────────────────────────────

const MODES: Array<{
  id: SmartMode
  label: string
  shortLabel: string
  icon: React.ElementType
  color: string
  bg: string
}> = [
  {
    id: 'discussion',
    label: 'Беседа',
    shortLabel: 'Беседа',
    icon: MessageCircle,
    color: '#4338CA',
    bg: '#EDE9FE',
  },
  {
    id: 'report',
    label: 'Реферат',
    shortLabel: 'Реферат',
    icon: FileText,
    color: '#D97706',
    bg: '#FDE68A',
  },
  {
    id: 'exam',
    label: 'Зачёт',
    shortLabel: 'Зачёт',
    icon: GraduationCap,
    color: '#065F46',
    bg: '#D1FAE5',
  },
  {
    id: 'search',
    label: 'Поиск',
    shortLabel: 'Поиск',
    icon: Globe,
    color: '#FF69B4',
    bg: '#FFE4F0',
  },
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface SmartWindowProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: SmartMode
  paragraphTitle?: string
  paragraphId?: number
  sectionTitle?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SmartWindow({
  isOpen,
  onClose,
  initialMode = 'discussion',
  paragraphTitle,
  paragraphId,
  sectionTitle,
}: SmartWindowProps) {
  const [mode, setMode] = useState<SmartMode>(initialMode)
  const [modeParams, setModeParams] = useState<ModeParams>({})
  // Increment key forces full remount when switching modes from agent
  const [modeKey, setModeKey] = useState(0)

  const handleModeSwitch = useCallback((target: string, params: ModeParams) => {
    setMode(target as SmartMode)
    setModeParams(params)
    setModeKey((k) => k + 1)
  }, [])

  const handleManualModeSwitch = (newMode: SmartMode) => {
    if (newMode !== mode) {
      setMode(newMode)
      setModeParams({})
      setModeKey((k) => k + 1)
    }
  }

  const activeMode = MODES.find((m) => m.id === mode) ?? MODES[0]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 z-40"
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[420px] z-50 flex flex-col bg-[var(--bg)] border-l-2 border-[var(--ink)]"
            style={{ boxShadow: '-8px 0 0 var(--ink)' }}
          >
            {/* Header */}
            <div
              className="flex items-center gap-2 px-3 py-3 border-b-2 border-[var(--ink)]"
              style={{ background: activeMode.bg }}
            >
              <div
                className="w-8 h-8 rounded-xl border-2 border-[var(--ink)] flex items-center justify-center shrink-0"
                style={{ background: activeMode.color, boxShadow: '2px 2px 0px var(--ink)' }}
              >
                <activeMode.icon size={16} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-[var(--ink)] leading-none text-sm flex items-center gap-1">
                  Клио <Sparkles size={12} className="text-[var(--yellow-dark)]" />
                </p>
                <p className="text-xs text-[var(--ink-muted)]">{activeMode.label}</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl border-2 border-[var(--ink)] bg-white flex items-center justify-center hover:bg-[var(--bg-dark)] transition-colors shrink-0"
                style={{ boxShadow: '2px 2px 0px var(--ink)' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Mode tabs */}
            <div className="flex border-b-2 border-[var(--ink)] bg-white">
              {MODES.map((m) => {
                const Icon = m.icon
                const active = mode === m.id
                return (
                  <button
                    key={m.id}
                    onClick={() => handleManualModeSwitch(m.id)}
                    className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-[10px] font-bold border-r-2 last:border-r-0 border-[var(--ink)] transition-colors ${
                      active ? 'text-white' : 'text-[var(--ink)] hover:opacity-80'
                    }`}
                    style={{ background: active ? m.color : undefined }}
                  >
                    <Icon size={14} />
                    {m.shortLabel}
                  </button>
                )
              })}
            </div>

            {/* Mode content */}
            <div className="flex-1 overflow-hidden min-h-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${mode}-${modeKey}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="h-full flex flex-col"
                >
                  {mode === 'discussion' && (
                    <DiscussionMode
                      paragraphTitle={paragraphTitle}
                      paragraphId={paragraphId}
                      sectionTitle={sectionTitle}
                      initialMessage={modeParams.initialQuery}
                      onModeSwitch={handleModeSwitch}
                    />
                  )}

                  {mode === 'report' && (
                    <ReportMode
                      initialTopic={modeParams.topic}
                    />
                  )}

                  {mode === 'exam' && (
                    <ExamMode
                      initialSectionId={modeParams.sectionId}
                      initialParagraphIds={modeParams.paragraphIds}
                    />
                  )}

                  {mode === 'search' && (
                    <SearchMode
                      initialQuery={modeParams.initialQuery}
                      onModeSwitch={handleModeSwitch}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
