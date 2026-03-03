'use client'

import { useEffect, useMemo, useState } from 'react'
import textbook from '@/data/textbook.json'
import textbookPages from '@/data/textbook-pages.json'
import { useTextbookStore } from '@/stores/textbook-store'

export function TextbookModal() {
  const isOpen = useTextbookStore((s) => s.isOpen)
  const closeTextbook = useTextbookStore((s) => s.closeTextbook)
  const currentPage = useTextbookStore((s) => s.currentPage)
  const totalPages = useTextbookStore((s) => s.totalPages)
  const nextPage = useTextbookStore((s) => s.nextPage)
  const prevPage = useTextbookStore((s) => s.prevPage)
  const goToPage = useTextbookStore((s) => s.goToPage)
  const selectedParagraphId = useTextbookStore((s) => s.selectedParagraphId)
  const setSelectedParagraphId = useTextbookStore((s) => s.setSelectedParagraphId)

  const [pageInput, setPageInput] = useState(String(currentPage))

  useEffect(() => {
    setPageInput(String(currentPage))
  }, [currentPage])

  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeTextbook()
      if (event.key === 'ArrowLeft') prevPage()
      if (event.key === 'ArrowRight') nextPage()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, closeTextbook, nextPage, prevPage])

  const paragraphs = useMemo(
    () =>
      Object.values(textbook.paragraphs)
        .map((paragraph) => ({
          id: paragraph.id,
          title: paragraph.title,
        }))
        .sort((a, b) => a.id - b.id),
    []
  )

  function handlePageSubmit(e: React.FormEvent) {
    e.preventDefault()
    const page = Number(pageInput)
    if (!Number.isFinite(page)) return
    goToPage(page)
  }

  function handleParagraphGo() {
    if (!selectedParagraphId) return
    const range = textbookPages[String(selectedParagraphId) as keyof typeof textbookPages]
    if (!range) return
    goToPage(range.startPage)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[70] textbook-safe-top" style={{ background: 'rgba(15, 23, 42, 0.82)' }}>
      <div className="w-full h-full p-2 sm:p-4">
        <div
          className="w-full h-full flex flex-col overflow-hidden textbook-modal-content"
          style={{
            background: 'var(--card-bg)',
            border: '2.5px solid var(--border-color)',
            boxShadow: '8px 8px 0px var(--shadow-color)',
          }}
        >
          <div
            className="p-3 sm:p-4 flex flex-col gap-3 border-b-2"
            style={{ borderColor: 'var(--border-color)', background: 'var(--bg-dark)' }}
          >
            <div className="flex items-center justify-between gap-2">
              <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink)' }} className="text-base sm:text-lg font-extrabold">
                Учебник
              </h2>
              <button onClick={closeTextbook} className="btn-brutal-secondary px-3 py-1.5 text-xs sm:text-sm">
                ✕ Закрыть
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={prevPage}
                  disabled={currentPage <= 1}
                  className="btn-brutal-secondary px-3 py-2 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Пред.
                </button>
                <button
                  type="button"
                  onClick={nextPage}
                  disabled={currentPage >= totalPages}
                  className="btn-brutal-secondary px-3 py-2 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  След. →
                </button>
                <span style={{ color: 'var(--ink)', fontFamily: 'var(--font-body)' }} className="text-xs sm:text-sm font-bold">
                  Стр. {currentPage} / {totalPages}
                </span>
              </div>

              <form onSubmit={handlePageSubmit} className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  className="w-24 px-2 py-2 text-xs sm:text-sm font-bold rounded-md"
                  style={{
                    background: '#fff',
                    color: 'var(--ink)',
                    border: '2px solid var(--border-color)',
                    fontFamily: 'var(--font-body)',
                  }}
                />
                <button type="submit" className="btn-brutal-secondary px-3 py-2 text-xs sm:text-sm">
                  Перейти
                </button>
              </form>

              <div className="flex items-center gap-2">
                <select
                  value={selectedParagraphId ?? ''}
                  onChange={(e) =>
                    setSelectedParagraphId(e.target.value ? Number(e.target.value) : null)
                  }
                  className="min-w-40 px-2 py-2 text-xs sm:text-sm font-bold rounded-md"
                  style={{
                    background: '#fff',
                    color: 'var(--ink)',
                    border: '2px solid var(--border-color)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  <option value="" disabled>
                    Выбери §
                  </option>
                  {paragraphs.map((paragraph) => (
                    <option key={paragraph.id} value={paragraph.id}>
                      §{paragraph.id}: {paragraph.title}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleParagraphGo}
                  disabled={!selectedParagraphId}
                  className="btn-brutal-secondary px-3 py-2 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  К §
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 p-2 sm:p-3">
            <iframe
              title="Учебник PDF"
              className="w-full h-full rounded-md"
              style={{
                background: '#fff',
                border: '2px solid var(--border-color)',
              }}
              src={`/textbook.pdf#page=${currentPage}&zoom=page-width`}
            />
            <p style={{ color: 'var(--ink-muted)', fontFamily: 'var(--font-body)' }} className="text-[11px] mt-2 font-semibold">
              Файл должен лежать в <code>/public/textbook.pdf</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
