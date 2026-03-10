// Edge Runtime — no timeout, fast Tavily proxy
export const runtime = 'edge'

export interface SearchSource {
  title: string
  url: string
  snippet: string
  score?: number
}

export interface WebSearchResult {
  text: string
  sources: SearchSource[]
}

export async function POST(req: Request) {
  try {
    const { query } = await req.json()

    if (!query || typeof query !== 'string') {
      return Response.json({ error: 'query обязателен' }, { status: 400 })
    }

    const apiKey = process.env.TAVILY_API_KEY
    if (!apiKey) {
      return Response.json({ error: 'Tavily API key не настроен' }, { status: 500 })
    }

    const tavilyRes = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: 'basic',
        max_results: 5,
        include_answer: true,
        include_raw_content: false,
      }),
    })

    if (!tavilyRes.ok) {
      throw new Error(`Tavily error: ${tavilyRes.status}`)
    }

    const data = await tavilyRes.json()

    const sources: SearchSource[] = (data.results ?? []).map((r: {
      title: string; url: string; content: string; score?: number
    }) => ({
      title: r.title,
      url: r.url,
      snippet: r.content?.slice(0, 300) ?? '',
      score: r.score,
    }))

    // Combine Tavily's answer + top snippets as context text for GPT
    const contextParts: string[] = []
    if (data.answer) contextParts.push(`Краткий ответ: ${data.answer}`)
    sources.forEach((s, i) => {
      contextParts.push(`[${i + 1}] ${s.title}\n${s.snippet}`)
    })

    return Response.json({
      text: contextParts.join('\n\n'),
      sources,
    } satisfies WebSearchResult)
  } catch (error) {
    console.error('[/api/web-search]', error)
    return Response.json({ error: 'Ошибка поиска' }, { status: 500 })
  }
}
