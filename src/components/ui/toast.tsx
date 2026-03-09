'use client'
import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  message: string
  type: ToastType
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

let nextId = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = nextId++
    setToasts((prev) => [...prev, { id, message, type }])
  }, [])

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        style={{
          position: 'fixed',
          top: 70,
          right: 16,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          pointerEvents: 'none',
          maxWidth: 340,
        }}
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDone={() => removeToast(toast.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onDone }: { toast: Toast; onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 3000)
    return () => clearTimeout(timer)
  }, [onDone])

  const bg =
    toast.type === 'success' ? '#D1FAE5' :
    toast.type === 'error' ? 'var(--pink-light)' :
    'var(--yellow-light)'

  const shadow =
    toast.type === 'success' ? '3px 3px 0px #065F46' :
    toast.type === 'error' ? '3px 3px 0px #9F1239' :
    '3px 3px 0px #92400E'

  const icon =
    toast.type === 'success' ? '✓' :
    toast.type === 'error' ? '✕' :
    'ℹ'

  return (
    <motion.div
      initial={{ opacity: 0, x: 60, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.9 }}
      transition={{ duration: 0.25 }}
      style={{
        background: bg,
        border: '2.5px solid var(--border-color)',
        borderRadius: '12px',
        padding: '10px 14px',
        boxShadow: shadow,
        pointerEvents: 'auto',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
      onClick={onDone}
    >
      <span style={{
        fontFamily: 'var(--font-heading)',
        fontSize: '14px',
        fontWeight: 800,
        width: 22,
        height: 22,
        borderRadius: '50%',
        border: '2px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        background: 'var(--card-bg)',
      }}>
        {icon}
      </span>
      <span style={{
        fontFamily: 'var(--font-body)',
        fontSize: '13px',
        fontWeight: 700,
        color: 'var(--ink)',
        lineHeight: 1.3,
      }}>
        {toast.message}
      </span>
    </motion.div>
  )
}
