'use client'
import Link from 'next/link'
import { useAppStore, getLevel } from '@/stores/app-store'

export function Header() {
  const student = useAppStore((s) => s.student)
  const xp = useAppStore((s) => s.xp)
  const level = getLevel(xp)

  return (
    <header
      style={{
        background: 'var(--indigo)',
        borderBottom: '3px solid var(--border-color)',
      }}
      className="sticky top-0 z-50 px-3 py-2"
    >
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
        {/* Логотип */}
        <Link href="/" className="flex items-center gap-1.5 shrink-0 group">
          <span
            style={{
              fontSize: 22,
              background: 'var(--yellow)',
              border: '2px solid var(--border-color)',
              borderRadius: '8px',
              padding: '2px 5px',
              boxShadow: '2px 2px 0px var(--shadow-color)',
            }}
          >
            🏛️
          </span>
          <div className="hidden xs:block">
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

        {/* Правая часть: XP + достижения + ученик */}
        <div className="flex items-center gap-1.5 min-w-0">
          {/* XP бейдж — только на sm+ */}
          {xp > 0 && (
            <div
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: '2px solid rgba(255,255,255,0.3)',
                borderRadius: '10px',
                padding: '3px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span style={{ fontSize: 13 }}>{level.emoji}</span>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '10px',
                    fontWeight: 800,
                    color: 'var(--yellow)',
                    lineHeight: 1,
                  }}
                >
                  {level.name}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                  <div
                    style={{
                      width: 32,
                      height: 3,
                      borderRadius: 2,
                      background: 'rgba(255,255,255,0.2)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        borderRadius: 2,
                        background: 'var(--yellow)',
                        width: level.xpForNext > 0
                          ? `${(level.xpInLevel / level.xpForNext) * 100}%`
                          : '100%',
                        transition: 'width 0.3s',
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '9px',
                      fontWeight: 700,
                      color: 'rgba(255,255,255,0.6)',
                      lineHeight: 1,
                    }}
                  >
                    {xp}
                  </span>
                </div>
              </div>
            </div>
          )}

          <Link
            href="/achievements"
            style={{
              background: '#FFFFFF',
              border: '2px solid var(--border-color)',
              borderRadius: '10px',
              padding: '4px 10px',
              minHeight: 32,
              boxShadow: '2px 2px 0px var(--shadow-color)',
              color: 'var(--ink)',
              fontFamily: 'var(--font-body)',
              fontSize: '0.8rem',
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
            className="flex items-center justify-center transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5"
          >
            🏆 <span className="ml-1 hidden sm:inline">Достижения</span>
          </Link>

          {/* Ученик */}
          {student ? (
            <div
              style={{
                background: 'var(--yellow)',
                border: '2px solid var(--border-color)',
                borderRadius: '10px',
                padding: '4px 10px',
                minHeight: 32,
                maxWidth: 120,
                boxShadow: '2px 2px 0px var(--shadow-color)',
              }}
              className="flex items-center justify-center gap-1.5"
            >
              <span className="text-sm">⭐</span>
              <span
                style={{ color: 'var(--ink)', fontFamily: 'var(--font-body)' }}
                className="text-xs font-bold truncate"
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
                padding: '4px 10px',
                minHeight: 32,
              }}
              className="text-xs font-bold hidden sm:flex items-center justify-center"
            >
              5 класс
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
