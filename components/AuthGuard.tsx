'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/useAuth'
import { getProperty } from '@/lib/firestore'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const isDemo =
    typeof window !== 'undefined' && sessionStorage.getItem('demo_mode') === 'true'

  useEffect(() => {
    if (loading) return
    if (isDemo) return // demo mode — allow through

    if (!user) {
      router.replace('/login')
      return
    }

    // Authenticated user — redirect to onboarding if no property, unless already there
    if (pathname === '/onboarding') return
    getProperty(user.uid).then((property) => {
      if (!property) {
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
