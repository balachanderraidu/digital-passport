'use client'

/**
 * PropertySwitcherTour (#9)
 *
 * On the very first demo session (tracked via sessionStorage 'switcherTourSeen'),
 * renders a pulsing gold ring around the property switcher button with a tooltip:
 * "Try switching properties →"
 * Dismisses on tap or after 6s.
 */

import { useState, useEffect } from 'react'

interface Props {
  targetRef: React.RefObject<HTMLElement>
}

export function PropertySwitcherTour({ targetRef }: Props) {
  const [show, setShow] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0, height: 0 })

  useEffect(() => {
    if (sessionStorage.getItem('switcherTourSeen')) return
    if (!sessionStorage.getItem('demo_mode')) return

    const measure = () => {
      const el = targetRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      setPos({ top: r.top, left: r.left, width: r.width, height: r.height })
      setShow(true)
      sessionStorage.setItem('switcherTourSeen', '1')
    }

    // Delay so the header has mounted
    const t = setTimeout(measure, 1400)
    return () => clearTimeout(t)
  }, [targetRef])

  // Auto-dismiss after 6s
  useEffect(() => {
    if (!show) return
    const t = setTimeout(() => setShow(false), 6000)
    return () => clearTimeout(t)
  }, [show])

  if (!show) return null

  return (
    <div
      className="fixed inset-0 z-[99] pointer-events-none"
      onClick={() => setShow(false)}
      style={{ pointerEvents: 'auto' }}
    >
      {/* Backdrop with cutout feel */}
      <div className="absolute inset-0 bg-black/40" style={{ pointerEvents: 'auto' }} onClick={() => setShow(false)} />

      {/* Pulse ring centred on the target button */}
      <div
        className="absolute animate-pulse-ring rounded-full border-2 border-gold-500 pointer-events-none"
        style={{
          top:    pos.top    - 6,
          left:   pos.left   - 6,
          width:  pos.width  + 12,
          height: pos.height + 12,
        }}
      />

      {/* Tooltip below the button */}
      <div
        className="absolute animate-fade-in flex flex-col items-center pointer-events-none"
        style={{ top: pos.top + pos.height + 10, left: pos.left + pos.width / 2, transform: 'translateX(-50%)' }}
      >
        <div className="w-0.5 h-2 bg-gold-500 mb-1.5" />
        <div className="px-3 py-1.5 rounded-xl bg-gold-500 text-charcoal-300 text-[11px] font-bold whitespace-nowrap shadow-gold-glow">
          ✨ Try switching properties
        </div>
      </div>
    </div>
  )
}
