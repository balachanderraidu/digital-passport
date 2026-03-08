'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuth } from '@/lib/useAuth'
import { getProperty } from '@/lib/firestore'
import { Eye, EyeOff, KeyRound, Sparkles, FlaskConical } from 'lucide-react'
import { cn } from '@/lib/utils'

async function routeAfterSignIn(uid: string, router: ReturnType<typeof useRouter>) {
  const property = await getProperty(uid)
  router.replace(property ? '/dashboard' : '/onboarding')
}

export default function LoginPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'demo' | 'login'>('demo')

  // Already logged in — redirect away from login page
  useEffect(() => {
    if (!authLoading && user) {
      routeAfterSignIn(user.uid, router)
    }
  }, [user, authLoading, router])

  function handleDemoLogin() {
    // Set a demo flag in sessionStorage so the app knows we're in demo mode
    sessionStorage.setItem('demo_mode', 'true')
    router.push('/dashboard')
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!auth) {
      setError('Firebase not configured. Use Demo Mode to explore the app.')
      return
    }
    setLoading(true)
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      await routeAfterSignIn(result.user.uid, router)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed'
      setError(msg.replace('Firebase: ', '').replace(/\(auth\/.*\)\.?/, '').trim())
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    setError('')
    if (!auth) {
      setError('Firebase not configured. Use Demo Mode to explore the app.')
      return
    }
    setLoading(true)
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      await routeAfterSignIn(result.user.uid, router)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed'
      setError(msg.replace('Firebase: ', '').replace(/\(auth\/.*\)\.?/, '').trim())
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-vault-bg flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Animated background orbs */}
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
            onClick={() => setTab('demo')}
            className={cn(
              'flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5',
              tab === 'demo'
                ? 'bg-gold-500 text-charcoal-300 shadow-gold-glow-sm'
                : 'text-vault-text-muted hover:text-vault-text'
            )}
          >
            <FlaskConical size={14} />
            Demo Mode
          </button>
          <button
            onClick={() => setTab('login')}
            className={cn(
              'flex-1 py-2.5 rounded-xl text-sm font-bold transition-all',
              tab === 'login'
                ? 'bg-gold-500 text-charcoal-300 shadow-gold-glow-sm'
                : 'text-vault-text-muted hover:text-vault-text'
            )}
          >
            Sign In
          </button>
        </div>

        {/* Demo Mode */}
        {tab === 'demo' && (
          <div className="animate-fade-in space-y-4">
            {/* Demo mode card */}
            <div className="glass-gold gold-border rounded-2xl p-5 text-center">
              <div className="text-3xl mb-3">🏠</div>
              <h2 className="text-base font-bold text-white mb-2">Explore the Full App</h2>
              <p className="text-xs text-vault-text-muted leading-relaxed">
                Try all 5 modules with pre-loaded demo data — no account required.
                Dashboard, Vault, Snag List, Secure Share, and Warranty Center.
              </p>
            </div>

            <div className="space-y-2">
              {[
                { icon: '🏠', label: 'Interactive Digital Twin' },
                { icon: '🔐', label: 'Secure Home Vault' },
                { icon: '🔗', label: 'Burn After Reading' },
                { icon: '🔨', label: 'Snag List & Tracking' },
                { icon: '🛡️', label: 'Warranty Automation' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3 px-2">
                  <span className="text-base">{item.icon}</span>
                  <span className="text-sm text-vault-text font-medium">{item.label}</span>
                  <span className="ml-auto text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">Included</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleDemoLogin}
              className="w-full py-4 rounded-2xl font-bold text-base bg-gold-gradient text-charcoal-300 hover:shadow-gold-glow transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <FlaskConical size={18} />
              Launch Demo
            </button>
          </div>
        )}

        {/* Login form */}
        {tab === 'login' && (
          <form onSubmit={handleEmailLogin} className="space-y-4 animate-fade-in">
            <div>
              <label className="block text-xs font-semibold text-vault-text-muted uppercase tracking-widest mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@example.com"
                required
                className="w-full px-4 py-3.5 text-sm font-medium placeholder:text-vault-muted rounded-2xl focus:ring-0"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-vault-text-muted uppercase tracking-widest mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  required
                  className="w-full px-4 py-3.5 pr-12 text-sm font-medium placeholder:text-vault-muted rounded-2xl focus:ring-0"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-vault-text-muted"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-xs font-medium px-1 animate-fade-in">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className={cn(
                'w-full py-4 rounded-2xl font-bold text-sm tracking-wide transition-all duration-200',
                'bg-gold-gradient text-charcoal-300',
                'hover:shadow-gold-glow active:scale-[0.98]',
                loading && 'opacity-60 cursor-not-allowed'
              )}
            >
              {loading ? 'Unlocking...' : 'Unlock Passport'}
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-vault-border" />
              <span className="text-xs text-vault-text-muted font-medium">or</span>
              <div className="flex-1 h-px bg-vault-border" />
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className={cn(
                'w-full py-3.5 rounded-2xl font-semibold text-sm tracking-wide transition-all duration-200',
                'glass gold-border text-vault-text',
                'hover:gold-border-active active:scale-[0.98]',
                'flex items-center justify-center gap-3',
                loading && 'opacity-60 cursor-not-allowed'
              )}
            >
              <Sparkles size={18} className="text-gold-500" />
              Continue with Google
            </button>
          </form>
        )}

        <p className="text-center text-[10px] text-vault-muted mt-6 leading-relaxed">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  )
}
