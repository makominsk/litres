import OpenAI from 'openai'
import { SYSTEM_PROMPT } from './prompts'

// gpt-4o-mini: fast, cheap (~$0.001/request), high rate limits, perfect for education apps
const MODEL = 'gpt-4o-mini'

// Lazy initialization — client created only at request time, not during build
let _client: OpenAI | null = null
function getClient() {
  if (!_client) {
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
  }
  return _client
}

export async function generateContent(prompt: string): Promise<string> {
  const response = await getClient().chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: SYSTEM_PROMPT + '\n\nОТВЕЧАЙ ТОЛЬКО в формате JSON без markdown-блоков.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 1024,
  })

  return response.choices[0].message.content ?? '{}'
}
