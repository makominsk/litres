import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/gemini'
import { buildHintPrompt } from '@/lib/prompts'
import textbook from '@/data/textbook.json'

// Allow up to 30s on Vercel (Pro plan) or 10s (Hobby)
export const maxDuration = 30

export interface HintRequest {
  paragraphId: number
  questionIndex: number
  hintLevel: 1 | 2 | 3
}

/** Fallback hint from paragraph text when AI is unavailable */
function buildFallbackHint(
  question: string,
  paragraphTitle: string,
  paragraphContent: string,
  hintLevel: 1 | 2 | 3
): string {
  // Extract sentences from paragraph content (skip header artifacts)
  const sentences = paragraphContent
    .split(/[.!]\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 40 && !s.match(/^\d/) && !s.match(/^[А-ЯA-Z]{2,}$/))
    .slice(0, 20)

  if (hintLevel === 1) {
    return `Внимательно перечитай параграф «${paragraphTitle}». Обрати внимание на основные события и их причины — там есть ответ на этот вопрос.`
  }
  if (hintLevel === 2) {
    const hint = sentences.find(s =>
      question.split(' ').some(word => word.length > 4 && s.toLowerCase().includes(word.toLowerCase()))
    ) || sentences[0]
    return hint
      ? `Вот подсказка из учебника: «${hint.slice(0, 200)}...» Подумай, как это связано с вопросом.`
      : `В параграфе «${paragraphTitle}» есть раздел, который отвечает на этот вопрос. Найди ключевые слова из вопроса в тексте.`
  }
  // Level 3 — more text
  const excerpt = sentences.slice(0, 3).join('. ')
  return excerpt
    ? `Вот главное из параграфа: «${excerpt.slice(0, 400)}». Используй эту информацию для ответа на вопрос.`
    : `Перечитай весь параграф «${paragraphTitle}». Ответ находится в основном тексте.`
}

export async function POST(req: NextRequest) {
  let paragraphId: number
  let questionIndex: number
  let hintLevel: 1 | 2 | 3

  try {
    const body: HintRequest = await req.json()
    paragraphId = body.paragraphId
    questionIndex = body.questionIndex
    hintLevel = body.hintLevel

    if (!paragraphId || questionIndex === undefined || !hintLevel) {
      return NextResponse.json(
        { error: 'Нужны: paragraphId, questionIndex, hintLevel (1-3)' },
        { status: 400 }
      )
    }

    if (hintLevel < 1 || hintLevel > 3) {
      return NextResponse.json(
        { error: 'hintLevel должен быть 1, 2 или 3' },
        { status: 400 }
      )
    }
  } catch {
    return NextResponse.json({ error: 'Неверный формат запроса' }, { status: 400 })
  }

  const paragraph = (textbook.paragraphs as Record<string, { title: string; content: string; questions: string[] }>)[String(paragraphId)]
  if (!paragraph) {
    return NextResponse.json({ error: 'Параграф не найден' }, { status: 404 })
  }

  const question = paragraph.questions[questionIndex]
  if (!question) {
    return NextResponse.json({ error: 'Вопрос не найден' }, { status: 404 })
  }

  // Try AI hint first, fall back to text-based hint
  try {
    const prompt = buildHintPrompt({
      question,
      paragraphTitle: paragraph.title,
      paragraphContent: paragraph.content,
      hintLevel,
    })

    const raw = await generateContent(prompt)
    const parsed = JSON.parse(raw)
    const hint: string = parsed.hint

    if (!hint) throw new Error('Empty hint from AI')

    return NextResponse.json({ hint, hintLevel })
  } catch (error) {
    console.error('[/api/hint] AI failed, using fallback:', error)

    // Return text-based fallback hint — always works, no API needed
    const hint = buildFallbackHint(question, paragraph.title, paragraph.content, hintLevel)
    return NextResponse.json({ hint, hintLevel, fallback: true })
  }
}
