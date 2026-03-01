import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/gemini'
import { buildHintPrompt } from '@/lib/prompts'
import textbook from '@/data/textbook.json'

export interface HintRequest {
  paragraphId: number
  questionIndex: number
  hintLevel: 1 | 2 | 3
}

export async function POST(req: NextRequest) {
  try {
    const body: HintRequest = await req.json()
    const { paragraphId, questionIndex, hintLevel } = body

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

    const paragraph = (textbook.paragraphs as Record<string, { title: string; content: string; questions: string[] }>)[String(paragraphId)]
    if (!paragraph) {
      return NextResponse.json({ error: 'Параграф не найден' }, { status: 404 })
    }

    const question = paragraph.questions[questionIndex]
    if (!question) {
      return NextResponse.json({ error: 'Вопрос не найден' }, { status: 404 })
    }

    const prompt = buildHintPrompt({
      question,
      paragraphTitle: paragraph.title,
      paragraphContent: paragraph.content,
      hintLevel,
    })

    const raw = await generateContent(prompt)
    const { hint } = JSON.parse(raw)

    return NextResponse.json({ hint, hintLevel })
  } catch (error) {
    console.error('[/api/hint]', error)
    return NextResponse.json(
      { error: 'Ошибка при генерации подсказки' },
      { status: 500 }
    )
  }
}
