'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
} from 'firebase/auth'
import {
  Settings,
  ChevronRight,
  LogOut,
  Bell,
  Ruler,
  Mail,
  Lock,
  HelpCircle,
  Loader2,
  Home,
  Pencil,
} from 'lucide-react'
import { auth } from '@/lib/firebase'
import { useAuth } from '@/lib/useAuth'
import { subscribeProperty, subscribeDashboardStats, type Property, type DashboardStats } from '@/lib/firestore'
import { cn } from '@/lib/utils'

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [property, setProperty] = useState<Property | null>(null)
  const [stats, setStats] = useState<DashboardStats>({ assetCount: 0, expiringSoonCount: 0, openSnagCount: 0 })
  const [signingOut, setSigningOut] = useState(false)
  const [notifEnabled, setNotifEnabled] = useState(true)
  const [areaUnit, setAreaUnit] = useState<'sq ft' | 'm²'>('sq ft')

  const isDemo = typeof window !== 'undefined' && sessionStorage.getItem('demo_mode') === 'true'

  // Demo user placeholder
  const displayName = user?.displayName ?? (isDemo ? 'Demo User' : 'Guest')
  const email = user?.email ?? (isDemo ? 'demo@digitalpassport.app' : '')
  const photoURL = user?.photoURL ?? null
  const isGoogle = user?.providerData?.[0]?.providerId === 'google.com'

  useEffect(() => {
    if (!user) return
    const unsubProperty = subscribeProperty(user.uid, setProperty)
    const unsubStats = subscribeDashboardStats(user.uid, setStats)
    return () => { unsubProperty(); unsubStats() }
  }, [user])

  async function handleSignOut() {
    setSigningOut(true)
    if (isDemo) {
      sessionStorage.removeItem('demo_mode')
      router.replace('/login')
      return
    }
    try {
      if (auth) await signOut(auth)
      router.replace('/login')
    } catch {
      setSigningOut(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-dvh bg-vault-bg flex items-center justify-center">
        <Loader2 size={28} className="text-gold-500 animate-spin" />
      </div>
    )
  }

  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="min-h-dvh bg-vault-bg pb-32">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 flex items-center justify-between">
        <p className="text-xs font-bold text-gold-500 uppercase tracking-widest">Profile</p>
        <button className="w-9 h-9 rounded-xl glass gold-border flex items-center justify-center">
          <Settings size={16} className="text-vault-text-muted" />
        </button>
      </div>

      {/* User Hero Card */}
      <div className="mx-5 mb-4 card p-5 flex flex-col items-center text-center gap-3">
        {photoURL ? (
          <img
            src={photoURL}
            alt={displayName}
            className="w-20 h-20 rounded-full border-2 border-gold-500/40 object-cover"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gold-500/10 border-2 border-gold-500/40 flex items-center justify-center">
            <span className="text-2xl font-bold text-gold-500">{initials}</span>
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold text-white">{displayName}</h1>
          {email && <p className="text-sm text-vault-text-muted mt-0.5">{email}</p>}
        </div>
        <div className="flex items-center gap-2">
          {isGoogle && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[11px] font-semibold text-blue-400">
              {/* Google G */}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google Account
            </span>
          )}
          {isDemo && (
            <span className="px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/20 text-[11px] font-semibold text-gold-500">
              Demo Mode
            </span>
          )}
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl glass gold-border text-xs font-semibold text-vault-text hover:border-gold-500 transition-all">
          <Pencil size={12} className="text-gold-500" /> Edit Profile
        </button>
      </div>

      {/* Property Card */}
      <div className="mx-5 mb-4 glass-gold gold-border rounded-2xl p-5">
        <p className="text-[10px] font-semibold text-vault-text-muted uppercase tracking-widest mb-3">Your Property</p>
        {property ? (
          <>
            <h2 className="text-lg font-bold text-white mb-1.5">{property.name}</h2>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-vault-text-muted">{property.unit}</span>
              <span className="text-vault-muted">·</span>
              <span className="text-xs text-vault-text-muted">{property.location}</span>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs text-vault-text-muted">{property.floorPlanType}</span>
              {property.area > 0 && (
                <>
                  <span className="text-vault-muted">·</span>
                  <span className="text-xs text-vault-text-muted">{property.area} {areaUnit}</span>
                </>
              )}
            </div>
            <button
              onClick={() => router.push('/onboarding')}
              className="mt-3 text-xs font-semibold text-gold-500 flex items-center gap-1 hover:opacity-80 transition-opacity"
            >
              Edit Property <ChevronRight size={13} />
            </button>
          </>
        ) : (
          <button
            onClick={() => router.push('/onboarding')}
            className="flex items-center gap-3 w-full"
          >
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 flex items-center justify-center">
              <Home size={18} className="text-gold-500" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-white">Set Up Your Property</p>
              <p className="text-xs text-vault-text-muted mt-0.5">Add your home to get started</p>
            </div>
            <ChevronRight size={16} className="text-gold-500" />
          </button>
        )}
      </div>

      {/* Quick Stats */}
      <div className="mx-5 mb-4 grid grid-cols-3 gap-2.5">
        {[
          { label: 'Assets', value: isDemo ? 12 : stats.assetCount, sub: 'tracked' },
          { label: 'Warranties', value: isDemo ? 2 : stats.expiringSoonCount, sub: 'expiring' },
          { label: 'Snags', value: isDemo ? 1 : stats.openSnagCount, sub: 'open' },
        ].map((s) => (
          <div key={s.label} className="card p-3 text-center">
            <div className="text-xl font-bold gold-text">{s.value}</div>
            <div className="text-[10px] font-medium text-vault-text-muted mt-0.5">{s.label}</div>
            <div className="text-[9px] text-vault-muted">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Settings */}
      <div className="mx-5 mb-4">
        <p className="text-[10px] font-semibold text-vault-text-muted uppercase tracking-widest mb-3 px-1">Settings</p>
        <div className="card divide-y divide-vault-border overflow-hidden">
          {/* Notifications toggle */}
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <Bell size={15} className="text-blue-400" />
            </div>
            <span className="flex-1 text-sm font-medium text-vault-text">Notifications</span>
            <button
              onClick={() => setNotifEnabled((v) => !v)}
              className={cn(
                'relative w-11 h-6 rounded-full transition-all duration-200',
                notifEnabled ? 'bg-gold-500' : 'bg-vault-muted'
              )}
            >
              <span className={cn(
                'absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200',
                notifEnabled ? 'left-6' : 'left-1'
              )} />
            </button>
          </div>

          {/* Area unit */}
          <button
            onClick={() => setAreaUnit((u) => u === 'sq ft' ? 'm²' : 'sq ft')}
            className="flex items-center gap-3 px-4 py-3.5 w-full hover:bg-vault-muted/10 transition-colors"
          >
            <div className="w-8 h-8 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
              <Ruler size={15} className="text-green-400" />
            </div>
            <span className="flex-1 text-sm font-medium text-vault-text text-left">Area Unit</span>
            <span className="text-xs font-semibold text-gold-500">{areaUnit}</span>
            <ChevronRight size={15} className="text-vault-text-muted" />
          </button>

          {/* Gmail Sync */}
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
              <Mail size={15} className="text-red-400" />
            </div>
            <span className="flex-1 text-sm font-medium text-vault-text">Gmail Sync</span>
            {property?.gmailLinked ? (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-green-400">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full" /> Connected
              </span>
            ) : (
              <span className="text-xs text-vault-text-muted">Not connected</span>
            )}
          </div>

          {/* Privacy */}
          <button className="flex items-center gap-3 px-4 py-3.5 w-full hover:bg-vault-muted/10 transition-colors">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
              <Lock size={15} className="text-purple-400" />
            </div>
            <span className="flex-1 text-sm font-medium text-vault-text text-left">Privacy & Data</span>
            <ChevronRight size={15} className="text-vault-text-muted" />
          </button>

          {/* Help */}
          <button className="flex items-center gap-3 px-4 py-3.5 w-full hover:bg-vault-muted/10 transition-colors">
            <div className="w-8 h-8 rounded-xl bg-gold-500/10 flex items-center justify-center flex-shrink-0">
              <HelpCircle size={15} className="text-gold-500" />
            </div>
            <span className="flex-1 text-sm font-medium text-vault-text text-left">Help & Support</span>
            <ChevronRight size={15} className="text-vault-text-muted" />
          </button>
        </div>
      </div>

      {/* Sign Out */}
      <div className="mx-5 mb-4">
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full py-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-sm font-bold text-red-400 flex items-center justify-center gap-2 hover:bg-red-500/15 transition-colors disabled:opacity-60"
        >
          {signingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
          {signingOut ? 'Signing out…' : 'Sign Out'}
        </button>
      </div>

      {/* Version */}
      <p className="text-center text-[10px] text-vault-muted mt-2">
        Digital Passport v1.0 · © 2025 Peroneira
      </p>
    </div>
  )
}
