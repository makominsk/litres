// Edge Runtime — generate exam questions from paragraph content
export const runtime = 'edge'

import textbookData from '@/data/textbook.json'

export interface ExamQuestion {
  id: string
  type: 'open' | 'multiple' | 'date' | 'term'
  question: string
  correctAnswer: string
  options?: string[] // 4 items for multiple choice
  hint?: string
  paragraphId: number
  paragraphTitle: string
}

interface Paragraph {
  id: number
  title: string
  content: string
  questions: string[]
  dates?: Array<{ date: string; event: string }>
  terms?: Array<{ term: string; definition: string }>
}

function getParagraphs(ids: number[]): Paragraph[] {
  const paras = (textbookData as { paragraphs: Record<string, Paragraph> }).paragraphs
  return ids
    .map((id) => paras[String(id)])
    .filter(Boolean)
    .slice(0, 6) // max 6 paragraphs to stay within token limits
}

function getSectionParagraphs(sectionId: string): Paragraph[] {
  const tb = textbookData as {
    sections: Array<{ id: string; paragraphs: number[] }>
    paragraphs: Record<string, Paragraph>
  }
  const section = tb.sections.find((s) => s.id === sectionId)
  if (!section) return []
  return section.paragraphs
    .map((id) => tb.paragraphs[String(id)])
    .filter(Boolean)
    .slice(0, 5)
}

export async function POST(req: Request) {
  try {
    const { paragraphIds, sectionId, count = 8 } = await req.json()

    let paragraphs: Paragraph[] = []

    if (sectionId) {
      paragraphs = getSectionParagraphs(sectionId)
    } else if (Array.isArray(paragraphIds) && paragraphIds.length > 0) {
      paragraphs = getParagraphs(paragraphIds)
    }

    if (paragraphs.length === 0) {
      return Response.json({ error: 'Параграфы не найдены' }, { status: 400 })
    }

    // Build context for GPT: titles + content summaries
    const contextBlocks = paragraphs.map((p) => {
      const contentSnippet = p.content.slice(0, 800)
      const datesList = p.dates?.map((d) => `• ${d.date}: ${d.event}`).join('\n') ?? ''
      const termsList = p.terms?.map((t) => `• ${t.term}: ${t.definition}`).join('\n') ?? ''
      return `=== Параграф ${p.id}: ${p.title} ===
${contentSnippet}
${datesList ? `Даты:\n${datesList}` : ''}
${termsList ? `Термины:\n${termsList}` : ''}`
    })

    const prompt = `Ты составляешь вопросы для зачёта по истории Древнего мира (5 класс).

Текст из учебника:
${contextBlocks.join('\n\n')}

Составь РОВНО ${count} вопросов разных типов. Вопросы должны охватывать разные темы из предоставленного текста.

Типы вопросов:
- "open": свободный ответ (2-3 предложения)
- "multiple": 4 варианта, один правильный
- "date": назвать что произошло в указанную дату (только если в тексте есть даты)
- "term": объяснить термин своими словами (только если в тексте есть термины)

Распредели типы: ~3 open, ~3 multiple, ~1 date, ~1 term (или меньше если нет подходящих дат/терминов).

Ответь СТРОГО в формате JSON (массив), без markdown:
[
  {
    "paragraphId": number,
    "type": "open"|"multiple"|"date"|"term",
    "question": "текст вопроса",
    "correctAnswer": "правильный ответ (1-3 предложения)",
    "options": ["вариант A", "вариант B", "вариант C", "вариант D"] (только для multiple, правильный ответ должен быть одним из вариантов),
    "hint": "подсказка (1 предложение)"
  }
]

Правила:
- Все вопросы и ответы на русском языке
- Вопросы чёткие, понятные для 10-летнего ребёнка
- Правильный ответ всегда точный и конкретный
- Для multiple: правильный ответ должен быть включён в массив options`

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      }),
    })

    if (!openaiRes.ok) {
      throw new Error(`OpenAI error: ${openaiRes.status}`)
    }

    const aiData = await openaiRes.json()
    const rawContent = aiData.choices?.[0]?.message?.content ?? '{}'

    let parsed: unknown
    try {
      const obj = JSON.parse(rawContent)
      // GPT might wrap in an object key
      parsed = Array.isArray(obj) ? obj : Object.values(obj)[0]
    } catch {
      throw new Error('Не удалось разобрать ответ AI')
    }

    if (!Array.isArray(parsed)) {
      throw new Error('Ответ AI не является массивом')
    }

    // Enrich with paragraph title and unique id
    const paraMap = Object.fromEntries(paragraphs.map((p) => [p.id, p]))
    const questions: ExamQuestion[] = (parsed as Array<Record<string, unknown>>)
      .filter((q) => q.question && q.correctAnswer)
      .map((q, i) => ({
        id: `q-${Date.now()}-${i}`,
        type: (q.type as ExamQuestion['type']) ?? 'open',
        question: String(q.question),
        correctAnswer: String(q.correctAnswer),
        options: Array.isArray(q.options) ? q.options.map(String) : undefined,
        hint: q.hint ? String(q.hint) : undefined,
        paragraphId: Number(q.paragraphId) || paragraphs[0].id,
        paragraphTitle: paraMap[Number(q.paragraphId)]?.title ?? paragraphs[0].title,
      }))

    return Response.json({ questions })
  } catch (error) {
    console.error('[/api/generate-exam]', error)
    return Response.json({ error: 'Не удалось сгенерировать вопросы' }, { status: 500 })
  }
}
