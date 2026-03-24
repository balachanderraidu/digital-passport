'use client'

import { useEffect, useState } from 'react'
import { FlaskConical, X, PlayCircle } from 'lucide-react'
import Link from 'next/link'

export function DemoBanner() {
  const [isDemo, setIsDemo] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    setIsDemo(sessionStorage.getItem('demo_mode') === 'true')
  }, [])

  if (!isDemo || dismissed) return null

  function handleRewatch() {
    sessionStorage.removeItem('splashSeen')
    window.dispatchEvent(new Event('openSplash'))
  }

  return (
    <div className="relative z-40 bg-gold-500/10 border-b border-gold-500/25 px-3 py-2 flex items-center gap-2">
      <FlaskConical size={12} className="text-gold-500 flex-shrink-0" />
      <p className="text-[11px] font-semibold text-gold-500 flex-1 leading-tight">
        Demo Mode.{' '}
        <Link href="/login" className="underline underline-offset-2 hover:text-gold-400 opacity-70">
          Sign in
        </Link>
      </p>

      {/* Prominent Watch Intro button */}
      <button
        onClick={handleRewatch}
        className="flex items-center gap-1.5 text-[11px] font-bold text-charcoal-300 bg-gold-gradient px-3 py-1.5 rounded-full hover:shadow-gold-glow transition-all flex-shrink-0"
      >
        <PlayCircle size={13} className="flex-shrink-0" />
        Watch Intro
      </button>

      <button onClick={() => setDismissed(true)} className="text-gold-500/50 hover:text-gold-500 transition-colors flex-shrink-0 ml-0.5">
        <X size={13} />
      </button>
    </div>
  )
}
