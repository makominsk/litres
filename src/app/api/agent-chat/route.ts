// Edge Runtime — SSE streaming agent with tool calling
export const runtime = 'edge'

// ─── Types ────────────────────────────────────────────────────────────────────

export type AgentMode = 'discussion' | 'report' | 'exam' | 'search'

interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string | null
  tool_call_id?: string
  tool_calls?: OpenAIToolCall[]
}

interface OpenAIToolCall {
  id: string
  type: 'function'
  function: { name: string; arguments: string }
}

interface AgentContext {
  paragraphTitle?: string
  paragraphId?: number
  sectionTitle?: string
}

// ─── SSE helpers ──────────────────────────────────────────────────────────────

const enc = new TextEncoder()
function sse(data: object): Uint8Array {
  return enc.encode(`data: ${JSON.stringify(data)}\n\n`)
}

// ─── Tool definitions ─────────────────────────────────────────────────────────

const webSearchTool = {
  type: 'function',
  function: {
    name: 'web_search',
    description:
      'Ищет информацию в интернете. Используй когда нужны свежие факты, биографии, события или любая информация вне учебника.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Поисковый запрос (можно на русском или английском)',
        },
      },
      required: ['query'],
    },
  },
}

const searchImagesTool = {
  type: 'function',
  function: {
    name: 'search_images',
    description:
      'Ищет исторические изображения на Wikimedia Commons. Используй для поиска иллюстраций, карт, артефактов.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Запрос для поиска изображений (лучше на английском)',
        },
      },
      required: ['query'],
    },
  },
}

const switchModeTool = {
  type: 'function',
  function: {
    name: 'switch_mode',
    description:
      'Переключает интерфейс в другой режим. Используй НЕМЕДЛЕННО когда ученик хочет написать реферат/доклад, пройти тест/зачёт или найти что-то в интернете.',
    parameters: {
      type: 'object',
      properties: {
        target: {
          type: 'string',
          enum: ['report', 'exam', 'search'],
          description: 'Целевой режим',
        },
        topic: {
          type: 'string',
          description: 'Тема для реферата (только для target=report)',
        },
        sectionId: {
          type: 'string',
          description: 'ID раздела для зачёта (только для target=exam)',
        },
        paragraphIds: {
          type: 'array',
          items: { type: 'number' },
          description: 'ID параграфов для зачёта (только для target=exam)',
        },
        initialQuery: {
          type: 'string',
          description: 'Начальный поисковый запрос (только для target=search)',
        },
      },
      required: ['target'],
    },
  },
}

// ─── System prompts ───────────────────────────────────────────────────────────

function buildSystemPrompt(mode: AgentMode, context: AgentContext): string {
  const base = `Ты — умный AI-помощник «Клио» для учеников 5 класса, изучающих "Историю Древнего мира".
Говори тепло, понятно и интересно. Обращайся на "ты". Не используй сложные термины без объяснения.
Пиши обычный текст БЕЗ markdown-разметки: без #, без *, без **, без [текст](url), без код-блоков.`

  if (mode === 'discussion') {
    const ctx = context.paragraphTitle
      ? `\n\nКонтекст: ученик сейчас изучает параграф "${context.paragraphTitle}" (раздел "${context.sectionTitle ?? ''}").`
      : ''

    return `${base}${ctx}

У тебя есть инструменты:
- web_search — ищи в интернете когда нужны факты, которых нет в учебнике
- switch_mode — переключай режим НЕМЕДЛЕННО без лишних слов, как только ученик говорит:
  * "напиши реферат", "сделай доклад", "помоги с рефератом" → switch_mode(target="report", topic=...)
  * "хочу потренироваться", "проверь меня", "пройти тест", "подготовиться к зачёту" → switch_mode(target="exam")
  * "найди", "поищи в интернете", "свободный поиск" → switch_mode(target="search", initialQuery=...)

НЕ спрашивай подтверждение — просто вызывай инструмент. После switch_mode ничего не пиши.`
  }

  if (mode === 'report') {
    return `Ты — умный AI-помощник «Клио» для учеников 5 класса, изучающих "Историю Древнего мира".
Говори тепло, понятно и интересно. Обращайся на "ты". Не используй сложные термины без объяснения.
Пиши структурированный реферат. Используй ### для заголовков разделов. Основной текст — обычные абзацы без markdown.
НЕ используй: **, *, код-блоки, маркированные списки, картинки ![...](url).
Можно нумерованные списки (1. 2. 3.) внутри разделов.`
  }

  if (mode === 'search') {
    return `${base}

Ты — поисковый агент. Алгоритм:
1. ВСЕГДА сначала вызови web_search для поиска информации
2. По необходимости вызови search_images для иллюстраций (они отобразятся отдельно, НЕ вставляй их в текст)
3. Синтезируй найденное в структурированный ответ с источниками
4. Если тема хорошо подходит для реферата — в конце предложи switch_mode(target="report")

ВАЖНО:
- НЕ вставляй картинки в текст (никаких ![...](url)) — они показываются отдельным блоком
- НЕ добавляй раздел "Источники" в конец текста — источники показываются отдельно
- Пиши обычный текст БЕЗ markdown: без ###, без **, без списков со звёздочками
- Можно нумерованные списки (1. 2. 3.) и обычные абзацы
- Не придумывай информацию — только из результатов поиска`
  }

  return base
}

