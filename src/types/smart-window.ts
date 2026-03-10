export type SmartMode = 'discussion' | 'report' | 'exam' | 'search'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: SearchSource[]
  images?: ImageItem[]
  isStreaming?: boolean
}

export interface SearchSource {
  title: string
  url: string
  snippet: string
}

export interface ImageItem {
  title: string
  url: string
  thumb: string
  description: string
  source: string
}

export interface ModeParams {
  topic?: string
  sectionId?: string
  paragraphIds?: number[]
  initialQuery?: string
}

// SSE event types streamed from /api/agent-chat
export type SSEEvent =
  | { type: 'text'; content: string }
  | { type: 'thinking'; content: string }
  | { type: 'sources'; items: SearchSource[] }
  | { type: 'images'; items: ImageItem[] }
  | { type: 'mode_switch'; target: SmartMode; params: ModeParams }
  | { type: 'error'; content: string }
  | { type: 'done' }
