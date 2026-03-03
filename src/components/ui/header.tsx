'use client'
import Link from 'next/link'
import { useAppStore } from '@/stores/app-store'

export function Header() {
  const student = useAppStore((s) => s.student)

  return (
    <header
      style={{
        background: 'var(--indigo)',
        borderBottom: '3px solid var(--border-color)',
      }}
      className="sticky top-0 z-50 px-4 py-3"
    >
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Логотип */}
        <Link href="/" className="flex items-center gap-2 group">
          <span
            style={{
              fontSize: 24,
              background: 'var(--yellow)',
              border: '2px solid var(--border-color)',
              borderRadius: '8px',
              padding: '2px 6px',
              boxShadow: '2px 2px 0px var(--shadow-color)',
            }}
          >
            🏛️
          </span>
          <div>
            <div
              style={{ fontFamily: 'var(--font-heading)', color: '#FFFFFF' }}
              className="text-sm font-bold leading-tight"
            >
              История
            </div>
            <div
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--yellow)' }}
              className="text-xs font-bold leading-tight"
            >
              Древнего мира
            </div>
          </div>
        </Link>

        {/* Ученик */}
        {student ? (
          <div
            style={{
              background: 'var(--yellow)',
              border: '2px solid var(--border-color)',
              borderRadius: '10px',
              padding: '4px 12px',
              boxShadow: '2px 2px 0px var(--shadow-color)',
            }}
            className="flex items-center gap-2"
          >
            <span className="text-base">⭐</span>
            <span
              style={{ color: 'var(--ink)', fontFamily: 'var(--font-body)' }}
              className="text-sm font-bold"
            >
              {student.nickname}
            </span>
          </div>
        ) : (
          <div
            style={{
              color: 'rgba(255,255,255,0.7)',
              fontFamily: 'var(--font-body)',
              border: '2px solid rgba(255,255,255,0.3)',
              borderRadius: '10px',
              padding: '4px 12px',
            }}
            className="text-xs font-bold"
          >
            5 класс
          </div>
        )}
      </div>
    </header>
  )
}
