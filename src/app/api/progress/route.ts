import { NextRequest, NextResponse } from 'next/server'
import { getStudentProgress, supabase } from '@/lib/supabase'

// GET /api/progress?studentId=xxx
export async function GET(req: NextRequest) {
  try {
    const studentId = req.nextUrl.searchParams.get('studentId')
    if (!studentId) {
      return NextResponse.json({ error: 'Нужен параметр studentId' }, { status: 400 })
    }

    const progress = await getStudentProgress(studentId)
    return NextResponse.json(progress)
  } catch (error) {
    console.error('[GET /api/progress]', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

// POST /api/progress — сохранить ответ или результат теста
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, ...data } = body

    if (type === 'answer') {
      // Сохраняем ответ на вопрос параграфа
      const { studentId, paragraphId, questionIndex, answerText, isCorrect, hintLevel } = data

      if (!studentId || paragraphId === undefined || questionIndex === undefined) {
        return NextResponse.json({ error: 'Нужны: studentId, paragraphId, questionIndex' }, { status: 400 })
      }

      const { data: result, error } = await supabase
        .from('answers')
        .upsert({
          student_id: studentId,
          paragraph_id: paragraphId,
          question_index: questionIndex,
          answer_text: answerText,
          is_correct: isCorrect ?? false,
          hint_level: hintLevel ?? 0,
        }, { onConflict: 'student_id,paragraph_id,question_index' })
        .select()
        .single()

      if (error) {
        console.error('[POST /api/progress answer]', error)
        return NextResponse.json({ error: 'Ошибка сохранения ответа' }, { status: 500 })
      }

      return NextResponse.json(result)
    }

    if (type === 'quiz') {
      // Сохраняем результат теста
      const { studentId, paragraphId, sectionId, score, total } = data

      if (!studentId || score === undefined || !total) {
        return NextResponse.json({ error: 'Нужны: studentId, score, total' }, { status: 400 })
      }

      const { data: result, error } = await supabase
        .from('quiz_results')
        .insert({
          student_id: studentId,
          paragraph_id: paragraphId ?? null,
          section_id: sectionId ?? null,
          score,
          total,
        })
        .select()
        .single()

      if (error) {
        console.error('[POST /api/progress quiz]', error)
        return NextResponse.json({ error: 'Ошибка сохранения результата' }, { status: 500 })
      }

      return NextResponse.json(result)
    }

    return NextResponse.json({ error: 'Неизвестный тип: используй "answer" или "quiz"' }, { status: 400 })
  } catch (error) {
    console.error('[POST /api/progress]', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
