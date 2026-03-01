'use client'
import Link from 'next/link'
import { useAppStore } from '@/stores/app-store'

export function Header() {
  const student = useAppStore((s) => s.student)

  return (
    <header
      className="sticky top-0 z-50 px-4 py-3"
      style={{
        background: 'linear-gradient(135deg, #1B2A4A 0%, #2A3D66 100%)',
        borderBottom: '3px solid var(--amber)',
      }}
    >
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
            style={{
              background: 'var(--amber)',
              boxShadow: '0 2px 8px rgba(245,166,35,0.3)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1B2A4A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12,6 12,12 16,14"/>
            </svg>
          </div>
          <div>
            <div
              className="text-sm font-extrabold leading-tight tracking-tight"
              style={{ color: '#FFFFFF' }}
            >
              ИстoriКвест
            </div>
            <div
              className="text-[10px] font-bold leading-tight"
              style={{ color: 'var(--amber)' }}
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
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                background: 'var(--amber)',
                color: 'var(--navy)',
              }}
            >
              {student.nickname.charAt(0).toUpperCase()}
            </div>
            <span
              className="text-xs font-bold"
              style={{ color: '#FFFFFF' }}
            >
              {student.nickname}
            </span>
          </div>
        ) : (
          <div
            className="text-xs font-semibold px-3 py-1 rounded-full"
            style={{
              color: 'rgba(255,255,255,0.5)',
              background: 'rgba(255,255,255,0.05)',
            }}
          >
            История Древнего мира
          </div>
        )}
      </div>
    </header>
  )
}
