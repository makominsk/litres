'use client'

import { useTextbookStore } from '@/stores/textbook-store'

export function TextbookLauncher() {
  const openTextbook = useTextbookStore((s) => s.openTextbook)

  return (
    <button onClick={() => openTextbook()} className="btn-brutal-indigo w-full py-3 text-sm">
      📘 Открыть учебник
    </button>
  )
}
