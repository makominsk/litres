import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/gemini'
import { buildEvaluatePrompt } from '@/lib/prompts'

export interface EvaluateRequest {
  question: string
  studentAnswer: string
  paragraphTitle: string
  paragraphContent: string
}

export interface EvaluateResponse {
  isCorrect: boolean
  score: number
  explanation: string
  funFact: string
  modernAnalogy: string
  mnemonic: string
}

export async function POST(req: NextRequest) {
  try {
    const body: EvaluateRequest = await req.json()

    if (!body.question || !body.studentAnswer || !body.paragraphTitle) {
      return NextResponse.json(
        { error: 'Не хватает данных: question, studentAnswer, paragraphTitle' },
        { status: 400 }
      )
    }

    // Защита от слишком короткого ответа
    if (body.studentAnswer.trim().length < 2) {
      return NextResponse.json({
        isCorrect: false,
        score: 0,
        explanation: 'Попробуй ответить подробнее! Расскажи, что ты знаешь по этой теме.',
        funFact: '',
        modernAnalogy: '',
        mnemonic: '',
      } satisfies EvaluateResponse)
    }

    const prompt = buildEvaluatePrompt(body)
    const raw = await generateContent(prompt)

    const result: EvaluateResponse = JSON.parse(raw)
    return NextResponse.json(result)
  } catch (error) {
    console.error('[/api/evaluate]', error)
    return NextResponse.json(
      { error: 'Ошибка при обращении к Gemini' },
      { status: 500 }
    )
  }
}
