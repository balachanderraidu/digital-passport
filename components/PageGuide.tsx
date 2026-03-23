'use client'

import { useState, useEffect } from 'react'
import { X, Info } from 'lucide-react'

interface PageGuideProps {
  id: string
  title: string
  children: React.ReactNode
}

export function PageGuide({ id, title, children }: PageGuideProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem(`dp_guide_${id}`)
    if (!dismissed) {
      setIsVisible(true)
    }
  }, [id])

  if (!isVisible) return null

  const handleDismiss = () => {
    localStorage.setItem(`dp_guide_${id}`, 'true')
    setIsVisible(false)
  }

  return (
    <div className="mb-6 p-4 rounded-3xl bg-gold-500/10 border border-gold-500/20 relative animate-fade-in shadow-gold-glow-sm">
      <button 
        onClick={handleDismiss}
        className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-vault-surface text-vault-text hover:text-white hover:bg-vault-border transition-colors border border-vault-border"
        aria-label="Dismiss guide"
      >
        <X size={16} />
      </button>
      <div className="flex gap-3">
        <div className="mt-0.5 w-8 h-8 rounded-full rounded-tl-sm bg-gold-gradient flex items-center justify-center flex-shrink-0 shadow-gold-glow">
          <Info className="text-charcoal-300" size={16} strokeWidth={2.5} />
        </div>
        <div className="pr-6">
          <h3 className="text-sm font-bold text-white mb-1.5">{title}</h3>
          <div className="text-xs text-vault-text-muted leading-relaxed space-y-2">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
