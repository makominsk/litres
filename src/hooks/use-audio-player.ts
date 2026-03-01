'use client'
import { useState, useRef, useCallback } from 'react'

export function useAudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const play = useCallback(async (text: string) => {
    if (isLoading) return
    setIsError(false)
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
      const data = await res.json()
      if (!data.audioUrl) throw new Error('No audioUrl in response')

      const audio = new Audio(data.audioUrl)
      audioRef.current = audio
      audio.onplay = () => setIsPlaying(true)
      audio.onended = () => { setIsPlaying(false); audioRef.current = null }
      audio.onerror = () => { setIsPlaying(false); setIsError(true); audioRef.current = null }
      await audio.play()
    } catch (err) {
      console.error('[useAudioPlayer]', err)
      setIsError(true)
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

  return { play, stop, isPlaying, isLoading, isError }
}
