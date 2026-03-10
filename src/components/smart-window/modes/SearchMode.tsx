'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Globe, ExternalLink, Image, FileText, Trash2 } from 'lucide-react'
import type { SearchSource, ImageItem, ChatMessage, SSEEvent, ModeParams } from '@/types/smart-window'
import { toPlainAssistantText } from '@/lib/plain-text'
import { useSmartWindowSearchStore } from '@/stores/smart-window-search-store'

interface Props {
  initialQuery?: string
  onModeSwitch: (target: string, params: ModeParams) => void
}

function SourceCard({ source, index }: { source: SearchSource; index: number }) {
  const domain = (() => {
    try { return new URL(source.url).hostname.replace('www.', '') } catch { return source.url }
  })()

  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-2 p-2 bg-white border-2 border-[var(--ink)] rounded-xl hover:bg-[var(--bg-dark)] transition-colors"
      style={{ boxShadow: '2px 2px 0px var(--ink)' }}
    >
      <span className="w-5 h-5 shrink-0 rounded-full bg-[var(--bg-dark)] border border-[var(--ink)] text-xs flex items-center justify-center font-bold text-[var(--ink-muted)]">
        {index + 1}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-bold text-[var(--indigo)] truncate">{source.title}</p>
        <p className="text-xs text-[var(--ink-muted)] truncate">{domain}</p>
        <p className="text-xs text-[var(--ink)] line-clamp-2 mt-0.5">{source.snippet}</p>
      </div>
      <ExternalLink size={10} className="shrink-0 text-[var(--ink-muted)] mt-0.5" />
    </a>
  )
}

