'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { X, ShieldAlert } from 'lucide-react'
import { useAuth } from '@/lib/useAuth'
import { subscribeUserProfile, type UserProfile } from '@/lib/firestore'

export function ProfileReminderBanner() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [dismissed, setDismissed] = useState(false)

  const isDemo = typeof window !== 'undefined' && sessionStorage.getItem('demo_mode') === 'true'

  useEffect(() => {
    if (!user) return
    return subscribeUserProfile(user.uid, setProfile)
  }, [user])

  if (!user || isDemo || dismissed) return null
  if (!profile) return null

  // Show banner if missing phone OR email (and not skipped)
  const missingPhone = !profile.phone
  const missingEmail = !profile.email
  if ((!missingPhone && !missingEmail) || profile.profileCompletionSkipped) return null

  const missing = missingPhone ? 'phone number' : 'email address'

  return (
    <div className="bg-gold-500/10 border-b border-gold-500/20 px-4 py-2.5 flex items-center gap-3">
      <ShieldAlert size={15} className="text-gold-500 flex-shrink-0" />
      <p className="flex-1 text-xs font-medium text-vault-text">
        Add your {missing} for{' '}
        <Link href="/profile-complete" className="text-gold-500 font-semibold underline underline-offset-2">
          account recovery →
        </Link>
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="text-vault-text-muted hover:text-vault-text transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  )
}
