'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Student {
  id: string
  nickname: string
}

interface Answer {
  paragraphId: number
  questionIndex: number
  isCorrect: boolean
  hintLevel: number
}

interface QuizResult {
  paragraphId: number
  correctCount: number
  totalCount: number
}

interface AppState {
  student: Student | null
  answers: Answer[]
  quizResults: QuizResult[]
  setStudent: (student: Student) => void
  clearStudent: () => void
  saveAnswer: (answer: Answer) => void
  saveQuizResult: (result: QuizResult) => void
  getQuizResult: (paragraphId: number) => QuizResult | null
  clearQuizResult: (paragraphId: number) => void
  getParaProgress: (paragraphId: number) => {
    answered: number
    correct: number
    total: number
  }
  getSectionProgress: (paragraphIds: number[]) => {
    completed: number
    total: number
  }
  getWrongQuestions: (paragraphId: number) => number[]
  clearParagraphAnswers: (paragraphId: number) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      student: null,
      answers: [],
      quizResults: [],

      setStudent: (student) => set({ student }),
      clearStudent: () => set({ student: null }),

      saveAnswer: (answer) =>
        set((state) => {
          const existing = state.answers.findIndex(
            (a) => a.paragraphId === answer.paragraphId && a.questionIndex === answer.questionIndex
          )
          if (existing >= 0) {
            const updated = [...state.answers]
            updated[existing] = answer
            return { answers: updated }
          }
          return { answers: [...state.answers, answer] }
        }),

      saveQuizResult: (result) =>
        set((state) => {
          const existing = state.quizResults.findIndex((r) => r.paragraphId === result.paragraphId)
          if (existing >= 0) {
            const updated = [...state.quizResults]
            updated[existing] = result
            return { quizResults: updated }
          }
          return { quizResults: [...state.quizResults, result] }
        }),

      getQuizResult: (paragraphId) =>
        get().quizResults.find((r) => r.paragraphId === paragraphId) ?? null,

      clearQuizResult: (paragraphId) =>
        set((state) => ({
          quizResults: state.quizResults.filter((r) => r.paragraphId !== paragraphId),
        })),

      getParaProgress: (paragraphId) => {
        const { answers } = get()
        const paraAnswers = answers.filter((a) => a.paragraphId === paragraphId)
        return {
          answered: paraAnswers.length,
          correct: paraAnswers.filter((a) => a.isCorrect).length,
          total: paraAnswers.length,
        }
      },

      getWrongQuestions: (paragraphId) => {
        const { answers } = get()
        return answers
          .filter((a) => a.paragraphId === paragraphId && !a.isCorrect)
          .map((a) => a.questionIndex)
      },

      clearParagraphAnswers: (paragraphId) =>
        set((state) => ({
          answers: state.answers.filter((a) => a.paragraphId !== paragraphId),
        })),

      getSectionProgress: (paragraphIds) => {
        const { answers } = get()
        const completed = paragraphIds.filter((id) => {
          const paraAnswers = answers.filter((a) => a.paragraphId === id)
          return paraAnswers.length > 0
        }).length
        return { completed, total: paragraphIds.length }
      },
    }),
    {
      name: 'litres-app-store',
      partialize: (state) => ({
        student: state.student,
        answers: state.answers,
        quizResults: state.quizResults,
      }),
    }
  )
)
