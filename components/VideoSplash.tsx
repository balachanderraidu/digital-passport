'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

const VIDEO_SRC = '/explainer.mp4'
const SKIP_DELAY_MS = 5000        // swipe hint appears after 5 sec
const DRAG_THRESHOLD = 0.28       // 28% of screen height to commit dismiss
const SNAP_DURATION = '0.4s'

interface VideoSplashProps {
  onDismiss?: () => void
}

export function VideoSplash({ onDismiss }: VideoSplashProps) {
  const [visible, setVisible] = useState(true)
  const [canSkip, setCanSkip] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [dragY, setDragY] = useState(0)       // positive = swiped up (negative px)
  const [snapping, setSnapping] = useState(false)

  const startYRef = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Show skip hint after 5 sec
  useEffect(() => {
    const t = setTimeout(() => setCanSkip(true), SKIP_DELAY_MS)
    return () => clearTimeout(t)
  }, [])

  // Listen for re-open event from DemoBanner
  useEffect(() => {
    function onOpen() {
      setVisible(true)
      setDragY(0)
      setCanSkip(false)
      setSnapping(false)
      setTimeout(() => videoRef.current?.play(), 50)
      setTimeout(() => setCanSkip(true), SKIP_DELAY_MS)
    }
    window.addEventListener('openSplash', onOpen)
    return () => window.removeEventListener('openSplash', onOpen)
  }, [])

  const dismiss = useCallback(() => {
    setSnapping(true)
    setDragY(window.innerHeight)
    setTimeout(() => {
      setVisible(false)
      sessionStorage.setItem('splashSeen', '1')
      onDismiss?.()
    }, 420)
  }, [onDismiss])

  // Touch handlers — real-time finger follow
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY
    setDragging(true)
    setSnapping(false)
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragging) return
    const delta = startYRef.current - e.touches[0].clientY  // positive = up
    if (delta > 0) {
      setDragY(delta)
    }
  }, [dragging])

  const onTouchEnd = useCallback(() => {
    setDragging(false)
    const threshold = window.innerHeight * DRAG_THRESHOLD
    if (dragY >= threshold) {
      dismiss()
    } else {
      // Bounce back
      setSnapping(true)
      setDragY(0)
      setTimeout(() => setSnapping(false), 400)
    }
  }, [dragY, dismiss])

  // Video ended → auto-dismiss
  const onVideoEnded = useCallback(() => dismiss(), [dismiss])

  // Desktop keyboard fallback
  useEffect(() => {
    if (!canSkip) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'ArrowUp') dismiss()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [canSkip, dismiss])

  if (!visible) return null

  const translateY = -dragY   // negative = moves up
  const transition = snapping || (!dragging && dragY === 0)
    ? `transform ${SNAP_DURATION} cubic-bezier(0.32,0.72,0,1)`
    : 'none'
  const opacity = Math.max(0, 1 - dragY / (window.innerHeight * 0.7))

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[300] bg-black touch-none"
      style={{
        transform: `translateY(${translateY}px)`,
        transition,
        willChange: 'transform',
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Full-screen video */}
      <video
        ref={videoRef}
        src={VIDEO_SRC}
        className="w-full h-full object-contain bg-black"
        autoPlay
        playsInline
        muted={false}
        controls={false}
        onEnded={onVideoEnded}
      />

      {/* Dark gradient at bottom for hint readability */}
      <div
        className="absolute inset-x-0 bottom-0 h-40 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)' }}
      />

      {/* Swipe hint — appears after 5 sec */}
      <div
        className="absolute inset-x-0 bottom-10 flex flex-col items-center gap-2 transition-all duration-700 pointer-events-none"
        style={{ opacity: canSkip ? opacity : 0, transform: canSkip ? 'translateY(0)' : 'translateY(16px)' }}
      >
        {/* Animated chevrons */}
        <div className="flex flex-col items-center gap-0.5">
          {[0, 1, 2].map((i) => (
            <svg
              key={i}
              width="22" height="13" viewBox="0 0 22 13"
              className="text-white"
              style={{
                opacity: 0.4 + i * 0.2,
                animation: `swipeChevron 1.4s ease-in-out ${i * 0.15}s infinite`,
              }}
            >
              <path d="M1 11.5L11 2L21 11.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          ))}
        </div>
        <p className="text-white/70 text-xs font-semibold tracking-widest uppercase">
          Swipe up to continue
        </p>
      </div>

      {/* Tap to skip (desktop) */}
      {canSkip && (
        <button
          onClick={dismiss}
          className="absolute top-14 right-5 text-white/50 text-[11px] font-semibold tracking-widest uppercase px-3 py-1.5 rounded-full border border-white/20 hover:bg-white/10 transition-colors hidden sm:flex items-center gap-1.5"
        >
          Skip ↑
        </button>
      )}

      <style>{`
        @keyframes swipeChevron {
          0%, 100% { opacity: 0.2; transform: translateY(0); }
          50%       { opacity: 0.9; transform: translateY(-5px); }
        }
      `}</style>
    </div>
  )
}

// Hook for external components to trigger the splash
export function useVideoSplash() {
  const open = useCallback(() => {
    window.dispatchEvent(new Event('openSplash'))
  }, [])
  return { open }
}
