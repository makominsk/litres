'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Globe, ExternalLink } from 'lucide-react'
import type { ChatMessage, ModeParams, SearchSource, ImageItem, SSEEvent } from '@/types/smart-window'

interface Props {
  initialMessage?: string
  paragraphTitle?: string
  paragraphId?: number
  sectionTitle?: string
  onModeSwitch: (target: string, params: ModeParams) => void
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} gap-2`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-[var(--indigo)] border-2 border-[var(--ink)] flex items-center justify-center text-white text-xs font-bold shrink-0 mt-1">
          К
        </div>
      )}
      <div className={`max-w-[85%] space-y-2`}>
        <div
          className={`px-3 py-2 rounded-xl border-2 border-[var(--ink)] text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? 'bg-[var(--indigo)] text-white rounded-br-sm'
              : 'bg-white text-[var(--ink)] rounded-bl-sm'
          }`}
          style={{ boxShadow: isUser ? '3px 3px 0px var(--ink)' : '3px 3px 0px var(--ink)' }}
        >
          {msg.content}
          {msg.isStreaming && (
            <span className="inline-block w-1.5 h-4 bg-current ml-1 animate-pulse rounded-sm" />
          )}
        </div>

        {/* Sources */}
        {msg.sources && msg.sources.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-[var(--ink-muted)] font-semibold">Источники:</p>
            {msg.sources.map((s, i) => (
              <a
                key={i}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-1.5 p-2 bg-[var(--yellow-light)] border border-[var(--ink)] rounded-lg text-xs hover:bg-[var(--yellow)] transition-colors"
              >
                <ExternalLink size={10} className="shrink-0 mt-0.5" />
                <span className="line-clamp-2 font-medium">{s.title}</span>
              </a>
            ))}
          </div>
        )}

        {/* Images */}
        {msg.images && msg.images.length > 0 && (
          <div className="grid grid-cols-3 gap-1">
            {msg.images.slice(0, 6).map((img, i) => (
              <a key={i} href={img.source} target="_blank" rel="noopener noreferrer" title={img.title}>
                <img
                  src={img.thumb}
                  alt={img.title}
                  className="w-full h-16 object-cover rounded-lg border-2 border-[var(--ink)] hover:opacity-80 transition-opacity"
                />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ThinkingIndicator({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-[var(--ink-muted)]">
      <Globe size={12} className="animate-spin text-[var(--indigo)]" />
      <span>{text}</span>
    </div>
  )
}

export function DiscussionMode({ initialMessage, paragraphTitle, paragraphId, sectionTitle, onModeSwitch }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: paragraphTitle
        ? `Привет! Я Клио — муза истории из древнегреческой мифологии. Именно я вдохновляла летописцев и историков на великие труды! Сейчас изучаем тему «${paragraphTitle}». Что хочешь узнать или обсудить? Могу искать информацию в интернете, помочь с рефератом или подготовить тебя к зачёту!`
        : 'Привет! Я Клио — муза истории из древнегреческой мифологии. Именно я вдохновляла летописцев и историков на великие труды! Задай любой вопрос по истории Древнего мира. Могу искать информацию в интернете, помочь с рефератом или подготовить тебя к зачёту!',
    },
  ])
  const [input, setInput] = useState(initialMessage ?? '')
  const [thinking, setThinking] = useState('')
  const [pendingSources, setPendingSources] = useState<SearchSource[]>([])
  const [pendingImages, setPendingImages] = useState<ImageItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || isLoading) return

    setInput('')
    setIsLoading(true)
    setThinking('')
    setPendingSources([])
    setPendingImages([])

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', content: text }
    const assistantId = `a-${Date.now()}`
    const assistantPlaceholder: ChatMessage = { id: assistantId, role: 'assistant', content: '', isStreaming: true }

    setMessages((prev) => [...prev, userMsg, assistantPlaceholder])

    // Build API messages (exclude welcome + streaming placeholder)
    const apiMessages = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }))

    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          mode: 'discussion',
          context: { paragraphTitle, paragraphId, sectionTitle },
        }),
        signal: abortRef.current.signal,
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
              setPendingSources(event.items)
            } else if (event.type === 'images') {
              msgImages = event.items
              setPendingImages(event.items)
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
            } else if (event.type === 'error') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: 'Произошла ошибка. Попробуй ещё раз.', isStreaming: false }
                    : m
                )
              )
            }
          } catch {
            // skip malformed event
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: 'Не удалось получить ответ. Проверь подключение.', isStreaming: false }
              : m
          )
        )
      }
    } finally {
      setIsLoading(false)
      setThinking('')
      void pendingSources
      void pendingImages
    }
  }, [input, isLoading, messages, paragraphTitle, paragraphId, sectionTitle, onModeSwitch, pendingSources, pendingImages])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <MessageBubble msg={msg} />
            </motion.div>
          ))}
        </AnimatePresence>

        {thinking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <ThinkingIndicator text={thinking} />
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick suggestions */}
      {messages.length <= 1 && (
        <div className="px-3 pb-2 flex flex-wrap gap-1.5">
          {['Расскажи о Древней Греции', 'Напиши реферат', 'Проверь мои знания'].map((s) => (
            <button
              key={s}
              onClick={() => { setInput(s); inputRef.current?.focus() }}
              className="text-xs px-2 py-1 bg-[var(--bg-dark)] border border-[var(--ink)] rounded-full hover:bg-[var(--yellow-light)] transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t-2 border-[var(--ink)] bg-white">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Напиши вопрос или скажи «напиши реферат»..."
            rows={1}
            className="flex-1 resize-none rounded-xl border-2 border-[var(--ink)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--indigo)] bg-[var(--bg)] min-h-[40px] max-h-[120px] overflow-y-auto"
            style={{ fieldSizing: 'content' } as React.CSSProperties}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 rounded-xl border-2 border-[var(--ink)] bg-[var(--indigo)] text-white flex items-center justify-center disabled:opacity-40 hover:bg-[var(--indigo-dark)] transition-colors shrink-0"
            style={{ boxShadow: '3px 3px 0px var(--ink)' }}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
