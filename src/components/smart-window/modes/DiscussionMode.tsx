'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Globe, ExternalLink, Trash2, Mic, Square, Loader2 } from 'lucide-react'
import type { ChatMessage, ModeParams, SearchSource, ImageItem, SSEEvent } from '@/types/smart-window'
import { useSmartWindowStore } from '@/stores/smart-window-store'
import { toPlainAssistantText } from '@/lib/plain-text'

interface Props {
  initialMessage?: string
  paragraphTitle?: string
  paragraphId?: number
  sectionTitle?: string
  onModeSwitch: (target: string, params: ModeParams) => void
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user'
  const visibleContent = isUser ? msg.content : toPlainAssistantText(msg.content)

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} gap-2`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-[var(--indigo)] border-2 border-[var(--ink)] flex items-center justify-center text-white text-xs font-bold shrink-0 mt-1">
          К
        </div>
      )}
      <div className="max-w-[85%] space-y-2">
        <div
          className={`px-3 py-2 rounded-xl border-2 border-[var(--ink)] text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? 'bg-[var(--indigo)] text-white rounded-br-sm'
              : 'bg-white text-[var(--ink)] rounded-bl-sm'
          }`}
          style={{ boxShadow: '3px 3px 0px var(--ink)' }}
        >
          {visibleContent}
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

const WELCOME_ID = 'welcome'

function makeWelcome(paragraphTitle?: string): ChatMessage {
  return {
    id: WELCOME_ID,
    role: 'assistant',
    content: paragraphTitle
      ? `Привет! Я Клио — муза истории из древнегреческой мифологии. Именно я вдохновляла летописцев и историков на великие труды! Сейчас изучаем тему «${paragraphTitle}». Что хочешь узнать или обсудить? Могу искать информацию в интернете, помочь с рефератом или подготовить тебя к зачёту!`
      : 'Привет! Я Клио — муза истории из древнегреческой мифологии. Именно я вдохновляла летописцев и историков на великие труды! Задай любой вопрос по истории Древнего мира. Могу искать информацию в интернете, помочь с рефератом или подготовить тебя к зачёту!',
  }
}

export function DiscussionMode({ initialMessage, paragraphTitle, paragraphId, sectionTitle, onModeSwitch }: Props) {
  const { messages, setMessages, updateMessage } = useSmartWindowStore()

  // Инициализируем приветствие один раз если история пустая
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([makeWelcome(paragraphTitle)])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [input, setInput] = useState(initialMessage ?? '')
  const [thinking, setThinking] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [recState, setRecState] = useState<'idle' | 'recording' | 'transcribing'>('idle')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || isLoading) return

    setInput('')
    setIsLoading(true)
    setThinking('')

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', content: text }
    const assistantId = `a-${Date.now()}`
    const assistantPlaceholder: ChatMessage = { id: assistantId, role: 'assistant', content: '', isStreaming: true }

    // Snapshot текущих сообщений для API (до добавления placeholder)
    const currentMessages = useSmartWindowStore.getState().messages
    setMessages([...currentMessages, userMsg, assistantPlaceholder])

    const apiMessages = [...currentMessages, userMsg]
      .filter((m) => m.id !== WELCOME_ID) // welcome не отправляем в API
      .map((m) => ({ role: m.role, content: m.content }))

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
              updateMessage(assistantId, { content: accContent, isStreaming: true })
            } else if (event.type === 'thinking') {
              setThinking(event.content)
            } else if (event.type === 'sources') {
              msgSources = event.items
            } else if (event.type === 'images') {
              msgImages = event.items
            } else if (event.type === 'mode_switch') {
              // Убираем placeholder и команду переключения, чтобы она не триггерила повторный mode_switch.
              const store = useSmartWindowStore.getState()
              setMessages(store.messages.filter((m) => m.id !== assistantId && m.id !== userMsg.id))
              onModeSwitch(event.target, event.params)
              return
            } else if (event.type === 'done') {
              updateMessage(assistantId, {
                content: accContent,
                isStreaming: false,
                sources: msgSources.length > 0 ? msgSources : undefined,
                images: msgImages.length > 0 ? msgImages : undefined,
              })
              setThinking('')
            } else if (event.type === 'error') {
              updateMessage(assistantId, {
                content: 'Произошла ошибка. Попробуй ещё раз.',
                isStreaming: false,
              })
            }
          } catch {
            // skip malformed event
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        updateMessage(assistantId, {
          content: 'Не удалось получить ответ. Проверь подключение.',
          isStreaming: false,
        })
      }
    } finally {
      setIsLoading(false)
      setThinking('')
    }
  }, [input, isLoading, paragraphTitle, paragraphId, sectionTitle, onModeSwitch, setMessages, updateMessage])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearHistory = () => {
    setMessages([makeWelcome(paragraphTitle)])
  }

  async function toggleRecording() {
    if (recState === 'recording') {
      mediaRef.current?.stop()
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      mediaRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        setRecState('transcribing')
        try {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
          const form = new FormData()
          form.append('audio', blob, 'recording.webm')
          const res = await fetch('/api/transcribe', { method: 'POST', body: form })
          const data = await res.json()
          if (data.text) setInput((prev) => (prev ? prev + ' ' + data.text : data.text))
        } catch {
          // ignore
        } finally {
          setRecState('idle')
          inputRef.current?.focus()
        }
      }

      recorder.start()
      setRecState('recording')
    } catch {
      setRecState('idle')
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

      {/* Quick suggestions — только если только приветствие */}
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
        {recState === 'recording' && (
          <p className="text-xs text-[#DC2626] flex items-center gap-1 animate-pulse mb-2">
            <span className="w-2 h-2 bg-[#DC2626] rounded-full inline-block" />
            Запись... нажми кнопку чтобы остановить
          </p>
        )}
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
            disabled={isLoading || recState !== 'idle'}
          />
          <button
            onClick={toggleRecording}
            disabled={isLoading || recState === 'transcribing'}
            title={recState === 'recording' ? 'Остановить запись' : 'Надиктовать сообщение'}
            className="w-10 h-10 rounded-xl border-2 border-[var(--ink)] text-white flex items-center justify-center disabled:opacity-40 transition-colors shrink-0"
            style={{
              background: recState === 'recording' ? '#DC2626' : '#4338CA',
              boxShadow: '3px 3px 0px var(--ink)',
            }}
          >
            {recState === 'transcribing' ? (
              <Loader2 size={15} className="animate-spin" />
            ) : recState === 'recording' ? (
              <Square size={12} className="fill-white" />
            ) : (
              <Mic size={15} />
            )}
          </button>
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading || recState !== 'idle'}
            className="w-10 h-10 rounded-xl border-2 border-[var(--ink)] bg-[var(--indigo)] text-white flex items-center justify-center disabled:opacity-40 hover:bg-[var(--indigo-dark)] transition-colors shrink-0"
            style={{ boxShadow: '3px 3px 0px var(--ink)' }}
          >
            <Send size={16} />
          </button>
          {messages.length > 1 && (
            <button
              onClick={clearHistory}
              title="Очистить историю"
              className="w-10 h-10 rounded-xl border-2 border-[var(--ink)] bg-[var(--bg-dark)] flex items-center justify-center hover:bg-[var(--pink-light)] transition-colors shrink-0"
              style={{ boxShadow: '3px 3px 0px var(--ink)' }}
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