// ─── Tool executors ───────────────────────────────────────────────────────────

// Domains that are not authoritative for history/education
const BLOCKED_DOMAINS = [
  'pikabu.ru', 'dzen.ru', 'zen.yandex.ru', 'otvet.mail.ru', 'mail.ru',
  'fishki.net', 'vk.com', 'ok.ru', 'twitter.com', 'facebook.com',
  'instagram.com', 'tiktok.com', 'livejournal.com', 'liveinternet.ru',
  'otzovik.com', 'irecommend.ru', 'fanfics.me', 'ficbook.net',
]

function isReliableSource(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace('www.', '')
    return !BLOCKED_DOMAINS.some((d) => host === d || host.endsWith('.' + d))
  } catch {
    return true
  }
}

async function executeWebSearch(query: string): Promise<{ text: string; sources: unknown[] }> {
  const url = new URL('/api/web-search', 'https://placeholder.internal')
  // Use direct Tavily call to avoid self-referencing in edge
  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey) return { text: 'Поиск недоступен', sources: [] }

  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: 'basic',
      max_results: 8,
      include_answer: true,
      exclude_domains: BLOCKED_DOMAINS,
    }),
  })
  void url

  if (!res.ok) return { text: 'Поиск не дал результатов', sources: [] }

  const data = await res.json()
  const sources = (data.results ?? [])
    .filter((r: { url: string }) => isReliableSource(r.url))
    .slice(0, 5)
    .map((r: { title: string; url: string; content: string }) => ({
      title: r.title,
      url: r.url,
      snippet: r.content?.slice(0, 300) ?? '',
    }))

  const parts: string[] = []
  if (data.answer) parts.push(`Краткий ответ: ${data.answer}`)
  sources.forEach((s: { title: string; snippet: string }, i: number) => {
    parts.push(`[${i + 1}] ${s.title}\n${s.snippet}`)
  })

  return { text: parts.join('\n\n'), sources }
}

