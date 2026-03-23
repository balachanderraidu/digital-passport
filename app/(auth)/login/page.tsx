'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  type ConfirmationResult,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuth } from '@/lib/useAuth'
import { getProperty, getUserProfile, saveUserProfile } from '@/lib/firestore'
import { KeyRound, Phone, Loader2, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

async function routeAfterSignIn(
  uid: string,
  email: string | null,
  phone: string | null,
  router: ReturnType<typeof useRouter>
) {
  const profile = await getUserProfile(uid)
  const needsPhone = !phone && !profile?.phone && !profile?.profileCompletionSkipped
  const needsEmail = !email && !profile?.email && !profile?.profileCompletionSkipped

  if (needsPhone || needsEmail) {
    router.replace('/profile-complete')
    return
  }
  const property = await getProperty(uid)
  router.replace(property ? '/dashboard' : '/onboarding')
}

// Google G icon SVG
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [tab, setTab] = useState<'google' | 'phone'>('google')

  // Phone OTP state
  const [phone, setPhone] = useState('')
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [otpSent, setOtpSent] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const confirmationRef = useRef<ConfirmationResult | null>(null)
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  // Redirect if already signed in
  useEffect(() => {
    if (!authLoading && user) {
      routeAfterSignIn(user.uid, user.email, user.phoneNumber, router)
    }
  }, [user, authLoading, router])

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return
    const t = setInterval(() => setCountdown((c) => c - 1), 1000)
    return () => clearInterval(t)
  }, [countdown])

  function handleDemoLogin() {
    sessionStorage.setItem('demo_mode', 'true')
    router.push('/dashboard')
  }

  async function handleGoogleSignIn() {
    if (!auth) { setError('Firebase not configured. Try Demo Mode.'); return }
    setError('')
    setLoading(true)
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      await saveUserProfile(result.user.uid, {
        email: result.user.email,
        emailVerified: true,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
      })
      await routeAfterSignIn(result.user.uid, result.user.email, result.user.phoneNumber, router)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign-in failed'
      setError(msg.replace('Firebase: ', '').replace(/\(auth\/.*\)\.?/, '').trim())
    } finally {
      setLoading(false)
    }
  }

  async function handleSendOTP() {
    if (!auth) { setError('Firebase not configured.'); return }
    if (!/^\d{10}$/.test(phone)) { setError('Enter a valid 10-digit number'); return }
    setError('')
    setLoading(true)
    try {
      if (recaptchaRef.current) { recaptchaRef.current.clear(); recaptchaRef.current = null }
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' })
      recaptchaRef.current = verifier
      const result = await signInWithPhoneNumber(auth, `+91${phone}`, verifier)
      confirmationRef.current = result
      setOtpSent(true)
      setOtpDigits(['', '', '', '', '', ''])
      setCountdown(30)
      setTimeout(() => otpRefs.current[0]?.focus(), 100)
    } catch (err: unknown) {
      if (recaptchaRef.current) { recaptchaRef.current.clear(); recaptchaRef.current = null }
      const msg = err instanceof Error ? err.message : 'Failed to send OTP'
      setError(msg.replace('Firebase: ', '').replace(/\(auth\/.*\)\.?/, '').trim())
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOTP() {
    const otp = otpDigits.join('')
    if (!confirmationRef.current || otp.length !== 6) return
    setError('')
    setLoading(true)
    try {
      const result = await confirmationRef.current.confirm(otp)
      await saveUserProfile(result.user.uid, {
        phone: result.user.phoneNumber,
        phoneVerified: true,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
      })
      await routeAfterSignIn(result.user.uid, result.user.email, result.user.phoneNumber, router)
    } catch {
      setError('Invalid OTP. Please try again.')
      setOtpDigits(['', '', '', '', '', ''])
      setTimeout(() => otpRefs.current[0]?.focus(), 100)
    } finally {
      setLoading(false)
    }
  }

  function handleOtpInput(index: number, value: string) {
    if (!/^\d?$/.test(value)) return
    const next = [...otpDigits]
    next[index] = value
    setOtpDigits(next)
    if (value && index < 5) otpRefs.current[index + 1]?.focus()
    if (value && index === 5) {
      // Auto verify when all 6 digits filled
      const full = [...next].join('')
      if (full.length === 6) setTimeout(() => handleVerifyOTPWithValue(full), 100)
    }
  }

  async function handleVerifyOTPWithValue(otp: string) {
    if (!confirmationRef.current) return
    setError('')
    setLoading(true)
    try {
      const result = await confirmationRef.current.confirm(otp)
      await saveUserProfile(result.user.uid, {
        phone: result.user.phoneNumber,
        phoneVerified: true,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
      })
      await routeAfterSignIn(result.user.uid, result.user.email, result.user.phoneNumber, router)
    } catch {
      setError('Invalid OTP. Please try again.')
      setOtpDigits(['', '', '', '', '', ''])
      setTimeout(() => otpRefs.current[0]?.focus(), 100)
    } finally {
      setLoading(false)
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  function handleResend() {
    setOtpSent(false)
    setOtpDigits(['', '', '', '', '', ''])
    setError('')
    confirmationRef.current = null
  }

  const otpComplete = otpDigits.every((d) => d !== '')

  return (
    <div className="min-h-dvh bg-vault-bg flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* reCAPTCHA anchor (invisible) */}
      <div id="recaptcha-container" />

      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-gold-500/5 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-gold-500/3 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-glow-gold pointer-events-none" />
      </div>

      <div className="w-full max-w-sm relative z-10 animate-slide-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-3xl bg-gold-gradient flex items-center justify-center mb-4 shadow-gold-glow">
            <KeyRound size={36} className="text-charcoal-300" strokeWidth={2} />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Digital Passport</h1>
          <p className="text-vault-text-muted mt-1.5 text-sm font-medium">Your Home. Secured.</p>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 p-1 glass rounded-2xl mb-6">
          <button
            onClick={() => { setTab('google'); setError('') }}
            className={cn(
              'flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2',
              tab === 'google'
                ? 'bg-gold-500 text-charcoal-300 shadow-gold-glow-sm'
                : 'text-vault-text-muted hover:text-vault-text'
            )}
          >
            <GoogleIcon /> Google
          </button>
          <button
            onClick={() => { setTab('phone'); setError('') }}
            className={cn(
              'flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2',
              tab === 'phone'
                ? 'bg-gold-500 text-charcoal-300 shadow-gold-glow-sm'
                : 'text-vault-text-muted hover:text-vault-text'
            )}
          >
            <Phone size={14} /> Phone OTP
          </button>
        </div>

        {/* ── Google Tab ── */}
        {tab === 'google' && (
          <div className="space-y-3 animate-fade-in">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className={cn(
                'w-full py-4 rounded-2xl font-bold text-sm tracking-wide transition-all duration-200',
                'glass gold-border text-vault-text',
                'hover:border-gold-500 active:scale-[0.98]',
                'flex items-center justify-center gap-3',
                loading && 'opacity-60 cursor-not-allowed'
              )}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <GoogleIcon />}
              Continue with Google
            </button>
            <p className="text-center text-xs text-vault-text-muted">
              Sign in securely with your Google account
            </p>
          </div>
        )}

        {/* ── Phone Tab ── */}
        {tab === 'phone' && (
          <div className="animate-fade-in space-y-4">
            {!otpSent ? (
              /* State A — Phone number entry */
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-vault-text-muted uppercase tracking-widest mb-2">
                    Mobile Number
                  </label>
                  <div className="flex gap-2">
                    <div className="flex items-center justify-center px-3.5 py-3.5 rounded-2xl glass gold-border text-sm font-bold text-vault-text flex-shrink-0">
                      +91
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="9876543210"
                      className="flex-1 px-4 py-3.5 text-sm font-medium placeholder:text-vault-muted rounded-2xl focus:ring-0"
                      onKeyDown={(e) => e.key === 'Enter' && handleSendOTP()}
                    />
                  </div>
                </div>
                <button
                  onClick={handleSendOTP}
                  disabled={loading || phone.length !== 10}
                  className={cn(
                    'w-full py-4 rounded-2xl font-bold text-sm tracking-wide transition-all duration-200',
                    'bg-gold-gradient text-charcoal-300',
                    'hover:shadow-gold-glow active:scale-[0.98]',
                    'flex items-center justify-center gap-2',
                    (loading || phone.length !== 10) && 'opacity-60 cursor-not-allowed'
                  )}
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Phone size={16} />}
                  {loading ? 'Sending…' : 'Send OTP'}
                </button>
              </div>
            ) : (
              /* State B — OTP entry */
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-vault-text-muted uppercase tracking-widest mb-1">
                    Enter OTP
                  </label>
                  <p className="text-xs text-vault-text-muted mb-4">
                    Sent to <span className="text-white font-semibold">+91 {phone}</span>
                  </p>
                  {/* 6-digit OTP boxes */}
                  <div className="flex gap-2 justify-between">
                    {otpDigits.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { otpRefs.current[i] = el }}
                        type="tel"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpInput(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        className={cn(
                          'w-full aspect-square text-center text-xl font-bold rounded-2xl',
                          'bg-vault-card border transition-all duration-150 focus:outline-none',
                          digit
                            ? 'border-gold-500 text-gold-500'
                            : 'border-vault-border text-vault-text'
                        )}
                      />
                    ))}
                  </div>
                </div>

                {/* Countdown / resend */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={handleResend}
                    disabled={countdown > 0}
                    className={cn(
                      'flex items-center gap-1.5 text-xs font-semibold transition-colors',
                      countdown > 0
                        ? 'text-vault-muted cursor-not-allowed'
                        : 'text-gold-500 hover:opacity-80'
                    )}
                  >
                    <RefreshCw size={12} />
                    {countdown > 0 ? `Resend in 0:${String(countdown).padStart(2, '0')}` : 'Resend OTP'}
                  </button>
                  <button
                    onClick={() => { setOtpSent(false); setPhone('') }}
                    className="text-xs text-vault-text-muted hover:text-vault-text transition-colors"
                  >
                    Change number
                  </button>
                </div>

                <button
                  onClick={handleVerifyOTP}
                  disabled={loading || !otpComplete}
                  className={cn(
                    'w-full py-4 rounded-2xl font-bold text-sm tracking-wide transition-all duration-200',
                    'bg-gold-gradient text-charcoal-300',
                    'hover:shadow-gold-glow active:scale-[0.98]',
                    'flex items-center justify-center gap-2',
                    (loading || !otpComplete) && 'opacity-60 cursor-not-allowed'
                  )}
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                  {loading ? 'Verifying…' : 'Verify & Sign In'}
                </button>
              </div>
            )}
          </div>
        )}

        {error && (
          <p className="text-red-400 text-xs font-medium px-1 mt-3 animate-fade-in">{error}</p>
        )}

        {/* Divider + Demo */}
        <div className="mt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-vault-border" />
            <span className="text-xs text-vault-text-muted font-medium">or</span>
            <div className="flex-1 h-px bg-vault-border" />
          </div>
          <button
            onClick={handleDemoLogin}
            className="w-full py-3 rounded-2xl glass text-vault-text-muted text-xs font-semibold hover:text-vault-text transition-colors"
          >
            🧪 Try Demo Mode
          </button>
        </div>

        <p className="text-center text-[10px] text-vault-muted mt-6 leading-relaxed">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>

        {/* Active vs Passive concept explainer */}
        <div className="mt-8 pt-6 border-t border-vault-border">
          <p className="text-[10px] font-bold text-vault-text-muted uppercase tracking-widest text-center mb-4">How it works</p>
          <div className="space-y-2.5">
            <div className="flex gap-3 px-3 py-2.5 rounded-xl bg-vault-card/50 border border-vault-border border-l-2 border-l-amber-500">
              <span className="text-lg flex-shrink-0">🏗️</span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Active Passport</p>
                <p className="text-[10px] text-vault-text-muted leading-relaxed mt-0.5">During construction — track snags, contractor contacts, defect resolution, and room-by-room completion.</p>
              </div>
            </div>
            <div className="flex gap-3 px-3 py-2.5 rounded-xl bg-vault-card/50 border border-vault-border border-l-2 border-l-emerald-500">
              <span className="text-lg flex-shrink-0">🏠</span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Passive Passport</p>
                <p className="text-[10px] text-vault-text-muted leading-relaxed mt-0.5">Once you move in — warranties, appliance service history, vault documents, and property timeline.</p>
              </div>
            </div>
            <div className="flex gap-3 px-3 py-2.5 rounded-xl bg-vault-card/50 border border-vault-border border-l-2 border-l-gold-500">
              <span className="text-lg flex-shrink-0">✨</span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gold-500">AI Assistant</p>
                <p className="text-[10px] text-vault-text-muted leading-relaxed mt-0.5">Ask anything — expiring warranties, service costs, room specs, open snags, or property details.</p>
              </div>
            </div>
            {/* AR Vision */}
            <div className="flex gap-3 px-3 py-2.5 rounded-xl bg-vault-card/50 border border-vault-border border-l-2 border-l-blue-500 relative overflow-hidden">
              <span className="text-lg flex-shrink-0 z-10">📱</span>
              <div className="relative z-10">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400">AR Vision</p>
                  <span className="text-[8px] px-1.5 rounded bg-blue-500/20 text-blue-400 font-bold uppercase tracking-widest border border-blue-500/30">Concept</span>
                </div>
                <p className="text-[10px] text-vault-text-muted leading-relaxed mt-0.5">X-Ray your walls and instantly scan furniture to bring up service manuals and warranties.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
