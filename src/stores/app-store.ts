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

interface AppState {
  student: Student | null
  answers: Answer[]
  setStudent: (student: Student) => void
  clearStudent: () => void
  saveAnswer: (answer: Answer) => void
  getParaProgress: (paragraphId: number) => {
    answered: number
    correct: number
    total: number
  }
  getSectionProgress: (paragraphIds: number[]) => {
    completed: number
    total: number
  }
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      student: null,
      answers: [],

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

      getParaProgress: (paragraphId) => {
        const { answers } = get()
        const paraAnswers = answers.filter((a) => a.paragraphId === paragraphId)
        return {
          answered: paraAnswers.length,
          correct: paraAnswers.filter((a) => a.isCorrect).length,
          total: paraAnswers.length,
        }
      },

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
      }),
    }
  )
)
