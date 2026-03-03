'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const DEFAULT_TOTAL_PAGES = 141

function clampPage(page: number, totalPages: number) {
  if (page < 1) return 1
  if (page > totalPages) return totalPages
  return page
}

interface TextbookState {
  isOpen: boolean
  currentPage: number
  totalPages: number
  selectedParagraphId: number | null
  openTextbook: (page?: number) => void
  closeTextbook: () => void
  goToPage: (page: number) => void
  nextPage: () => void
  prevPage: () => void
  setSelectedParagraphId: (paragraphId: number | null) => void
}

export const useTextbookStore = create<TextbookState>()(
  persist(
    (set) => ({
      isOpen: false,
      currentPage: 1,
      totalPages: DEFAULT_TOTAL_PAGES,
      selectedParagraphId: null,

      openTextbook: (page) =>
        set((state) => ({
          isOpen: true,
          currentPage:
            typeof page === 'number' ? clampPage(page, state.totalPages) : state.currentPage,
        })),

      closeTextbook: () => set({ isOpen: false }),

      goToPage: (page) =>
        set((state) => ({
          currentPage: clampPage(page, state.totalPages),
        })),

      nextPage: () =>
        set((state) => ({
          currentPage: clampPage(state.currentPage + 1, state.totalPages),
        })),

      prevPage: () =>
        set((state) => ({
          currentPage: clampPage(state.currentPage - 1, state.totalPages),
        })),

      setSelectedParagraphId: (paragraphId) => set({ selectedParagraphId: paragraphId }),
    }),
    {
      name: 'litres-textbook-store',
      partialize: (state) => ({
        currentPage: state.currentPage,
        totalPages: state.totalPages,
        selectedParagraphId: state.selectedParagraphId,
      }),
    }
  )
)
