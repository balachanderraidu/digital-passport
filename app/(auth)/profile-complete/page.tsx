'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Phone, Mail, ChevronRight, Loader2, CheckCircle2, KeyRound } from 'lucide-react'
import { useAuth } from '@/lib/useAuth'
import { saveUserProfile, getProperty } from '@/lib/firestore'
import { cn } from '@/lib/utils'

export default function ProfileCompletePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [value, setValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Determine what's missing
  const isGoogleUser = !user?.phoneNumber  // has email, missing phone
  const label = isGoogleUser ? 'Mobile Number' : 'Email Address'
  const Icon = isGoogleUser ? Phone : Mail
  const placeholder = isGoogleUser ? '9876543210' : 'you@example.com'
  const inputType = isGoogleUser ? 'tel' : 'email'

  async function routeNext() {
    if (!user) return
    const property = await getProperty(user.uid)
    router.replace(property ? '/dashboard' : '/onboarding')
  }

  async function handleSkip() {
    if (!user) return
    setSaving(true)
    try {
      await saveUserProfile(user.uid, { profileCompletionSkipped: true })
    } finally {
      setSaving(false)
      await routeNext()
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setError('')
    if (isGoogleUser && !/^\d{10}$/.test(value)) {
      setError('Enter a valid 10-digit mobile number')
      return
    }
    if (!isGoogleUser && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError('Enter a valid email address')
      return
    }
    setSaving(true)
    try {
      await saveUserProfile(user.uid, {
        ...(isGoogleUser
          ? { phone: `+91${value}`, phoneVerified: false }
          : { email: value, emailVerified: false }),
        profileCompletionSkipped: false,
      })
      await routeNext()
    } catch {
      setError('Something went wrong. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div className="min-h-dvh bg-vault-bg flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-gold-500/5 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-gold-500/3 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-glow-gold pointer-events-none" />
      </div>

      <div className="w-full max-w-sm relative z-10 animate-slide-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-3xl bg-gold-gradient flex items-center justify-center mb-3 shadow-gold-glow">
            <KeyRound size={28} className="text-charcoal-300" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-bold text-white">One More Thing</h1>
          <p className="text-vault-text-muted mt-1 text-sm font-medium text-center">
            Add your {isGoogleUser ? 'phone number' : 'email address'} for account recovery
          </p>
        </div>

        {/* What we already have */}
        <div className="glass gold-border rounded-2xl p-4 mb-5 flex items-center gap-3">
          <CheckCircle2 size={18} className="text-green-400 flex-shrink-0" />
          <div>
            <p className="text-[10px] font-semibold text-vault-text-muted uppercase tracking-widest">
              {isGoogleUser ? 'Google Account' : 'Phone'} Verified
            </p>
            <p className="text-sm font-semibold text-white mt-0.5">
              {isGoogleUser ? user?.email : user?.phoneNumber}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-vault-text-muted uppercase tracking-widest mb-2">
              {label}
            </label>
            <div className="flex gap-2">
              {isGoogleUser && (
                <div className="flex items-center justify-center px-3 rounded-2xl glass gold-border text-sm font-bold text-vault-text flex-shrink-0">
                  +91
                </div>
              )}
              <input
                type={inputType}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
                maxLength={isGoogleUser ? 10 : undefined}
                className="flex-1 px-4 py-3.5 text-sm font-medium placeholder:text-vault-muted rounded-2xl focus:ring-0"
                autoFocus
              />
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-xs font-medium px-1 animate-fade-in">{error}</p>
          )}

          <button
            type="submit"
            disabled={saving || !value}
            className={cn(
              'w-full py-4 rounded-2xl font-bold text-sm tracking-wide transition-all duration-200',
              'bg-gold-gradient text-charcoal-300',
              'hover:shadow-gold-glow active:scale-[0.98]',
              'flex items-center justify-center gap-2',
              (saving || !value) && 'opacity-60 cursor-not-allowed'
            )}
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <Icon size={16} />
                Save {isGoogleUser ? 'Phone Number' : 'Email'}
                <ChevronRight size={16} />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleSkip}
            disabled={saving}
            className="w-full py-3 rounded-2xl text-sm font-semibold text-vault-text-muted hover:text-vault-text transition-colors"
          >
            Skip for now
          </button>
        </form>

        <p className="text-center text-[10px] text-vault-muted mt-4 leading-relaxed">
          We'll send a verification link to confirm this later.
        </p>
      </div>
    </div>
  )
}
