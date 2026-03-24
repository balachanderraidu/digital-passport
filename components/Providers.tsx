'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { VideoSplash } from '@/components/VideoSplash'
import { IOSInstallGuide } from '@/components/IOSInstallGuide'

// ─── Share link tracking ──────────────────────────────────────────────────────
// Usage: share yourapp.com/?ref=john-sharma or ?ref=sequoia-pitch
// Increments tracking_metrics/{ref} in Firestore — view in Firebase Console.
// localStorage dedup: only counts once per browser per ref tag.
async function trackRef(ref: string) {
  try {
    const key = `ref_tracked_${ref}`
    if (localStorage.getItem(key)) return          // already counted on this device
    localStorage.setItem(key, '1')                 // mark immediately to avoid race

    const { getFirestore, doc, setDoc, serverTimestamp, increment } = await import('firebase/firestore')
    const app = (await import('@/lib/firebase')).default
    if (!app) return
    const db = getFirestore(app)
    const docRef = doc(db, 'tracking_metrics', ref)

    await setDoc(docRef, {
      ref,
      count: increment(1),
      lastSeen: serverTimestamp(),
      firstSeen: serverTimestamp(),   // ignored on update (merge semantics below)
    }, { merge: true })
  } catch {
    // Fail silently — tracking should never break the app
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  }))

  const [showSplash, setShowSplash] = useState(false)
  const [showIOSGuide, setShowIOSGuide] = useState(false)

  useEffect(() => {
    // ── Video splash (first session visit only) ──
    if (!sessionStorage.getItem('splashSeen')) {
      setShowSplash(true)
    }
    function onOpen() { setShowSplash(true) }
    window.addEventListener('openSplash', onOpen)

    // ── Share link tracking ──
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    if (ref && ref.trim()) {
      trackRef(ref.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-'))
    }

    return () => window.removeEventListener('openSplash', onOpen)
  }, [])

  function handleSplashDismiss() {
    setShowSplash(false)
    // Show iOS install guide once per device install
    if (!localStorage.getItem('iosGuideShown')) {
      setShowIOSGuide(true)
    }
  }

  return (
    <QueryClientProvider client={queryClient}>
      {showSplash && <VideoSplash onDismiss={handleSplashDismiss} />}
      {showIOSGuide && (
        <IOSInstallGuide onDismiss={() => {
          setShowIOSGuide(false)
          localStorage.setItem('iosGuideShown', '1')
        }} />
      )}
      {children}
    </QueryClientProvider>
  )
}