export function SearchMode({ initialQuery, onModeSwitch }: Props) {
  const [query, setQuery] = useState(initialQuery ?? '')
  const { messages, hasSearched, setMessages, setHasSearched, clearSearch } = useSmartWindowSearchStore()
  const [thinking, setThinking] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const autoRunRef = useRef<string | null>(null)

  useEffect(() => {
    const prepared = initialQuery?.trim()
    if (!prepared || autoRunRef.current === prepared) return
    autoRunRef.current = prepared
    doSearch(prepared)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  async function doSearch(searchQuery: string) {
    if (!searchQuery.trim() || isLoading) return

    setIsLoading(true)
    setHasSearched(true)
    setThinking('')

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: searchQuery,
    }

    const assistantId = `a-${Date.now()}`
    const placeholder: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      isStreaming: true,
    }

    const currentMessages = useSmartWindowSearchStore.getState().messages
    setMessages([...currentMessages, userMsg, placeholder])
    setQuery('')

    const apiMessages = [...currentMessages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }))

    try {
      const res = await fetch('/api/agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, mode: 'search' }),
      })

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let accContent = ''
      let msgSources: SearchSource[] = []
      let msgImages: ImageItem[] = []

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
              accContent += event.content
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: accContent, isStreaming: true } : m
                )
              )
            } else if (event.type === 'thinking') {
              setThinking(event.content)
            } else if (event.type === 'sources') {
              msgSources = event.items
            } else if (event.type === 'images') {
              msgImages = event.items
            } else if (event.type === 'mode_switch') {
              setMessages((prev) => prev.filter((m) => m.id !== assistantId))
              onModeSwitch(event.target, event.params)
              return
            } else if (event.type === 'done') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? {
                        ...m,
                        content: accContent,
                        isStreaming: false,
                        sources: msgSources.length > 0 ? msgSources : undefined,
                        images: msgImages.length > 0 ? msgImages : undefined,
                      }
                    : m
                )
              )
              setThinking('')
            }
          } catch {
            // skip
          }
        }
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: 'Ошибка поиска. Попробуй ещё раз.', isStreaming: false }
            : m
        )
      )
    } finally {
      setIsLoading(false)
      setThinking('')
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Welcome (empty state) */}
      {!hasSearched && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
          <div
            className="w-16 h-16 rounded-2xl border-2 border-[var(--ink)] flex items-center justify-center"
            style={{ background: '#1B6CA8', boxShadow: '4px 4px 0px var(--ink)' }}
          >
            <Globe size={28} />
          </div>
          <h2 className="text-lg font-bold text-[var(--ink)]">Свободный поиск</h2>
          <p className="text-sm text-[var(--ink-muted)] text-center">
            Ищу информацию в интернете и нахожу иллюстрации
          </p>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {[
              'Как выглядел Колизей?',
              'Спартанская армия',
              'Жизнь в Древнем Риме',
              'Греческие философы',
            ].map((s) => (
              <button
                key={s}
                onClick={() => doSearch(s)}
                className="text-xs px-2.5 py-1.5 bg-[var(--bg-dark)] border border-[var(--ink)] rounded-full hover:bg-[var(--sky)] hover:text-white transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results area */}
      {hasSearched && (
        <div className="flex-1 overflow-y-auto p-3 space-y-4 min-h-0">
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              if (msg.role === 'user') {
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-end"
                  >
                    <div
                      className="max-w-[85%] px-3 py-2 bg-[var(--indigo)] text-white rounded-xl border-2 border-[var(--ink)] text-sm"
                      style={{ boxShadow: '3px 3px 0px var(--ink)' }}
                    >
                      {msg.content}
                    </div>
                  </motion.div>
                )
              }

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  {/* Answer text */}
                  {msg.content && (
                    <div
                      className="p-3 bg-white border-2 border-[var(--ink)] rounded-xl text-sm leading-relaxed whitespace-pre-wrap"
                      style={{ boxShadow: '3px 3px 0px var(--ink)' }}
                    >
                      {toPlainAssistantText(msg.content)}
                      {msg.isStreaming && (
                        <span className="inline-block w-1.5 h-4 bg-[var(--ink)] ml-1 animate-pulse rounded-sm" />
                      )}
                    </div>
                  )}

                  {/* Images grid */}
                  {msg.images && msg.images.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-bold text-[var(--ink-muted)] flex items-center gap-1">
                        <Image size={10} /> Изображения
                      </p>
                      <div className="grid grid-cols-3 gap-1.5">
                        {msg.images.slice(0, 6).map((img, i) => (
                          <a
                            key={i}
                            href={img.source}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={img.title}
                          >
                            <img
                              src={img.thumb}
                              alt={img.title}
                              className="w-full h-20 object-cover rounded-lg border-2 border-[var(--ink)] hover:opacity-80 transition-opacity"
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sources */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-bold text-[var(--ink-muted)] flex items-center gap-1">
                        <Globe size={10} /> Источники
                      </p>
                      {msg.sources.map((s, i) => (
                        <SourceCard key={i} source={s} index={i} />
                      ))}
                    </div>
                  )}

                  {/* Switch to report */}
                  {!msg.isStreaming && msg.content && (
                    <button
                      onClick={() =>
                        onModeSwitch('report', { topic: messages.find((m) => m.role === 'user')?.content })
                      }
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[var(--yellow-light)] border border-[var(--ink)] rounded-full hover:bg-[var(--yellow)] transition-colors"
                    >
                      <FileText size={11} /> Написать реферат по этой теме
                    </button>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>

          {thinking && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-xs text-[var(--ink-muted)]"
            >
              <Globe size={12} className="animate-spin text-[var(--indigo)]" />
              {thinking}
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Search input */}
      <div className="p-3 border-t-2 border-[var(--ink)] bg-white">
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && doSearch(query)}
            placeholder="Найти что-нибудь в интернете..."
            className="flex-1 px-3 py-2 border-2 border-[var(--ink)] rounded-xl text-sm focus:outline-none focus:border-[var(--indigo)] bg-[var(--bg)]"
            disabled={isLoading}
          />
          <button
            onClick={() => doSearch(query)}
            disabled={!query.trim() || isLoading}
            className="w-10 h-10 rounded-xl border-2 border-[var(--ink)] flex items-center justify-center disabled:opacity-40 hover:opacity-80 transition-opacity shrink-0"
            style={{ background: '#1B6CA8', boxShadow: '3px 3px 0px var(--ink)' }}
          >
            <Search size={16} />
          </button>
          {hasSearched && (
            <button
              onClick={() => {
                clearSearch()
                setQuery('')
                setThinking('')
              }}
              title="Очистить поиск"
              className="w-10 h-10 rounded-xl border-2 border-[var(--ink)] bg-[var(--bg-dark)] flex items-center justify-center hover:bg-[var(--pink-light)] transition-colors shrink-0"
              style={{ boxShadow: '3px 3px 0px var(--ink)' }}
              disabled={isLoading}
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
