'use client'
import Link from 'next/link'
import { useAppStore } from '@/stores/app-store'

export function Header() {
  const student = useAppStore((s) => s.student)

  return (
    <header
      className="sticky top-0 z-50 px-4 py-3"
      style={{
        background: 'var(--white)',
        borderBottom: '1px solid var(--gray-200)',
      }}
    >
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: 'var(--primary-600)',
              color: 'var(--white)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12,6 12,12 16,14"/>
            </svg>
          </div>
          <div>
            <div
              className="text-sm font-extrabold leading-tight tracking-tight"
              style={{ color: 'var(--gray-900)' }}
            >
              ИстoriКвест
            </div>
            <div
              className="text-[10px] font-bold leading-tight"
              style={{ color: 'var(--primary-500)' }}
            >
              5 класс
            </div>
          </div>
        </Link>

        {/* Student */}
        {student ? (
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{
              background: 'var(--primary-50)',
              border: '1px solid var(--primary-100)',
            }}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                background: 'var(--primary-600)',
                color: 'var(--white)',
              }}
            >
              {student.nickname.charAt(0).toUpperCase()}
            </div>
            <span
              className="text-xs font-bold"
              style={{ color: 'var(--gray-900)' }}
            >
              {student.nickname}
            </span>
          </div>
        ) : (
          <div
            className="text-xs font-semibold px-3 py-1 rounded-full"
            style={{
              color: 'var(--gray-500)',
              background: 'var(--gray-100)',
            }}
          >
            История Древнего мира
          </div>
        )}
      </div>
    </header>
  )
}
