import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/gemini'
import { buildEvaluatePrompt } from '@/lib/prompts'

// Allow up to 30s on Vercel (Pro plan) or 10s (Hobby)
export const maxDuration = 30

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

/** Simple keyword-based fallback evaluator when AI is unavailable */
function fallbackEvaluate(body: EvaluateRequest): EvaluateResponse {
  const answer = body.studentAnswer.toLowerCase()
  const content = body.paragraphContent.toLowerCase()

  // Extract significant words from question (>4 chars)
  const questionWords = body.question
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 4 && /[а-яё]/.test(w))

  // Count how many question-related words appear in the student's answer
  const hits = questionWords.filter(w => answer.includes(w.slice(0, 5))).length
  const ratio = questionWords.length > 0 ? hits / questionWords.length : 0

  // Also check if answer uses words from paragraph content
  const answerWords = answer.split(/\s+/).filter(w => w.length > 4)
  const contentHits = answerWords.filter(w => content.includes(w)).length
  const contentRatio = answerWords.length > 0 ? Math.min(contentHits / 5, 1) : 0

  const score = Math.round((ratio * 0.4 + contentRatio * 0.6) * 100)
  const isCorrect = score >= 40

  const praises = ['Отлично постарался!', 'Хорошая попытка!', 'Молодец, что ответил!', 'Видно, что ты думал!']
  const praise = praises[Math.floor(Math.random() * praises.length)]

  return {
    isCorrect,
    score,
    explanation: `${praise} ${isCorrect ? 'Ты хорошо разобрался в теме.' : 'Попробуй ещё раз — перечитай параграф и ответь подробнее.'} Тема: «${body.paragraphTitle}».`,
    funFact: '',
    modernAnalogy: '',
    mnemonic: '',
  }
}

export async function POST(req: NextRequest) {
  let body: EvaluateRequest

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Неверный формат запроса' }, { status: 400 })
  }

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

  try {
    const prompt = buildEvaluatePrompt(body)
    const raw = await generateContent(prompt)
    const result: EvaluateResponse = JSON.parse(raw)
    return NextResponse.json(result)
  } catch (error) {
    console.error('[/api/evaluate] AI failed, using fallback:', error)
    // Always return something useful instead of an error
    return NextResponse.json(fallbackEvaluate(body))
  }
}
