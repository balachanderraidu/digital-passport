'use client'

import { useEffect, useState, useCallback } from 'react'
import { X, Share, MoreHorizontal } from 'lucide-react'

function isIOSSafari(): boolean {
  if (typeof window === 'undefined') return false
  const ua = navigator.userAgent
  const isIOS = /iphone|ipad|ipod/i.test(ua)
  // Exclude Chrome on iOS (CriOS) and Firefox on iOS (FxiOS)
  const isSafari = /safari/i.test(ua) && !/crios|fxios|chrome/i.test(ua)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
  return isIOS && isSafari && !isStandalone
}

interface IOSInstallGuideProps {
  onDismiss: () => void
}

export function IOSInstallGuide({ onDismiss }: IOSInstallGuideProps) {
  const [show, setShow] = useState(false)
  const [animateIn, setAnimateIn] = useState(false)

  useEffect(() => {
    if (!isIOSSafari()) return
    // Small delay so it slides in after the video curtain clears
    const t = setTimeout(() => {
      setShow(true)
      requestAnimationFrame(() => setTimeout(() => setAnimateIn(true), 20))
    }, 400)
    return () => clearTimeout(t)
  }, [])

  const dismiss = useCallback(() => {
    setAnimateIn(false)
    setTimeout(() => {
      setShow(false)
      onDismiss()
    }, 350)
  }, [onDismiss])

  if (!show) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[200] transition-opacity duration-300"
        style={{ opacity: animateIn ? 1 : 0 }}
        onClick={dismiss}
      />

      {/* Bottom sheet */}
      <div
        className="fixed inset-x-0 bottom-0 z-[201] bg-[#1A1A1A] rounded-t-3xl border-t border-white/10 px-6 pt-5 pb-10 transition-transform duration-[350ms] ease-out"
        style={{ transform: animateIn ? 'translateY(0)' : 'translateY(100%)' }}
      >
        {/* Handle */}
        <div className="flex justify-center mb-5">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Close */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
        >
          <X size={14} className="text-white/60" />
        </button>

        {/* Icon + Header */}
        <div className="flex items-center gap-3 mb-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192.png" alt="Digital Passport" className="w-12 h-12 rounded-2xl" />
          <div>
            <p className="text-white font-bold text-base">Install Digital Passport</p>
            <p className="text-white/40 text-xs mt-0.5">Add to your Home Screen for the best experience</p>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {/* Step 1 */}
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-[11px] font-bold text-[#D4AF37]">1</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-white text-sm font-semibold">Tap the Share button</p>
                <div className="bg-white/10 rounded-md px-2 py-1 flex items-center gap-1">
                  <Share size={13} className="text-[#D4AF37]" />
                  <span className="text-[10px] text-white/60 font-medium">Share</span>
                </div>
              </div>
              <p className="text-white/40 text-[11px] mt-0.5">In the Safari toolbar at the bottom of your screen</p>
            </div>
          </div>

          {/* Connector */}
          <div className="ml-3.5 w-px h-3 bg-white/10" />

          {/* Step 2 */}
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-[11px] font-bold text-[#D4AF37]">2</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-white text-sm font-semibold">Scroll down and tap</p>
                <div className="bg-white/10 rounded-md px-2 py-1 flex items-center gap-1">
                  <MoreHorizontal size={13} className="text-white/60" />
                  <span className="text-[10px] text-white/60 font-medium">Add to Home Screen</span>
                </div>
              </div>
              <p className="text-white/40 text-[11px] mt-0.5">Scroll down in the share sheet to find this option</p>
            </div>
          </div>

          {/* Connector */}
          <div className="ml-3.5 w-px h-3 bg-white/10" />

          {/* Step 3 */}
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-[11px] font-bold text-[#D4AF37]">3</span>
            </div>
            <div>
              <p className="text-white text-sm font-semibold">Tap <span className="text-[#D4AF37]">Add</span> to confirm</p>
              <p className="text-white/40 text-[11px] mt-0.5">Digital Passport will appear on your Home Screen</p>
            </div>
          </div>
        </div>

        {/* Animated arrow pointing to bottom toolbar */}
        <div className="flex justify-center mt-6">
          <div
            className="flex flex-col items-center gap-1 text-[#D4AF37]/60"
            style={{ animation: 'bounceDown 1.4s ease-in-out infinite' }}
          >
            <p className="text-[10px] font-semibold tracking-widest uppercase">Share button is below</p>
            {[0, 1, 2].map((i) => (
              <svg key={i} width="20" height="11" viewBox="0 0 20 11" fill="none"
                style={{ opacity: 0.3 + i * 0.25 }}>
                <path d="M1 1.5L10 9.5L19 1.5" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ))}
          </div>
        </div>

        <button
          onClick={dismiss}
          className="w-full mt-5 py-3 rounded-2xl bg-white/8 border border-white/10 text-white/50 text-sm font-semibold"
        >
          Maybe later
        </button>

        <style>{`
          @keyframes bounceDown {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(6px); }
          }
        `}</style>
      </div>
    </>
  )
}
