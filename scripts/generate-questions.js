/**
 * Regenerates questions for all paragraphs in textbook.json using Gemini.
 * Run: node scripts/generate-questions.js
 */
/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require('fs')
const path = require('path')

// Load .env.local manually
function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env.local')
  if (!fs.existsSync(envPath)) {
    throw new Error('.env.local not found')
  }
  const lines = fs.readFileSync(envPath, 'utf8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
    process.env[key] = value
  }
}

loadEnv()

const { GoogleGenerativeAI } = require('@google/generative-ai')

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY)
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 512,
    responseMimeType: 'application/json',
  },
})

async function generateQuestions(title, content) {
  const prompt = `Ты учитель истории для 5 класса. Параграф учебника: "${title}"

Текст параграфа (начало):
${content.slice(0, 1200)}

---

Составь ровно 4 вопроса к этому параграфу для проверки знаний ученика 5 класса (10-11 лет).
Требования:
- Каждый вопрос должен заканчиваться знаком "?"
- Вопросы должны быть на ПОНИМАНИЕ (не на пересказ дат или имён)
- Простой язык — понятный 10-летнему ребёнку
- Вопросы разной сложности: 1 простой, 2 средних, 1 сложный

Ответь СТРОГО в формате JSON:
{
  "questions": [
    "Вопрос 1?",
    "Вопрос 2?",
    "Вопрос 3?",
    "Вопрос 4?"
  ]
}`

  const result = await model.generateContent(prompt)
  const raw = result.response.text()
  const parsed = JSON.parse(raw)
  return parsed.questions
}

async function main() {
  const dataPath = path.resolve(__dirname, '../src/data/textbook.json')
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'))

  const paragraphs = data.paragraphs
  const keys = Object.keys(paragraphs)

  console.log(`Processing ${keys.length} paragraphs...\n`)

  let updated = 0
  for (const key of keys) {
    const para = paragraphs[key]
    const goodQ = para.questions.filter(q => q.includes('?')).length
    const total = para.questions.length

    // Only skip if ALL questions are already proper questions
    if (goodQ === total && total >= 3) {
      console.log(`[SKIP] §${key}: ${para.title.slice(0, 50)} (${total} good questions)`)
      continue
    }

    console.log(`[GEN]  §${key}: ${para.title.slice(0, 50)} (${goodQ}/${total} good)`)

    try {
      const questions = await generateQuestions(para.title, para.content)
      para.questions = questions
      updated++
      console.log(`       → Generated: ${questions.map(q => q.slice(0, 50)).join(' | ')}`)
    } catch (err) {
      console.error(`       ✗ Error: ${err.message}`)
    }

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 1500))
  }

  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8')
  console.log(`\nDone! Updated ${updated} paragraphs.`)
}

main().catch(console.error)
