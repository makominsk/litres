'use client'
import Link from 'next/link'
import { useAppStore } from '@/stores/app-store'

export function Header() {
  const student = useAppStore((s) => s.student)

  return (
    <header
      style={{
        background: 'linear-gradient(to bottom, #4527A0, #5E35D6)',
        borderBottom: '2px solid #7E57C2',
      }}
      className="sticky top-0 z-50 px-4 py-3"
    >
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Логотип */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-2xl">🏛️</span>
          <div>
            <div
              style={{ fontFamily: 'var(--font-heading)', color: '#FFFFFF' }}
              className="text-sm font-bold leading-tight"
            >
              История
            </div>
            <div
              style={{ fontFamily: 'var(--font-heading)', color: '#FFD93D' }}
              className="text-xs leading-tight"
            >
              Древнего мира
            </div>
          </div>
        </Link>

        {/* Ученик */}
        {student ? (
          <div className="flex items-center gap-2">
            <span className="text-lg">⭐</span>
            <span
              style={{ color: '#FFFFFF', fontFamily: 'var(--font-body)' }}
              className="text-sm font-semibold"
            >
              {student.nickname}
            </span>
          </div>
        ) : (
          <div
            style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-body)' }}
            className="text-xs"
          >
            5 класс
          </div>
        )}
      </div>
    </header>
  )
}
