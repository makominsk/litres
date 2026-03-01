import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getAudioCache, setAudioCache, supabase } from '@/lib/supabase'

export const maxDuration = 30

const MAX_TEXT_LENGTH = 1000

function hashText(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex').slice(0, 32)
}

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Поле text обязательно' }, { status: 400 })
    }

    const trimmedText = text.trim().slice(0, MAX_TEXT_LENGTH)
    const textHash = hashText(trimmedText)

    // 1. Проверяем кэш
    const cachedUrl = await getAudioCache(textHash)
    if (cachedUrl) {
      return NextResponse.json({ audioUrl: cachedUrl, cached: true })
    }

    // 2. Генерируем через OpenAI TTS
    const ttsRes = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: trimmedText,
        voice: 'nova',
      }),
    })

    if (!ttsRes.ok) {
      const err = await ttsRes.text()
      console.error('[/api/tts] OpenAI TTS error:', err)
      return NextResponse.json({ error: 'TTS generation failed' }, { status: 500 })
    }

    const audioBuffer = await ttsRes.arrayBuffer()

    // 3. Загружаем в Supabase Storage
    const fileName = `${textHash}.mp3`
    const { error: uploadError } = await supabase.storage
      .from('audio-cache')
      .upload(fileName, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: true,
      })

    if (uploadError) {
      console.error('[/api/tts] Storage upload error:', uploadError)
      // Возвращаем аудио как base64 data URL если хранилище недоступно
      const base64 = Buffer.from(audioBuffer).toString('base64')
      return NextResponse.json({ audioUrl: `data:audio/mpeg;base64,${base64}`, cached: false })
    }

    // 4. Получаем публичный URL и сохраняем в кэш
    const { data: urlData } = supabase.storage.from('audio-cache').getPublicUrl(fileName)
    await setAudioCache(textHash, urlData.publicUrl)

    return NextResponse.json({ audioUrl: urlData.publicUrl, cached: false })
  } catch (error) {
    console.error('[/api/tts]', error)
    return NextResponse.json({ error: 'Ошибка при генерации аудио' }, { status: 500 })
  }
}
