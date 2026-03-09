export interface AchievementDef {
  id: string
  name: string
  description: string
  emoji: string
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first-answer', name: 'Первый шаг', description: 'Ответь на первый вопрос', emoji: '🌱' },
  { id: 'perfect-quiz', name: 'Идеальный квиз', description: 'Пройди квиз без ошибок', emoji: '💎' },
  { id: '5-paragraphs', name: 'Пять параграфов', description: 'Пройди 5 параграфов', emoji: '📚' },
  { id: 'all-greece', name: 'Знаток Греции', description: 'Пройди все параграфы Древней Греции', emoji: '🏛️' },
  { id: 'all-rome', name: 'Знаток Рима', description: 'Пройди все параграфы Древнего Рима', emoji: '⚔️' },
  { id: 'all-germanic', name: 'Знаток германцев и славян', description: 'Пройди §30 и §31', emoji: '🌲' },
  { id: 'all-31', name: 'Летописец', description: 'Пройди все 31 параграф', emoji: '👑' },
  { id: 'no-hints', name: 'Без подсказок', description: 'Ответь правильно без подсказок', emoji: '🧠' },
  { id: 'xp-500', name: '500 XP', description: 'Набери 500 XP', emoji: '⭐' },
  { id: 'xp-1000', name: '1000 XP', description: 'Набери 1000 XP', emoji: '🌟' },
]

interface CheckState {
  answers: { paragraphId: number; questionIndex: number; isCorrect: boolean; hintLevel: number }[]
  quizResults: { paragraphId: number; correctCount: number; totalCount: number }[]
  xp: number
  achievements: string[]
}

// Параграфы Греции: 1-16, Рима: 17-29
const GREECE_IDS = Array.from({ length: 16 }, (_, i) => i + 1)
const ROME_IDS = Array.from({ length: 13 }, (_, i) => i + 17)
const GERMANIC_IDS = [30, 31]
const ALL_IDS = Array.from({ length: 31 }, (_, i) => i + 1)

function getCompletedParagraphs(answers: CheckState['answers']): Set<number> {
  const byPara = new Map<number, Set<number>>()
  for (const a of answers) {
    if (!byPara.has(a.paragraphId)) byPara.set(a.paragraphId, new Set())
    byPara.get(a.paragraphId)!.add(a.questionIndex)
  }
  // Считаем параграф пройденным если есть хоть 1 ответ (упрощённо)
  const completed = new Set<number>()
  for (const [id] of byPara) {
    completed.add(id)
  }
  return completed
}

export function checkAchievements(state: CheckState): string[] {
  const newAchievements: string[] = []
  const has = new Set(state.achievements)

  function unlock(id: string) {
    if (!has.has(id)) newAchievements.push(id)
  }

  // first-answer
  if (state.answers.length >= 1) unlock('first-answer')

  // no-hints: хоть один правильный ответ без подсказок
  if (state.answers.some((a) => a.isCorrect && a.hintLevel === 0)) unlock('no-hints')

  // perfect-quiz
  if (state.quizResults.some((r) => r.correctCount === r.totalCount && r.totalCount > 0)) unlock('perfect-quiz')

  // completed paragraphs
  const completed = getCompletedParagraphs(state.answers)

  if (completed.size >= 5) unlock('5-paragraphs')
  if (GREECE_IDS.every((id) => completed.has(id))) unlock('all-greece')
  if (ROME_IDS.every((id) => completed.has(id))) unlock('all-rome')
  if (GERMANIC_IDS.every((id) => completed.has(id))) unlock('all-germanic')
  if (ALL_IDS.every((id) => completed.has(id))) unlock('all-31')

  // XP
  if (state.xp >= 500) unlock('xp-500')
  if (state.xp >= 1000) unlock('xp-1000')

  return newAchievements
}
