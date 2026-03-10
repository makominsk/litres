'use client'
import { create } from 'zustand'
import type { ChatMessage } from '@/types/smart-window'

interface SmartWindowStore {
  messages: ChatMessage[]
  setMessages: (messages: ChatMessage[]) => void
  addMessage: (msg: ChatMessage) => void
  updateMessage: (id: string, patch: Partial<ChatMessage>) => void
  clearMessages: () => void
}

// Без persist — история живёт в памяти до закрытия/перезагрузки страницы
export const useSmartWindowStore = create<SmartWindowStore>((set) => ({
  messages: [],

  setMessages: (messages) => set({ messages }),

  addMessage: (msg) =>
    set((state) => ({ messages: [...state.messages, msg] })),

  updateMessage: (id, patch) =>
    set((state) => ({
      messages: state.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    })),

  clearMessages: () => set({ messages: [] }),
}))
