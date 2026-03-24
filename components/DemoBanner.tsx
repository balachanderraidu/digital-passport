'use client'

import { useEffect, useState } from 'react'
import { FlaskConical, X, Play } from 'lucide-react'
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
    <div className="relative z-40 bg-gold-500/10 border-b border-gold-500/25 px-4 py-2 flex items-center gap-2">
      <FlaskConical size={13} className="text-gold-500 flex-shrink-0" />
      <p className="text-[11px] font-semibold text-gold-500 flex-1">
        Demo Mode — sample data only.{' '}
        <Link href="/login" className="underline underline-offset-2 hover:text-gold-400">
          Sign in
        </Link>{' '}
        to connect your home.
      </p>
      {/* Re-watch intro video */}
      <button
        onClick={handleRewatch}
        className="flex items-center gap-1 text-[10px] font-bold text-gold-500/70 hover:text-gold-500 transition-colors px-2 py-0.5 rounded-full border border-gold-500/25 hover:border-gold-500/50 flex-shrink-0"
      >
        <Play size={9} className="fill-current" /> Intro
      </button>
      <button onClick={() => setDismissed(true)} className="text-gold-500/60 hover:text-gold-500 transition-colors flex-shrink-0">
        <X size={13} />
      </button>
    </div>
  )
}
