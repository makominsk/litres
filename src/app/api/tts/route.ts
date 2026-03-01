import { NextRequest, NextResponse } from 'next/server'

// Edge runtime: no 10-second timeout — streams audio directly from OpenAI to client
export const runtime = 'edge'

const MAX_TEXT_LENGTH = 600

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Поле text обязательно' }, { status: 400 })
    }

    const trimmedText = text.trim().slice(0, MAX_TEXT_LENGTH)

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

    // Pipe OpenAI stream directly to client — no buffering, no timeout
    return new Response(ttsRes.body, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('[/api/tts]', error)
    return NextResponse.json({ error: 'Ошибка при генерации аудио' }, { status: 500 })
  }
}
