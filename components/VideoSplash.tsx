'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { KeyRound, Volume2, VolumeX, Play, Pause } from 'lucide-react'

const VIDEO_SRC = '/explainer.mp4'
const VIDEO_DURATION_S = 104     // 1 min 44 sec
const SKIP_DELAY_MS = 5000
const DRAG_THRESHOLD = 0.28
const SNAP_DURATION = '0.42s'

interface VideoSplashProps {
  onDismiss?: () => void
}

export function VideoSplash({ onDismiss }: VideoSplashProps) {
  const [visible, setVisible] = useState(true)
  const [videoReady, setVideoReady] = useState(false)
  const [canSkip, setCanSkip] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [dragY, setDragY] = useState(0)
  const [snapping, setSnapping] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [duration, setDuration] = useState(VIDEO_DURATION_S)
  const [muted, setMuted] = useState(true)
  const [paused, setPaused] = useState(false)
  const [showPlayIcon, setShowPlayIcon] = useState(false)

  // Seekbar drag state
  const [seekDragging, setSeekDragging] = useState(false)
  const [seekPreview, setSeekPreview] = useState<number | null>(null)
  const seekBarRef = useRef<HTMLDivElement>(null)

  const startYRef = useRef(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const playIconTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Live elapsed timer from video element
  useEffect(() => {
    const vid = videoRef.current
    if (!vid) return
    function tick() {
      if (!seekDragging) setElapsed(Math.floor(vid!.currentTime))
      if (vid!.duration && !isNaN(vid!.duration)) setDuration(Math.ceil(vid!.duration))
    }
    vid.addEventListener('timeupdate', tick)
    return () => vid.removeEventListener('timeupdate', tick)
  }, [seekDragging])

  // Skip hint after 5 sec
  useEffect(() => {
    const t = setTimeout(() => setCanSkip(true), SKIP_DELAY_MS)
    return () => clearTimeout(t)
  }, [])

  // Explicitly play on every mount
  useEffect(() => {
    const vid = videoRef.current
    if (!vid) return
    vid.play().catch(() => { /* blocked — video stays paused until user taps unmute */ })
  }, [])

  // Re-open via custom event
  useEffect(() => {
    function onOpen() {
      setVisible(true)
      setVideoReady(false)
      setDragY(0)
      setCanSkip(false)
      setSnapping(false)
      setElapsed(0)
      setMuted(true)
      setPaused(false)
      setTimeout(() => {
        if (videoRef.current) { videoRef.current.currentTime = 0; videoRef.current.play() }
      }, 50)
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
      onDismiss?.()
    }, 440)
  }, [onDismiss])

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    const vid = videoRef.current
    if (!vid) return
    if (vid.paused) {
      vid.play()
      setPaused(false)
    } else {
      vid.pause()
      setPaused(true)
    }
    // Flash the play/pause icon briefly
    setShowPlayIcon(true)
    if (playIconTimer.current) clearTimeout(playIconTimer.current)
    playIconTimer.current = setTimeout(() => setShowPlayIcon(false), 900)
  }, [])

  // Touch drag handlers (only on the overlay, not on seekbar)
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY
    setDragging(true)
    setSnapping(false)
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragging) return
    const delta = startYRef.current - e.touches[0].clientY
    if (delta > 0) setDragY(delta)
  }, [dragging])

  const onTouchEnd = useCallback(() => {
    setDragging(false)
    const threshold = window.innerHeight * DRAG_THRESHOLD
    if (dragY >= threshold) {
      dismiss()
    } else {
      setSnapping(true)
      setDragY(0)
      setTimeout(() => setSnapping(false), 400)
    }
  }, [dragY, dismiss])

  const onVideoEnded = useCallback(() => dismiss(), [dismiss])

  // Keyboard (desktop)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === ' ') { e.preventDefault(); togglePlay() }
      if (!canSkip) return
      if (e.key === 'Escape' || e.key === 'ArrowUp') dismiss()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [canSkip, dismiss, togglePlay])

  // ── Seekbar helpers ──────────────────────────────────────────────────────────
  const seekTo = useCallback((clientX: number) => {
    const bar = seekBarRef.current
    const vid = videoRef.current
    if (!bar || !vid) return
    const rect = bar.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const newTime = ratio * (vid.duration || duration)
    setSeekPreview(ratio)
    setElapsed(Math.floor(newTime))
    vid.currentTime = newTime
  }, [duration])

  const onSeekPointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation()
    setSeekDragging(true)
    seekBarRef.current?.setPointerCapture(e.pointerId)
    seekTo(e.clientX)
  }, [seekTo])

  const onSeekPointerMove = useCallback((e: React.PointerEvent) => {
    if (!seekDragging) return
    seekTo(e.clientX)
  }, [seekDragging, seekTo])

  const onSeekPointerUp = useCallback(() => {
    setSeekDragging(false)
    setSeekPreview(null)
  }, [])

  if (!visible) return null

  const progress = duration > 0 ? elapsed / duration : 0
  const displayProgress = seekPreview !== null ? seekPreview : progress
  const remaining = Math.max(0, duration - elapsed)
  const mins = String(Math.floor(remaining / 60)).padStart(1, '0')
  const secs = String(remaining % 60).padStart(2, '0')

  const elapsedMins = String(Math.floor(elapsed / 60)).padStart(1, '0')
  const elapsedSecs = String(elapsed % 60).padStart(2, '0')

  const translateY = -dragY
  const transition = snapping || (!dragging && dragY === 0)
    ? `transform ${SNAP_DURATION} cubic-bezier(0.32,0.72,0,1)` : 'none'
  const overlayOpacity = Math.max(0, 1 - dragY / (window.innerHeight * 0.6))

  // SVG circular progress ring
  const R = 26
  const C = 2 * Math.PI * R
  const strokeDash = C * (1 - progress)

  return (
    <div
      className="fixed inset-0 z-[300] bg-black touch-none"
      style={{ transform: `translateY(${translateY}px)`, transition, willChange: 'transform' }}
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
        muted={muted}
        playsInline
        preload="auto"
        controls={false}
        onCanPlay={() => setVideoReady(true)}
        onEnded={onVideoEnded}
        onClick={togglePlay}
        style={{ cursor: 'pointer' }}
      />

      {/* Branded loading screen */}
      {!videoReady && (
        <div className="absolute inset-0 bg-[#0D0D0D] flex flex-col items-center justify-center gap-8 z-10">
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#D4AF37] to-[#B8960C] flex items-center justify-center shadow-[0_0_40px_rgba(212,175,55,0.4)]">
              <KeyRound size={36} className="text-[#1a1a1a]" strokeWidth={2} />
            </div>
            <div className="text-center">
              <p className="text-white text-xl font-bold tracking-tight">Digital Passport</p>
              <p className="text-white/40 text-xs font-medium mt-0.5">Your Home. Secured.</p>
            </div>
          </div>

          {/* Animated loading ring */}
          <div className="relative w-14 h-14">
            <svg className="w-14 h-14 -rotate-90 animate-spin" viewBox="0 0 56 56" style={{ animationDuration: '1.4s' }}>
              <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(212,175,55,0.15)" strokeWidth="3" />
              <circle
                cx="28" cy="28" r="22"
                fill="none"
                stroke="#D4AF37"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 22 * 0.25} ${2 * Math.PI * 22 * 0.75}`}
              />
            </svg>
          </div>

          <p className="text-white/30 text-[11px] font-semibold tracking-[0.2em] uppercase">Loading video</p>
        </div>
      )}

      {/* Bottom gradient */}
      {videoReady && (
        <div
          className="absolute inset-x-0 bottom-0 h-64 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, transparent 100%)', opacity: overlayOpacity }}
        />
      )}

      {/* Top-right: countdown ring + timer */}
      {videoReady && (
        <div
          className="absolute top-12 right-5 flex flex-col items-center gap-0.5 transition-opacity duration-700"
          style={{ opacity: overlayOpacity }}
        >
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r={R} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3" />
              <circle
                cx="32" cy="32" r={R}
                fill="none"
                stroke="#D4AF37"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={strokeDash}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white text-[11px] font-bold tabular-nums leading-none">
                {mins}:{secs}
              </span>
            </div>
          </div>
          <span className="text-white/40 text-[8px] font-semibold uppercase tracking-widest">left</span>
        </div>
      )}

      {/* Centre play/pause flash icon */}
      {videoReady && showPlayIcon && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ opacity: overlayOpacity }}
        >
          <div
            className="w-20 h-20 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center"
            style={{ animation: 'fadeOutIcon 0.9s ease forwards' }}
          >
            {paused
              ? <Pause size={36} className="text-white" />
              : <Play size={36} className="text-white ml-1" />
            }
          </div>
        </div>
      )}

      {/* ── Bottom controls row (play/pause + seekbar + time) ── */}
      {videoReady && (
        <div
          className="absolute inset-x-0 bottom-0 px-5 pb-6 pt-3 flex flex-col gap-3 pointer-events-auto"
          style={{ opacity: overlayOpacity }}
          onTouchStart={e => e.stopPropagation()}
          onTouchMove={e => e.stopPropagation()}
          onTouchEnd={e => e.stopPropagation()}
        >
          {/* Time labels */}
          <div className="flex items-center justify-between px-0.5">
            <span className="text-white/50 text-[10px] font-bold tabular-nums tracking-wider">
              {elapsedMins}:{elapsedSecs}
            </span>
            <span className="text-white/50 text-[10px] font-bold tabular-nums tracking-wider">
              -{mins}:{secs}
            </span>
          </div>

          {/* Seekbar */}
          <div
            ref={seekBarRef}
            className="relative h-8 flex items-center cursor-pointer"
            onPointerDown={onSeekPointerDown}
            onPointerMove={onSeekPointerMove}
            onPointerUp={onSeekPointerUp}
            onPointerCancel={onSeekPointerUp}
          >
            {/* Track background */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 rounded-full bg-white/20" />
            {/* Filled portion */}
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 rounded-full bg-[#D4AF37]"
              style={{ width: `${displayProgress * 100}%`, transition: seekDragging ? 'none' : 'width 0.25s linear' }}
            />
            {/* Thumb */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-lg"
              style={{
                left: `calc(${displayProgress * 100}% - 8px)`,
                transition: seekDragging ? 'none' : 'left 0.25s linear',
                transform: `translateY(-50%) scale(${seekDragging ? 1.35 : 1})`,
              }}
            />
          </div>

          {/* Play/pause + mute row */}
          <div className="flex items-center gap-4 pb-2">
            {/* Play / Pause */}
            <button
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform"
            >
              {paused
                ? <Play size={17} className="text-white ml-0.5" />
                : <Pause size={17} className="text-white" />
              }
            </button>

            {/* Expand seekbar spacer */}
            <div className="flex-1" />

            {/* Mute toggle */}
            <button
              onClick={() => setMuted(m => !m)}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-black/50 backdrop-blur-sm transition-all duration-300 active:scale-95"
            >
              {muted
                ? <><VolumeX size={13} className="text-white/60" /><span className="text-white/60 text-[10px] font-bold tracking-widest uppercase">Tap for audio</span></>
                : <Volume2 size={14} className="text-[#D4AF37]" />
              }
            </button>
          </div>
        </div>
      )}

      {/* Swipe-up hint (above controls) */}
      <div
        className="absolute inset-x-0 flex flex-col items-center gap-3 pointer-events-none transition-all duration-700"
        style={{
          bottom: '220px',
          opacity: videoReady && canSkip ? overlayOpacity : 0,
          transform: videoReady && canSkip ? 'translateY(0)' : 'translateY(20px)',
        }}
      >
        <div className="flex flex-col items-center gap-0.5">
          {[0, 1, 2].map((i) => (
            <svg key={i} width="22" height="12" viewBox="0 0 22 12" className="text-white"
              style={{ opacity: 0.3 + i * 0.25, animation: `swipeUp 1.5s ease-in-out ${i * 0.18}s infinite` }}>
              <path d="M1 10.5L11 1.5L21 10.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          ))}
        </div>
        <p className="text-white/60 text-[11px] font-semibold tracking-[0.2em] uppercase">Swipe up to continue</p>
      </div>

      {/* Desktop skip */}
      {videoReady && canSkip && (
        <button
          onClick={dismiss}
          className="absolute top-14 left-5 text-white/50 text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full border border-white/15 hover:bg-white/10 transition-colors pointer-events-auto hidden sm:flex items-center gap-1.5"
        >
          Skip
        </button>
      )}

      <style>{`
        @keyframes swipeUp {
          0%, 100% { opacity: 0.2; transform: translateY(4px); }
          50%       { opacity: 0.9; transform: translateY(-4px); }
        }
        @keyframes fadeOutIcon {
          0%   { opacity: 1; transform: scale(1); }
          70%  { opacity: 0.8; transform: scale(1.1); }
          100% { opacity: 0; transform: scale(1.2); }
        }
      `}</style>
    </div>
  )
}

export function useVideoSplash() {
  const open = useCallback(() => {
    window.dispatchEvent(new Event('openSplash'))
  }, [])
  return { open }
}
