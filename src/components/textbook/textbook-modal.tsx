'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import textbook from '@/data/textbook.json'
import textbookPages from '@/data/textbook-pages.json'
import { useTextbookStore } from '@/stores/textbook-store'

const FIRST_NUMBERED_PDF_PAGE = 7
const LAST_NUMBERED_PDF_PAGE = 137
const FIRST_TEXTBOOK_PAGE = 4
const LAST_TEXTBOOK_PAGE = 134

function pdfToTextbookPage(pdfPage: number) {
  if (pdfPage < FIRST_NUMBERED_PDF_PAGE || pdfPage > LAST_NUMBERED_PDF_PAGE) return null
  return pdfPage - 3
}

function textbookToPdfPage(textbookPage: number) {
  if (textbookPage < FIRST_TEXTBOOK_PAGE || textbookPage > LAST_TEXTBOOK_PAGE) return null
  return textbookPage + 3
}

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

  const textbookPage = pdfToTextbookPage(currentPage)
  const pageInputRef = useRef<HTMLInputElement>(null)
  const [iframeLoading, setIframeLoading] = useState(true)

  useEffect(() => {
    setIframeLoading(true)
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
    const raw = pageInputRef.current?.value ?? String(textbookPage ?? FIRST_TEXTBOOK_PAGE)
    const textbookPageToGo = Number(raw)
    if (!Number.isFinite(textbookPageToGo)) return
    const pdfPage = textbookToPdfPage(textbookPageToGo)
    if (!pdfPage) return
    goToPage(pdfPage)
  }

  function handleParagraphGo() {
    if (!selectedParagraphId) return
    const range = textbookPages[String(selectedParagraphId) as keyof typeof textbookPages]
    if (!range) return
    goToPage(range.startPage)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[2000] textbook-safe-top" style={{ background: 'rgba(15, 23, 42, 0.82)' }}>
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
              <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink)' }} className="text-lg sm:text-xl font-extrabold">
                Учебник
              </h2>
              <button onClick={closeTextbook} className="btn-brutal-secondary px-3 py-2 text-sm sm:text-base">
                ✕ Закрыть
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={prevPage}
                  disabled={currentPage <= 1}
                  className="btn-brutal-secondary px-3 py-2 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Пред.
                </button>
                <button
                  type="button"
                  onClick={nextPage}
                  disabled={currentPage >= totalPages}
                  className="btn-brutal-secondary px-3 py-2 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  След. →
                </button>
                <span style={{ color: 'var(--ink)', fontFamily: 'var(--font-body)' }} className="text-sm sm:text-base font-bold">
                  Стр. {textbookPage ?? '—'} / {LAST_TEXTBOOK_PAGE}
                </span>
              </div>

              <form onSubmit={handlePageSubmit} className="flex items-center gap-2">
                <input
                  key={textbookPage ?? FIRST_TEXTBOOK_PAGE}
                  ref={pageInputRef}
                  type="number"
                  min={FIRST_TEXTBOOK_PAGE}
                  max={LAST_TEXTBOOK_PAGE}
                  defaultValue={textbookPage ? String(textbookPage) : String(FIRST_TEXTBOOK_PAGE)}
                  className="w-24 px-2 py-2 text-sm sm:text-base font-bold rounded-md"
                  style={{
                    background: '#fff',
                    color: 'var(--ink)',
                    border: '2px solid var(--border-color)',
                    fontFamily: 'var(--font-body)',
                  }}
                />
                <button type="submit" className="btn-brutal-secondary px-3 py-2 text-sm sm:text-base">
                  Перейти
                </button>
              </form>

              <div className="flex items-center gap-2">
                <select
                  value={selectedParagraphId ?? ''}
                  onChange={(e) =>
                    setSelectedParagraphId(e.target.value ? Number(e.target.value) : null)
                  }
                  className="min-w-40 px-2 py-2 text-sm sm:text-base font-bold rounded-md"
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
                  className="btn-brutal-secondary px-3 py-2 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  К §
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 p-2 sm:p-3">
            <div className="relative w-full h-full">
              {iframeLoading && (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-md z-10"
                  style={{ background: 'var(--bg-dark)', border: '2px solid var(--border-color)' }}
                >
                  <div
                    className="w-10 h-10 rounded-full border-4 border-[var(--indigo)] border-t-transparent animate-spin"
                  />
                  <p style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-muted)' }} className="text-sm font-bold">
                    Загружаю учебник...
                  </p>
                </div>
              )}
              <iframe
                title="Учебник PDF"
                className="w-full h-full rounded-md"
                style={{
                  background: '#fff',
                  border: '2px solid var(--border-color)',
                  opacity: iframeLoading ? 0 : 1,
                }}
                src={`/textbook.pdf#page=${currentPage}&zoom=page-width`}
                onLoad={() => setIframeLoading(false)}
              />
            </div>
            <p style={{ color: 'var(--ink-muted)', fontFamily: 'var(--font-body)' }} className="text-xs sm:text-sm mt-2 font-semibold">
              Поле страницы работает по нумерации учебника (стр. 4-134).
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
