import textbook from '@/data/textbook.json'

export interface QuizQuestion {
  date: string
  correctEvent: string
  options: string[] // 4 items, one is correct
  correctIndex: number
}

// Clean up PDF-extracted event text
function cleanEvent(raw: string): string {
  // Remove leading dashes/spaces
  const s = raw.replace(/^[\s\-–—]+/, '').trim()
  // Take up to first period or 90 chars
  const dot = s.search(/[.!?]/)
  const clean = dot > 20 && dot < 120 ? s.slice(0, dot + 1) : s.slice(0, 100)
  return clean.trim()
}

// Gather ALL dates from all paragraphs for distractor pool
function getAllDates(): string[] {
  const dates = new Set<string>()
  for (let i = 1; i <= 31; i++) {
    const p = textbook.paragraphs[String(i) as keyof typeof textbook.paragraphs]
    if (p?.dates) {
      p.dates.forEach((d: { date: string }) => dates.add(d.date))
    }
  }
  return Array.from(dates)
}

// Gather ALL events for distractor pool
function getAllEvents(): string[] {
  const events: string[] = []
  for (let i = 1; i <= 31; i++) {
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

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function buildQuiz(paragraphId: number): QuizQuestion[] {
  const p = textbook.paragraphs[String(paragraphId) as keyof typeof textbook.paragraphs]
  if (!p?.dates || p.dates.length < 2) return []

  const allEvents = getAllEvents()
  const questions: QuizQuestion[] = []

  p.dates.forEach((d: { date: string; event: string }) => {
    const correct = cleanEvent(d.event)
    if (correct.length < 20) return

    // Pick 3 distractors from all events pool, excluding correct
    const pool = allEvents.filter((e) => e !== correct)
    const distractors = shuffle(pool).slice(0, 3)
    if (distractors.length < 3) return

    const options = shuffle([correct, ...distractors])
    const correctIndex = options.indexOf(correct)

    questions.push({ date: d.date, correctEvent: correct, options, correctIndex })
  })

  return questions
}