async function executeImageSearch(query: string): Promise<unknown[]> {
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: `${query} filetype:bitmap`,
    gsrnamespace: '6',
    gsrlimit: '12',
    prop: 'imageinfo|pageterms',
    iiprop: 'url|extmetadata',
    iiurlwidth: '400',
    wbptterms: 'description',
    format: 'json',
    origin: '*',
  })

  const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
    headers: { 'User-Agent': 'HistoryApp/1.0 (educational)' },
  })

  if (!res.ok) return []

  const data = await res.json()
  const pages = Object.values(data.query?.pages ?? {}) as Array<{
    title: string
    imageinfo?: Array<{ url: string; thumburl: string; extmetadata?: { ImageDescription?: { value: string } } }>
    terms?: { description?: string[] }
  }>

  return pages
    .filter((p) => p.imageinfo?.[0]?.thumburl)
    .slice(0, 6)
    .map((p) => {
      const info = p.imageinfo![0]
      const rawDesc = info.extmetadata?.ImageDescription?.value ?? p.terms?.description?.[0] ?? ''
      return {
        title: p.title.replace(/^File:/, ''),
        url: info.url,
        thumb: info.thumburl,
        description: rawDesc.replace(/<[^>]+>/g, '').slice(0, 200),
        source: `https://commons.wikimedia.org/wiki/${encodeURIComponent(p.title)}`,
      }
    })
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  let body: { messages: ChatMessage[]; mode: AgentMode; context?: AgentContext }

  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Неверный формат' }, { status: 400 })
  }

  const { messages, mode = 'discussion', context = {} } = body

  const tools =
    mode === 'discussion'
      ? [webSearchTool, switchModeTool]
      : mode === 'search'
        ? [webSearchTool, searchImagesTool, switchModeTool]
        : []

  const systemPrompt = buildSystemPrompt(mode, context)

  const stream = new ReadableStream({
    async start(controller) {
      const decoder = new TextDecoder()

      // ── Phase 1: streaming call, collect tool_calls in parallel with text ──
      const openaiMessages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...messages,
      ]

      const firstRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: openaiMessages,
          tools: tools.length > 0 ? tools : undefined,
          tool_choice: tools.length > 0 ? 'auto' : undefined,
          stream: true,
          max_tokens: 1500,
          temperature: 0.7,
        }),
      })

      if (!firstRes.ok) {
        controller.enqueue(sse({ type: 'error', content: 'Ошибка AI-сервиса' }))
        controller.enqueue(sse({ type: 'done' }))
        controller.close()
        return
      }

      const reader = firstRes.body!.getReader()
      const toolCallsMap: Record<number, { id: string; name: string; arguments: string }> = {}
      let assistantContent = ''
      let buffer = ''

      // Stream Phase 1
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? '' // keep incomplete last line

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (raw === '[DONE]') continue

          try {
            const parsed = JSON.parse(raw)
            const delta = parsed.choices?.[0]?.delta

            if (delta?.content) {
              assistantContent += delta.content
              controller.enqueue(sse({ type: 'text', content: delta.content }))
            }

            if (delta?.tool_calls) {
              for (const tc of delta.tool_calls) {
                if (toolCallsMap[tc.index] === undefined) {
                  toolCallsMap[tc.index] = { id: '', name: '', arguments: '' }
                }
                if (tc.id) toolCallsMap[tc.index].id = tc.id
                if (tc.function?.name) toolCallsMap[tc.index].name += tc.function.name
                if (tc.function?.arguments) toolCallsMap[tc.index].arguments += tc.function.arguments
              }
            }
          } catch {
            // skip malformed chunk
          }
        }
      }

      const toolCalls = Object.values(toolCallsMap).filter((tc) => tc.name)

      // ── No tool calls → done ─────────────────────────────────────────────
      if (toolCalls.length === 0) {
        controller.enqueue(sse({ type: 'done' }))
        controller.close()
        return
      }

      // ── Phase 2: execute tool calls ──────────────────────────────────────
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: assistantContent || null,
        tool_calls: toolCalls.map((tc) => ({
          id: tc.id,
          type: 'function',
          function: { name: tc.name, arguments: tc.arguments },
        })),
      }

      const toolResultMessages: ChatMessage[] = []
      let switchTriggered = false

      for (const call of toolCalls) {
        let args: Record<string, unknown>
        try {
          args = JSON.parse(call.arguments)
        } catch {
          args = {}
        }

        // ── switch_mode ──────────────────────────────────────────────────
        if (call.name === 'switch_mode') {
          controller.enqueue(
            sse({
              type: 'mode_switch',
              target: args.target,
              params: {
                topic: args.topic,
                sectionId: args.sectionId,
                paragraphIds: args.paragraphIds,
                initialQuery: args.initialQuery,
              },
            })
          )
          switchTriggered = true
          break
        }

        // ── web_search ───────────────────────────────────────────────────
        if (call.name === 'web_search') {
          controller.enqueue(sse({ type: 'thinking', content: `Ищу: ${args.query}` }))
          const result = await executeWebSearch(String(args.query ?? ''))
          if (result.sources.length > 0) {
            controller.enqueue(sse({ type: 'sources', items: result.sources }))
          }
          toolResultMessages.push({
            role: 'tool',
            content: result.text,
            tool_call_id: call.id,
          })
        }

        // ── search_images ────────────────────────────────────────────────
        if (call.name === 'search_images') {
          controller.enqueue(sse({ type: 'thinking', content: `Ищу изображения: ${args.query}` }))
          const images = await executeImageSearch(String(args.query ?? ''))
          if (images.length > 0) {
            controller.enqueue(sse({ type: 'images', items: images }))
          }
          toolResultMessages.push({
            role: 'tool',
            content: `Найдено изображений: ${images.length}`,
            tool_call_id: call.id,
          })
        }
      }

      if (switchTriggered) {
        controller.enqueue(sse({ type: 'done' }))
        controller.close()
        return
      }

      // ── Phase 3: final streaming response with tool results ───────────────
      const finalRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [...openaiMessages, assistantMessage, ...toolResultMessages],
          stream: true,
          max_tokens: 1500,
          temperature: 0.7,
        }),
      })

      if (!finalRes.ok) {
        controller.enqueue(sse({ type: 'error', content: 'Ошибка финального ответа' }))
        controller.enqueue(sse({ type: 'done' }))
        controller.close()
        return
      }

      const reader2 = finalRes.body!.getReader()
      let buffer2 = ''

      while (true) {
        const { done, value } = await reader2.read()
        if (done) break

        buffer2 += decoder.decode(value, { stream: true })
        const lines = buffer2.split('\n')
        buffer2 = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (raw === '[DONE]') continue

          try {
            const parsed = JSON.parse(raw)
            const text = parsed.choices?.[0]?.delta?.content
            if (text) controller.enqueue(sse({ type: 'text', content: text }))
          } catch {
            // skip
          }
        }
      }

      controller.enqueue(sse({ type: 'done' }))
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
