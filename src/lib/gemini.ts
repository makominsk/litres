import { GoogleGenerativeAI } from '@google/generative-ai'
import { SYSTEM_PROMPT } from './prompts'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)

export const geminiModel = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  systemInstruction: SYSTEM_PROMPT,
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 1024,
    responseMimeType: 'application/json',
  },
})

export async function generateContent(prompt: string): Promise<string> {
  const result = await geminiModel.generateContent(prompt)
  return result.response.text()
}
