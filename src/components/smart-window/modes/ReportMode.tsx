'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Image, Copy, Check, RotateCcw, ExternalLink } from 'lucide-react'
import type { ImageItem, SSEEvent } from '@/types/smart-window'
import { toPlainAssistantText } from '@/lib/plain-text'

interface Props {
  initialTopic?: string
  chatContext?: string // Context from discussion to seed the report
}

interface ReportSection {
  id: string
  title: string
  content: string
}

// Извлекает ключевые слова из темы, убирая инструкции вроде "15 предложений на тему"
function extractKeywords(text: string): string {
  return text
    .replace(/\d+\s*(предложений|слов|абзацев|страниц)/gi, '')
    .replace(/\b(напиши|сделай|составь|расскажи|реферат|доклад|на тему|про|о том|краткий|подробный)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

export function ReportMode({ initialTopic, chatContext }: Props) {
  const [topic, setTopic] = useState(initialTopic ?? '')
  const [isGenerating, setIsGenerating] = useState(false)
  const [sections, setSections] = useState<ReportSection[]>([])
  const [images, setImages] = useState<ImageItem[]>([])
  const [streamingText, setStreamingText] = useState('')
  const [phase, setPhase] = useState<'idle' | 'generating' | 'done'>('idle')
  const [copied, setCopied] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-start if topic provided from discussion
  useEffect(() => {
    if (initialTopic && phase === 'idle') {
      generateReport(initialTopic)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [streamingText, sections])

  async function generateReport(reportTopic: string) {
    if (!reportTopic.trim() || isGenerating) return

    setIsGenerating(true)
    setPhase('generating')
    setSections([])
    setImages([])
    setStreamingText('')

    // Search images in parallel — используем ключевые слова, не инструкцию
    const imageQuery = extractKeywords(reportTopic)
    fetch('/api/image-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: imageQuery, limit: 6 }),
    })
      .then((r) => r.json())
      .then((data) => setImages(data.images ?? []))
      .catch(() => {})

    // Generate report text via agent-chat
    const systemContext = chatContext
      ? `Контекст из предыдущей беседы: ${chatContext.slice(0, 500)}\n\n`
      : ''

    const prompt = `${systemContext}Напиши структурированный реферат на тему: "${reportTopic}".

Структура:
1. Введение (2-3 абзаца)
2. Основная часть (3-4 раздела с подзаголовками)
3. Заключение (1-2 абзаца)

Требования: язык понятный для 5 класса, факты точные, каждый раздел с подзаголовком, объём ~500-700 слов.`

    try {
      const res = await fetch('/api/agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          mode: 'report',
        }),
      })

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6)) as SSEEvent

            if (event.type === 'text') {
              fullText += event.content
              setStreamingText(fullText)
            } else if (event.type === 'done') {
              // Parse sections from the generated text
              const parsed = parseReportSections(fullText)
              setSections(parsed)
              setStreamingText('')
              setPhase('done')
            }
          } catch {
            // skip
          }
        }
      }
    } catch {
      setStreamingText('Ошибка генерации реферата. Попробуй ещё раз.')
      setPhase('done')
    } finally {
      setIsGenerating(false)
    }
  }

  function parseReportSections(text: string): ReportSection[] {
    // Split by markdown headers (## or ### or bold **Title**)
    const lines = text.split('\n')
    const result: ReportSection[] = []
    let currentTitle = ''
    let currentContent: string[] = []
    let idx = 0

    for (const line of lines) {
      const headerMatch = line.match(/^#{1,3}\s+(.+)/) || line.match(/^\*\*(.+)\*\*$/)
      if (headerMatch) {
        if (currentContent.length > 0) {
          result.push({
            id: `s-${idx++}`,
            title: currentTitle || 'Введение',
            content: currentContent.join('\n').trim(),
          })
        }
        currentTitle = headerMatch[1]
        currentContent = []
      } else if (line.trim()) {
        currentContent.push(line)
      }
    }

    if (currentContent.length > 0) {
      result.push({
        id: `s-${idx}`,
        title: currentTitle || 'Текст',
        content: currentContent.join('\n').trim(),
      })
    }

    // If no sections found, put everything in one block
    if (result.length === 0 && text.trim()) {
      result.push({ id: 's-0', title: 'Реферат', content: text.trim() })
    }

    return result
  }

  function copyAll() {
    const text = sections.map((s) => `${s.title}\n\n${s.content}`).join('\n\n---\n\n')
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Topic input */}
      {phase === 'idle' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[var(--yellow)] border-2 border-[var(--ink)] flex items-center justify-center" style={{ boxShadow: '4px 4px 0px var(--ink)' }}>
            <FileText size={28} />
          </div>
          <h2 className="text-lg font-bold text-[var(--ink)]">Напишем реферат!</h2>
          <p className="text-sm text-[var(--ink-muted)] text-center">
            Введи тему — я найду иллюстрации и напишу структурированный текст
          </p>
          <div className="w-full space-y-3">
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && generateReport(topic)}
              placeholder="Например: Олимпийские игры в Древней Греции"
              className="w-full px-3 py-2 border-2 border-[var(--ink)] rounded-xl text-sm focus:outline-none focus:border-[var(--indigo)] bg-[var(--bg)]"
              autoFocus
            />
            <button
              onClick={() => generateReport(topic)}
              disabled={!topic.trim()}
              className="w-full py-2.5 bg-[var(--indigo)] text-white border-2 border-[var(--ink)] rounded-xl font-bold text-sm disabled:opacity-40 hover:bg-[var(--indigo-dark)] transition-colors"
              style={{ boxShadow: '4px 4px 0px var(--ink)' }}
            >
              Написать реферат
            </button>
          </div>
          <p className="text-xs text-[var(--ink-muted)]">Примеры тем:</p>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {['Афинская демократия', 'Гладиаторы Рима', 'Боги Греции', 'Строительство пирамид'].map((t) => (
              <button
                key={t}
                onClick={() => setTopic(t)}
                className="text-xs px-2 py-1 bg-[var(--bg-dark)] border border-[var(--ink)] rounded-full hover:bg-[var(--yellow-light)] transition-colors"
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Generating */}
      {phase === 'generating' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Images loading */}
          <AnimatePresence>
            {images.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                <p className="text-xs font-bold text-[var(--ink-muted)] uppercase tracking-wide flex items-center gap-1">
                  <Image size={12} /> Иллюстрации
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {images.map((img, i) => (
                    <a key={i} href={img.source} target="_blank" rel="noopener noreferrer">
                      <img
                        src={img.thumb}
                        alt={img.title}
                        className="w-full h-20 object-cover rounded-lg border-2 border-[var(--ink)] hover:opacity-80"
                      />
                    </a>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Streaming text — без markdown-значков */}
          <div className="brutal-card p-3 text-sm leading-relaxed whitespace-pre-wrap text-[var(--ink)]">
            {toPlainAssistantText(streamingText)}
            <span className="inline-block w-1.5 h-4 bg-[var(--indigo)] ml-1 animate-pulse rounded-sm" />
          </div>
          <div ref={bottomRef} />
        </div>
      )}

      {/* Done */}
      {phase === 'done' && (
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* Images */}
          {images.length > 0 && (
            <div className="p-3 space-y-2 border-b-2 border-[var(--ink)]">
              <p className="text-xs font-bold text-[var(--ink-muted)] uppercase tracking-wide flex items-center gap-1">
                <Image size={12} /> Иллюстрации
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {images.map((img, i) => (
                  <a key={i} href={img.source} target="_blank" rel="noopener noreferrer" title={img.title}>
                    <img
                      src={img.thumb}
                      alt={img.title}
                      className="w-full h-20 object-cover rounded-lg border-2 border-[var(--ink)] hover:opacity-80 transition-opacity"
                    />
                    <p className="text-xs text-[var(--ink-muted)] truncate mt-0.5">{img.title}</p>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Sections */}
          <div className="p-3 space-y-3">
            {sections.map((s) => (
              <div key={s.id} className="space-y-1">
                {s.title !== 'Текст' && s.title !== 'Реферат' && (
                  <h3 className="font-bold text-sm text-[var(--indigo)] border-b border-[var(--indigo)] pb-0.5">
                    {toPlainAssistantText(s.title)}
                  </h3>
                )}
                <p className="text-sm leading-relaxed text-[var(--ink)] whitespace-pre-wrap">
                  {toPlainAssistantText(s.content)}
                </p>
              </div>
            ))}
          </div>
          <div ref={bottomRef} />
        </div>
      )}

      {/* Bottom actions */}
      {phase === 'done' && (
        <div className="p-3 border-t-2 border-[var(--ink)] bg-white flex gap-2">
          <button
            onClick={copyAll}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-[var(--yellow)] border-2 border-[var(--ink)] rounded-xl text-sm font-bold hover:bg-[var(--yellow-dark)] transition-colors"
            style={{ boxShadow: '3px 3px 0px var(--ink)' }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Скопировано!' : 'Скопировать'}
          </button>
          <button
            onClick={() => { setPhase('idle'); setSections([]); setImages([]); setTopic('') }}
            className="flex items-center gap-1 px-3 py-2 bg-[var(--bg-dark)] border-2 border-[var(--ink)] rounded-xl text-sm hover:bg-[var(--bg)] transition-colors"
            style={{ boxShadow: '3px 3px 0px var(--ink)' }}
          >
            <RotateCcw size={14} /> Новый
          </button>
          <a
            href={`https://ru.wikipedia.org/w/index.php?search=${encodeURIComponent(extractKeywords(topic))}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-2 bg-[var(--sky)] border-2 border-[var(--ink)] rounded-xl text-sm hover:opacity-80 transition-opacity"
            style={{ boxShadow: '3px 3px 0px var(--ink)' }}
          >
            <ExternalLink size={14} /> Wiki
          </a>
        </div>
      )}
    </div>
  )
}
