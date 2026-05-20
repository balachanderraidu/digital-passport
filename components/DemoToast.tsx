'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, X } from 'lucide-react'

interface ToastMessage {
  id: number
  text: string
  icon?: string
}

let addToastFn: ((text: string, icon?: string) => void) | null = null

/** Call this from anywhere to fire a demo toast */
export function showDemoToast(text: string, icon?: string) {
  addToastFn?.(text, icon)
}

export function DemoToastProvider() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  useEffect(() => {
    addToastFn = (text, icon) => {
      const id = Date.now()
      setToasts((prev) => [...prev, { id, text, icon }])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 3500)
    }
    return () => { addToastFn = null }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-16 inset-x-4 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-vault-surface border border-gold-500/30 shadow-2xl shadow-black/60 backdrop-blur-xl animate-slide-up pointer-events-auto"
        >
          {t.icon
            ? <span className="text-lg flex-shrink-0">{t.icon}</span>
            : <CheckCircle2 size={18} className="text-green-400 flex-shrink-0" />
          }
          <p className="text-sm font-semibold text-white flex-1 leading-snug">{t.text}</p>
          <button
            aria-label="Dismiss notification"
            onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
            className="text-vault-text-muted hover:text-white transition-colors flex-shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
