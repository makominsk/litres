'use client'
import { useState, useRef, useCallback } from 'react'

export function useAudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const play = useCallback(async (text: string) => {
    if (isLoading) return
    try {
      setIsLoading(true)
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }

      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      if (!res.ok) throw new Error('TTS failed')
      const { audioUrl } = await res.json()

      const audio = new Audio(audioUrl)
      audioRef.current = audio
      audio.onplay = () => setIsPlaying(true)
      audio.onended = () => { setIsPlaying(false); audioRef.current = null }
      audio.onerror = () => { setIsPlaying(false); audioRef.current = null }
      await audio.play()
    } catch (err) {
      console.error('[useAudioPlayer]', err)
    } finally {
      setIsLoading(false)
    }
  }, [isLoading])

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setIsPlaying(false)
  }, [])

  return { play, stop, isPlaying, isLoading }
}
