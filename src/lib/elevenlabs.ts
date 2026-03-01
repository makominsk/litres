import crypto from 'crypto'

// Мужской русский голос — Liam (многоязычный) или можно заменить на custom voice
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID ?? 'pNInz6obpgDQGcFmaJgB' // Adam (EN) — заменить на русский

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1'

export function hashText(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex').slice(0, 32)
}

export async function synthesizeSpeech(text: string): Promise<ArrayBuffer> {
  const response = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${VOICE_ID}`, {
    method: 'POST',
    headers: {
      'xi-api-key': process.env.ELEVENLABS_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.3,
        use_speaker_boost: true,
      },
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`ElevenLabs API error ${response.status}: ${error}`)
  }

  return response.arrayBuffer()
}
