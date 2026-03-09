'use client'
import { motion } from 'framer-motion'

interface TimelineDate {
  date: string
  event: string
}

interface TimelineStripProps {
  dates: TimelineDate[]
}

export function TimelineStrip({ dates }: TimelineStripProps) {
  if (dates.length === 0) return null

  return (
    <section
      style={{
        background: 'var(--card-bg)',
        border: '2.5px solid var(--border-color)',
        borderRadius: '14px',
        padding: '12px',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '11px',
          fontWeight: 800,
          letterSpacing: '0.08em',
          color: 'var(--ink-muted)',
          marginBottom: 10,
        }}
      >
        ⏳ ЛЕНТА ВРЕМЕНИ
      </div>

      <div
        className="overflow-x-auto"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--indigo) rgba(0,0,0,0.08)',
        }}
      >
        <div
          className="flex justify-center gap-3 pb-1"
          style={{
            minWidth: 'max-content',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 8,
              right: 8,
              top: 24,
              height: 2,
              background: 'linear-gradient(90deg, var(--indigo), #5B52D9)',
              borderRadius: 999,
              opacity: 0.75,
            }}
          />

          {dates.map((d, i) => (
            <motion.article
              key={`${d.date}-${i}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.06 }}
              style={{
                width: 190,
                flexShrink: 0,
                position: 'relative',
                zIndex: 1,
              }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: 'var(--yellow)',
                  border: '2px solid var(--border-color)',
                  boxShadow: '1.5px 1.5px 0px var(--shadow-color)',
                  margin: '0 auto 6px',
                }}
              />
              <div
                style={{
                  background: '#FF69B4',
                  color: '#000000',
                  border: '2px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '5px 10px',
                  boxShadow: '2px 2px 0px var(--shadow-color)',
                  fontFamily: 'var(--font-heading)',
                  fontSize: '16px',
                  fontWeight: 800,
                  textAlign: 'center',
                  marginBottom: 7,
                }}
              >
                {d.date}
              </div>
              <p
                style={{
                  margin: 0,
                  background: '#FFFFFF',
                  border: '2px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '8px 9px',
                  boxShadow: '2px 2px 0px var(--shadow-color)',
                  fontFamily: 'var(--font-body)',
                  color: 'var(--ink)',
                  fontSize: '12px',
                  lineHeight: 1.35,
                  fontWeight: 650,
                  minHeight: 78,
                }}
                title={d.event}
              >
                {d.event}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}