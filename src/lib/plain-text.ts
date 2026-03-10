export function toPlainAssistantText(text: string): string {
  if (!text) return ''

  return text
    .replace(/```[a-zA-Z0-9_-]*\n?/g, '')
    .replace(/```/g, '')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '$1')
    .replace(/<((?:https?:\/\/)[^>]+)>/g, '$1')
    .replace(/^\s*#{1,6}\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/^\s*[-*+]\s+\[(?: |x|X)\]\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/_([^_\n]+)_/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    .replace(/`([^`\n]+)`/g, '$1')
    .replace(/^\s*(?:Источники?|Sources?)\s*:?\s*$/gim, '')
    .replace(/^\s*[-*]?\s*https?:\/\/\S+\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
