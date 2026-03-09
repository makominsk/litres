import textbook from '@/data/textbook.json'

export interface QuizQuestion {
  date: string
  correctEvent: string
  options: string[] // 4 items, one is correct
  correctIndex: number
}

function normalizeForCompare(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,:;!?()«»"']/g, ' ')
    .replace(/[—–-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenOverlap(a: string, b: string): number {
  const ta = new Set(normalizeForCompare(a).split(' ').filter((w) => w.length > 3))
  const tb = new Set(normalizeForCompare(b).split(' ').filter((w) => w.length > 3))
  if (ta.size === 0 || tb.size === 0) return 0
  let common = 0
  for (const w of ta) {
    if (tb.has(w)) common++
  }
  return common / Math.min(ta.size, tb.size)
}

function isTooSimilar(a: string, b: string): boolean {
  if (normalizeForCompare(a) === normalizeForCompare(b)) return true
  return tokenOverlap(a, b) >= 0.5
}

// Clean up PDF-extracted event text
function cleanEvent(raw: string): string {
  // Strip PDF artifacts (e.g. "ЂР", "ЂД", "Ђ" followed by letter)
  const deArtifacted = raw.replace(/Ђ[А-ЯA-Z]?/g, '')
  const s = deArtifacted.replace(/^[\s\-–—]+/, '').trim()
  // Must start with a capital letter (real sentence)
  if (!/^[А-ЯA-ZЁ«"0-9]/.test(s)) return ''
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

// Find which section a paragraph belongs to
function getSectionParaIds(paragraphId: number): number[] {
  for (const section of textbook.sections) {
    if ((section.paragraphs as number[]).includes(paragraphId)) {
      return section.paragraphs as number[]
    }
  }
  return []
}

// Get events from an expanding ring of adjacent same-section paragraphs
// Ring 1 = ±1, Ring 2 = ±2, etc. — stops when we have enough distractors
function getAdjacentPool(paragraphId: number, correct: string): string[] {
  const sectionParaIds = getSectionParaIds(paragraphId)
  const pos = sectionParaIds.indexOf(paragraphId)
  if (pos === -1) return []

  const collected: string[] = []
  const seen = new Set<string>([correct])

  for (let radius = 1; radius <= 4; radius++) {
    const ids = [
      sectionParaIds[pos - radius],
      sectionParaIds[pos + radius],
    ].filter((id): id is number => id !== undefined)

    for (const id of ids) {
      const para = textbook.paragraphs[String(id) as keyof typeof textbook.paragraphs]
      if (!para?.dates) continue
      para.dates.forEach((d: { date: string; event: string }) => {
        const clean = cleanEvent(d.event)
        if (clean.length > 20 && !seen.has(clean)) {
          seen.add(clean)
          collected.push(clean)
        }
      })
    }

    if (collected.length >= 3) break
  }

  return collected
}

export function buildQuiz(paragraphId: number): QuizQuestion[] {
  const p = textbook.paragraphs[String(paragraphId) as keyof typeof textbook.paragraphs]
  if (!p?.dates || p.dates.length < 2) return []

  const localCorrectEvents = p.dates
    .map((d: { date: string; event: string }) => cleanEvent(d.event))
    .filter((e) => e.length >= 20)

  const questions: QuizQuestion[] = []

  p.dates.forEach((d: { date: string; event: string }) => {
    const correct = cleanEvent(d.event)
    if (correct.length < 20) return

    // Pool: expanding ring of adjacent same-section paragraphs (±1, ±2, ±3, ±4)
    const pool = shuffle(getAdjacentPool(paragraphId, correct)).filter((candidate) => {
      if (isTooSimilar(candidate, correct)) return false
      return !localCorrectEvents.some((localCorrect) => (
        localCorrect !== correct && isTooSimilar(candidate, localCorrect)
      ))
    })

    // Take 3 unique distractors
    const distractors = pool.slice(0, 3)
    if (distractors.length < 3) return

    const options = shuffle([correct, ...distractors])
    const correctIndex = options.indexOf(correct)

    questions.push({ date: d.date, correctEvent: correct, options, correctIndex })
  })

  return questions
}
