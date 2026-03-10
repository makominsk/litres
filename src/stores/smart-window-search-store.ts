'use client'

import { create } from 'zustand'
import type { ChatMessage } from '@/types/smart-window'

type MessagesUpdater = ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])

interface SmartWindowSearchStore {
  messages: ChatMessage[]
  hasSearched: boolean
  setMessages: (updater: MessagesUpdater) => void
  setHasSearched: (value: boolean) => void
  clearSearch: () => void
}

export const useSmartWindowSearchStore = create<SmartWindowSearchStore>((set) => ({
  messages: [],
  hasSearched: false,

  setMessages: (updater) =>
    set((state) => ({
      messages: typeof updater === 'function' ? (updater as (prev: ChatMessage[]) => ChatMessage[])(state.messages) : updater,
    })),

  setHasSearched: (value) => set({ hasSearched: value }),

  clearSearch: () => set({ messages: [], hasSearched: false }),
}))
