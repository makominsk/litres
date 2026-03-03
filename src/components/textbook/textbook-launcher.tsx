'use client'

import { useTextbookStore } from '@/stores/textbook-store'

export function TextbookLauncher() {
  const openTextbook = useTextbookStore((s) => s.openTextbook)

  return (
    <div className="w-full max-w-sm mx-auto">
      <button onClick={() => openTextbook()} className="btn-terracotta w-full py-3 text-sm">
        📘 Открыть учебник
      </button>
    </div>
  )
}
