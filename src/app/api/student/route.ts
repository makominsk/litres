import { NextRequest, NextResponse } from 'next/server'
import { findOrCreateStudent } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { nickname } = await req.json()

    if (!nickname || typeof nickname !== 'string') {
      return NextResponse.json({ error: 'Поле nickname обязательно' }, { status: 400 })
    }

    const trimmed = nickname.trim()
    if (trimmed.length < 2 || trimmed.length > 30) {
      return NextResponse.json(
        { error: 'Никнейм должен быть от 2 до 30 символов' },
        { status: 400 }
      )
    }

    const student = await findOrCreateStudent(trimmed)
    if (!student) {
      return NextResponse.json({ error: 'Не удалось создать ученика' }, { status: 500 })
    }

    return NextResponse.json(student)
  } catch (error) {
    console.error('[/api/student]', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
