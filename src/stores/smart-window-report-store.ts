'use client'

import { create } from 'zustand'
import type { ImageItem } from '@/types/smart-window'

export type ReportPhase = 'idle' | 'generating' | 'done'

export interface ReportSection {
  id: string
  title: string
  content: string
}

interface SmartWindowReportStore {
  topic: string
  isGenerating: boolean
  sections: ReportSection[]
  images: ImageItem[]
  streamingText: string
  phase: ReportPhase
  setTopic: (value: string) => void
  setIsGenerating: (value: boolean) => void
  setSections: (value: ReportSection[]) => void
  setImages: (value: ImageItem[]) => void
  setStreamingText: (value: string) => void
  setPhase: (value: ReportPhase) => void
  clearReport: () => void
}

export const useSmartWindowReportStore = create<SmartWindowReportStore>((set) => ({
  topic: '',
  isGenerating: false,
  sections: [],
  images: [],
  streamingText: '',
  phase: 'idle',

  setTopic: (value) => set({ topic: value }),
  setIsGenerating: (value) => set({ isGenerating: value }),
  setSections: (value) => set({ sections: value }),
  setImages: (value) => set({ images: value }),
  setStreamingText: (value) => set({ streamingText: value }),
  setPhase: (value) => set({ phase: value }),

  clearReport: () =>
    set({
      topic: '',
      isGenerating: false,
      sections: [],
      images: [],
      streamingText: '',
      phase: 'idle',
    }),
}))
