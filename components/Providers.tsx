'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { VideoSplash } from '@/components/VideoSplash'
import { IOSInstallGuide } from '@/components/IOSInstallGuide'

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
    // Only show splash on first session visit
    if (!sessionStorage.getItem('splashSeen')) {
      setShowSplash(true)
    }
    // Allow DemoBanner to re-open the splash
    function onOpen() { setShowSplash(true) }
    window.addEventListener('openSplash', onOpen)
    return () => window.removeEventListener('openSplash', onOpen)
  }, [])

  function handleSplashDismiss() {
    setShowSplash(false)
    // Show iOS install guide once per install (not just per session)
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
