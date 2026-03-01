import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// =============================================
// Типы таблиц
// =============================================

export interface Student {
  id: string
  nickname: string
  created_at: string
}

export interface Answer {
  id: string
  student_id: string
  paragraph_id: number
  question_index: number
  answer_text: string | null
  is_correct: boolean
  hint_level: number
  created_at: string
}

export interface QuizResult {
  id: string
  student_id: string
  paragraph_id: number | null
  section_id: string | null
  score: number
  total: number
  created_at: string
}

export interface AudioCache {
  id: string
  text_hash: string
  audio_url: string
  created_at: string
}

// =============================================
// Хелперы для работы с учеником
// =============================================

export async function findOrCreateStudent(nickname: string): Promise<Student | null> {
  // Ищем существующего ученика
  const { data: existing } = await supabase
    .from('students')
    .select('*')
    .eq('nickname', nickname.trim())
    .single()

  if (existing) return existing

  // Создаём нового
  const { data: created, error } = await supabase
    .from('students')
    .insert({ nickname: nickname.trim() })
    .select()
    .single()

  if (error) {
    console.error('Error creating student:', error)
    return null
  }

  return created
}

export async function getStudentProgress(studentId: string) {
  const [answersRes, quizRes] = await Promise.all([
    supabase
      .from('answers')
      .select('*')
      .eq('student_id', studentId),
    supabase
      .from('quiz_results')
      .select('*')
      .eq('student_id', studentId),
  ])

  return {
    answers: answersRes.data ?? [],
    quizResults: quizRes.data ?? [],
  }
}

// =============================================
// Хелпер для аудио-кэша
// =============================================

export async function getAudioCache(textHash: string): Promise<string | null> {
  const { data } = await supabase
    .from('audio_cache')
    .select('audio_url')
    .eq('text_hash', textHash)
    .single()

  return data?.audio_url ?? null
}

export async function setAudioCache(textHash: string, audioUrl: string): Promise<void> {
  await supabase
    .from('audio_cache')
    .upsert({ text_hash: textHash, audio_url: audioUrl })
}
