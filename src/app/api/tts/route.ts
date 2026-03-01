import { NextRequest, NextResponse } from 'next/server'
import { synthesizeSpeech, hashText } from '@/lib/elevenlabs'
import { getAudioCache, setAudioCache, supabase } from '@/lib/supabase'

const MAX_TEXT_LENGTH = 1000

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

    // 2. Генерируем через ElevenLabs
    const audioBuffer = await synthesizeSpeech(trimmedText)

    // 3. Загружаем в Supabase Storage
    const fileName = `${textHash}.mp3`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('audio-cache')
      .upload(fileName, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: true,
      })

    if (uploadError) {
      console.error('[/api/tts] Storage upload error:', uploadError)
      // Возвращаем аудио напрямую если хранилище недоступно
      return new NextResponse(audioBuffer, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'public, max-age=86400',
        },
      })
    }

    // 4. Получаем публичный URL
    const { data: urlData } = supabase.storage
      .from('audio-cache')
      .getPublicUrl(fileName)

    const audioUrl = urlData.publicUrl

    // 5. Сохраняем в кэш-таблицу
    await setAudioCache(textHash, audioUrl)

    return NextResponse.json({ audioUrl, cached: false })
  } catch (error) {
    console.error('[/api/tts]', error)
    return NextResponse.json(
      { error: 'Ошибка при генерации аудио' },
      { status: 500 }
    )
  }
}
