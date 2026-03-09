'use client'

import { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/useAuth'
import { subscribeAllProperties } from '@/lib/firestore'
import { registerFCMToken } from '@/lib/fcm'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const hasChecked = useRef(false)

  const isDemo =
    typeof window !== 'undefined' && sessionStorage.getItem('demo_mode') === 'true'

  useEffect(() => {
    if (loading) return
    if (isDemo) return // demo mode — allow through

    if (!user) {
      router.replace('/login')
      return
    }

    // Register FCM token in background — non-blocking
    if (typeof window !== 'undefined') {
      registerFCMToken(user.uid).catch(() => {
        // Permission denied or not supported — ignore silently
      })
    }

    // Skip property check if already on onboarding
    if (pathname === '/onboarding') return
    if (hasChecked.current) return
    hasChecked.current = true

    // Check if user has ANY property (not just 'primary')
    const unsub = subscribeAllProperties(user.uid, (properties) => {
      unsub() // one-shot
      if (properties.length === 0) {
        router.replace('/onboarding')
      }
    })
  }, [user, loading, isDemo, pathname, router])

  if (loading) {
    return (
      <div className="min-h-dvh bg-vault-bg flex items-center justify-center">
        <Loader2 size={28} className="text-gold-500 animate-spin" />
      </div>
    )
  }

  // Not authenticated and not in demo — show nothing while redirecting
  if (!user && !isDemo) {
    return (
      <div className="min-h-dvh bg-vault-bg flex items-center justify-center">
        <Loader2 size={28} className="text-gold-500 animate-spin" />
      </div>
    )
  }

  return <>{children}</>
}
