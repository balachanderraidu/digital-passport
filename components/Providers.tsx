'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { VideoSplash } from '@/components/VideoSplash'

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

  useEffect(() => {
    // Only show on the first session visit
    if (!sessionStorage.getItem('splashSeen')) {
      setShowSplash(true)
    }
    // Allow DemoBanner to re-open the splash
    function onOpen() { setShowSplash(true) }
    window.addEventListener('openSplash', onOpen)
    return () => window.removeEventListener('openSplash', onOpen)
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      {showSplash && <VideoSplash onDismiss={() => setShowSplash(false)} />}
      {children}
    </QueryClientProvider>
  )
}
