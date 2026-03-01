import textbook from '@/data/textbook.json'

export interface QuizQuestion {
  date: string
  correctEvent: string
  options: string[] // 4 items, one is correct
  correctIndex: number
}

// Clean up PDF-extracted event text
function cleanEvent(raw: string): string {
  const s = raw.replace(/^[\s\-–—]+/, '').trim()
  const dot = s.search(/[.!?]/)
  const clean = dot > 20 && dot < 120 ? s.slice(0, dot + 1) : s.slice(0, 100)
  return clean.trim()
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Get events from specific paragraph ids
function getEventsFromParagraphs(paraIds: number[], excludeParagraphId?: number): string[] {
  const events: string[] = []
  for (const id of paraIds) {
    if (id === excludeParagraphId) continue
    const p = textbook.paragraphs[String(id) as keyof typeof textbook.paragraphs]
    if (p?.dates) {
      p.dates.forEach((d: { date: string; event: string }) => {
        const clean = cleanEvent(d.event)
        if (clean.length > 20) events.push(clean)
      })
    }
  }
  return events
}

// Find which section a paragraph belongs to
function getSectionParaIds(paragraphId: number): number[] {
  for (const section of textbook.sections) {
    if ((section.paragraphs as number[]).includes(paragraphId)) {
      return section.paragraphs as number[]
    }
  }
  return []
}

// Get all events from all paragraphs
function getAllEvents(excludeParagraphId?: number): string[] {
  const events: string[] = []
  for (let i = 1; i <= 31; i++) {
    if (i === excludeParagraphId) continue
    const p = textbook.paragraphs[String(i) as keyof typeof textbook.paragraphs]
    if (p?.dates) {
      p.dates.forEach((d: { date: string; event: string }) => {
        const clean = cleanEvent(d.event)
        if (clean.length > 20) events.push(clean)
      })
    }
  }
  return events
}

export function buildQuiz(paragraphId: number): QuizQuestion[] {
  const p = textbook.paragraphs[String(paragraphId) as keyof typeof textbook.paragraphs]
  if (!p?.dates || p.dates.length < 2) return []

  // Prefer distractors from same section (harder, more plausible)
  const sectionParaIds = getSectionParaIds(paragraphId)
  const sectionEvents = getEventsFromParagraphs(sectionParaIds, paragraphId)
  // Fallback: all events from other paragraphs
  const allEvents = getAllEvents(paragraphId)

  const questions: QuizQuestion[] = []

  p.dates.forEach((d: { date: string; event: string }) => {
    const correct = cleanEvent(d.event)
    if (correct.length < 20) return

    // Build distractor pool: section-first, then global, dedup
    const sectionPool = sectionEvents.filter((e) => e !== correct)
    const globalPool = allEvents.filter((e) => e !== correct && !sectionPool.includes(e))
    const pool = [...shuffle(sectionPool), ...shuffle(globalPool)]

    // Take 3 unique distractors
    const distractors: string[] = []
    for (const e of pool) {
      if (!distractors.includes(e)) distractors.push(e)
      if (distractors.length === 3) break
    }

    if (distractors.length < 3) return

    const options = shuffle([correct, ...distractors])
    const correctIndex = options.indexOf(correct)

    questions.push({ date: d.date, correctEvent: correct, options, correctIndex })
  })

  return questions
}
