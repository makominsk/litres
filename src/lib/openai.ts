import OpenAI from 'openai'
import { SYSTEM_PROMPT } from './prompts'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

// gpt-4o-mini: fast, cheap (~$0.001/request), high rate limits, perfect for education apps
const MODEL = 'gpt-4o-mini'

export async function generateContent(prompt: string): Promise<string> {
  const response = await openai.chat.completions.create({
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
