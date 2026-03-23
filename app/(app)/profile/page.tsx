'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'firebase/auth'
import {
  Settings, ChevronRight, LogOut, Bell, Ruler,
  Mail, Lock, HelpCircle, Loader2, Home, Pencil,
  Check, X, Phone, ShieldCheck, AlertCircle, Download, Building2, Plus, Smartphone,
} from 'lucide-react'
import { auth } from '@/lib/firebase'
import { useAuth } from '@/lib/useAuth'
import { useProperty } from '@/lib/useProperty'
import { usePWAInstall } from '@/lib/usePWAInstall'
import {
  subscribeProperty, subscribeDashboardStats, subscribeUserProfile,
  subscribeWarrantyAssets, subscribeSnags,
  saveUserProfile,
  type Property, type DashboardStats, type UserProfile,
} from '@/lib/firestore'
import { exportPassportPDF } from '@/lib/pdfExport'
import { cn } from '@/lib/utils'
import { useDemoDataHook } from '@/lib/demo-data'
import { PageGuide } from '@/components/PageGuide'
import { PassportModeBadge } from '@/components/PassportModeBadge'

function GoogleIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

function IdentifierRow({
  icon: Icon, label, value, verified,
}: { icon: React.ElementType; label: string; value: string | null; verified: boolean }) {
  if (!value) return null
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="w-8 h-8 rounded-xl bg-vault-muted/30 flex items-center justify-center flex-shrink-0">
        <Icon size={14} className="text-vault-text-muted" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-vault-text-muted uppercase tracking-widest">{label}</p>
        <p className="text-sm font-semibold text-white truncate mt-0.5">{value}</p>
      </div>
      <span className={cn(
        'flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full',
        verified
          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
          : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
      )}>
        {verified ? <ShieldCheck size={9} /> : <AlertCircle size={9} />}
        {verified ? 'Verified' : 'Pending'}
      </span>
    </div>
  )
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth()
  const { activePropertyId, allProperties, switchProperty } = useProperty()
  const { canInstall, isInstalled, triggerInstall } = usePWAInstall()
  const router = useRouter()
  const [property, setProperty] = useState<Property | null>(null)
  const [stats, setStats] = useState<DashboardStats>({ assetCount: 0, expiringSoonCount: 0, openSnagCount: 0 })
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [assets, setAssets] = useState<import('@/lib/firestore').WarrantyAsset[]>([])
  const [snags, setSnags] = useState<{id:string;title:string;location:string;urgency:string;status:string}[]>([])
  const [signingOut, setSigningOut] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Edit name state
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const [savingName, setSavingName] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)

  const isDemo = !authLoading && !user
  const demoContext = useDemoDataHook(activePropertyId)
  const effectiveStats = isDemo ? demoContext.stats : stats

  const displayName = user?.displayName ?? profile?.displayName ?? (isDemo ? 'Guest User' : 'Guest')
  const photoURL = user?.photoURL ?? profile?.photoURL ?? null
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
  const isGoogle = user?.providerData?.[0]?.providerId === 'google.com'

  // Resolved identifiers — prefer Firestore profile (has both) over Auth (only has one)
  const resolvedEmail = profile?.email ?? user?.email ?? null
  const resolvedPhone = profile?.phone ?? user?.phoneNumber ?? null
  const emailVerified = profile?.emailVerified ?? user?.emailVerified ?? false
  const phoneVerified = profile?.phoneVerified ?? false

  // Settings from Firestore (with defaults)
  const notifEnabled = profile?.notificationsEnabled ?? true
  const areaUnit = profile?.areaUnit ?? 'sq ft'

  useEffect(() => {
    if (!user) return
    const u1 = subscribeProperty(user.uid, setProperty, activePropertyId)
    const u2 = subscribeDashboardStats(user.uid, setStats, activePropertyId)
    const u3 = subscribeUserProfile(user.uid, setProfile)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const u4 = subscribeWarrantyAssets(user.uid, (data: any) => setAssets(data), activePropertyId)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const u5 = subscribeSnags(user.uid, (data: any) => setSnags(data), activePropertyId)
    return () => { u1(); u2(); u3(); u4(); u5() }
  }, [user, activePropertyId])

  async function toggleNotif() {
    if (!user) return
    await saveUserProfile(user.uid, { notificationsEnabled: !notifEnabled })
  }

  async function toggleAreaUnit() {
    if (!user) return
    await saveUserProfile(user.uid, { areaUnit: areaUnit === 'sq ft' ? 'm²' : 'sq ft' })
  }

  function startEditName() {
    setNameValue(displayName)
    setEditingName(true)
    setTimeout(() => nameInputRef.current?.focus(), 50)
  }

  async function saveDisplayName() {
    if (!user || !nameValue.trim()) return
    setSavingName(true)
    try {
      await saveUserProfile(user.uid, { displayName: nameValue.trim() })
    } finally {
      setSavingName(false)
      setEditingName(false)
    }
  }

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

  return (
    <div className="min-h-dvh bg-vault-bg pb-32">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 flex items-center justify-between">
        <p className="text-xs font-bold text-gold-500 uppercase tracking-widest">Profile</p>
        <div className="w-9 h-9 rounded-xl glass gold-border flex items-center justify-center">
          <Settings size={16} className="text-vault-text-muted" />
        </div>
      </div>

      {/* User Hero Card */}
      <div className="mx-5 mb-4 card p-5">
        <div className="flex items-center gap-4 mb-4">
          {/* Avatar */}
          {photoURL ? (
            <img
              src={photoURL}
              alt={displayName}
              className="w-16 h-16 rounded-2xl border-2 border-gold-500/40 object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gold-500/10 border-2 border-gold-500/40 flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-bold text-gold-500">{initials}</span>
            </div>
          )}

          {/* Name + badge */}
          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  ref={nameInputRef}
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveDisplayName(); if (e.key === 'Escape') setEditingName(false) }}
                  className="flex-1 bg-vault-muted/20 border border-gold-500/40 rounded-xl px-3 py-1.5 text-sm font-bold text-white focus:outline-none focus:border-gold-500"
                />
                <button onClick={saveDisplayName} disabled={savingName} className="text-gold-500 hover:opacity-80">
                  {savingName ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                </button>
                <button onClick={() => setEditingName(false)} className="text-vault-text-muted hover:text-vault-text">
                  <X size={15} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white truncate">{displayName}</h1>
                <button onClick={startEditName} className="flex-shrink-0 text-vault-text-muted hover:text-gold-500 transition-colors">
                  <Pencil size={13} />
                </button>
              </div>
            )}
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              {isGoogle && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-semibold text-blue-400">
                  <GoogleIcon /> Google
                </span>
              )}
              {isDemo && (
                <span className="px-2 py-0.5 rounded-full bg-gold-500/10 border border-gold-500/20 text-[10px] font-semibold text-gold-500">
                  Demo
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Identifiers */}
        <div className="border-t border-vault-border pt-3 space-y-0 divide-y divide-vault-border/50">
          <IdentifierRow icon={Mail} label="Email" value={resolvedEmail} verified={emailVerified} />
          <IdentifierRow icon={Phone} label="Mobile" value={resolvedPhone} verified={phoneVerified} />
        </div>

        {/* Add missing identifier shortcut */}
        {(!resolvedEmail || !resolvedPhone) && (
          <button
            onClick={() => router.push('/profile-complete')}
            className="mt-3 w-full py-2.5 rounded-xl bg-gold-500/5 border border-gold-500/20 text-xs font-semibold text-gold-500 hover:bg-gold-500/10 transition-colors"
          >
            + Add {!resolvedPhone ? 'phone number' : 'email address'} for recovery
          </button>
        )}
      </div>

      <div className="mx-5 mb-4">
        <PageGuide id="profile" title="Account & Subscriptions">
          Manage your personal identifiers, view property registration details, and access your 
          Digital Passport subscriptions and linked Google Workspace accounts.
        </PageGuide>
      </div>

      {/* Property Registration Details — Demo mode */}
      {isDemo && (
        <div className="mx-5 mb-4">
          <p className="text-[10px] font-semibold text-vault-text-muted uppercase tracking-widest mb-3 px-1">Property Registration</p>
          <div className="card p-4 space-y-3">
            {[
              { label: 'Registration No.',   value: 'REG/HYD/2023/081204', icon: '🔖' },
              { label: 'Developer',          value: 'Prestige Estates Projects Ltd', icon: '🏢' },
              { label: 'Project',            value: 'Prestige Cybercity — Oriana', icon: '🏙️' },
              { label: 'SRO (Kondapur)',     value: 'SRO-KDP-2023-08', icon: '⚖️' },
              { label: 'Possession Date',    value: '1 Sep 2024', icon: '🗓️' },
              { label: 'RERA No.',           value: 'P02400005021', icon: '📋' },
              { label: 'Carpet Area',        value: '1,456 sq ft (UDS: 312 sq ft)', icon: '📐' },
              { label: 'Stamp Duty Paid',    value: '₹1,24,000 (1% LRS scheme)', icon: '🧾' },
            ].map(({ label, value, icon }) => (
              <div key={label} className="flex items-center gap-3 pb-3 border-b border-vault-border/40 last:border-0 last:pb-0">
                <span className="text-base flex-shrink-0">{icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-bold text-vault-text-muted uppercase tracking-widest mb-0.5">{label}</p>
                  <p className="text-xs font-semibold text-vault-text leading-snug">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Properties */}
      <div className="mx-5 mb-4">
        <div className="flex items-center justify-between mb-3 px-1">
          <p className="text-[10px] font-semibold text-vault-text-muted uppercase tracking-widest">Your Passports</p>
          <button
            onClick={() => router.push('/onboarding?new=1')}
            className="flex items-center gap-1 text-xs font-bold text-gold-500"
          >
            <Plus size={12} /> Add
          </button>
        </div>

        <div className="space-y-2">
          {allProperties.map((p) => {
            const isActive = p.id === activePropertyId
            return (
              <button
                key={p.id}
                onClick={isDemo ? () => {} : () => switchProperty(p.id)}
                className={cn(
                  'w-full p-3.5 rounded-2xl flex items-center gap-3 transition-all text-left',
                  isActive ? 'glass-gold gold-border' : 'card'
                )}
              >
                    <div className={cn(
                      'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0',
                      isActive ? 'bg-gold-500/20' : 'bg-vault-muted/20'
                    )}>
                      <Building2 size={15} className={isActive ? 'text-gold-500' : 'text-vault-text-muted'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-bold truncate', isActive ? 'text-gold-500' : 'text-white')}>{p.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-vault-text-muted truncate">{p.unit} · {p.location}</p>
                        <PassportModeBadge occupancy={p.occupancy} />
                      </div>
                    </div>
                    {isActive && <Check size={14} className="text-gold-500 flex-shrink-0" />}
                  </button>
                )
              })}
          {allProperties.length === 0 && (
            <button onClick={() => router.push('/onboarding')} className="w-full card p-3.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gold-500/10 flex items-center justify-center">
                <Home size={15} className="text-gold-500" />
              </div>
              <span className="text-sm font-semibold text-gold-500">Set Up Your Property</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mx-5 mb-4 grid grid-cols-3 gap-2.5">
        {[
          { label: 'Assets', value: effectiveStats.assetCount, sub: 'tracked' },
          { label: 'Warranties', value: effectiveStats.expiringSoonCount, sub: 'expiring' },
          { label: 'Snags', value: effectiveStats.openSnagCount, sub: 'open' },
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

          {/* Notifications */}
          <button onClick={toggleNotif} className="flex items-center gap-3 px-4 py-3.5 w-full hover:bg-vault-muted/5 transition-colors">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <Bell size={15} className="text-blue-400" />
            </div>
            <span className="flex-1 text-sm font-medium text-vault-text text-left">Notifications</span>
            <div className={cn(
              'relative w-11 h-6 rounded-full transition-all duration-200 flex-shrink-0',
              notifEnabled ? 'bg-gold-500' : 'bg-vault-muted'
            )}>
              <span className={cn(
                'absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200',
                notifEnabled ? 'left-6' : 'left-1'
              )} />
            </div>
          </button>

          {/* Area unit */}
          <button onClick={toggleAreaUnit} className="flex items-center gap-3 px-4 py-3.5 w-full hover:bg-vault-muted/5 transition-colors">
            <div className="w-8 h-8 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
              <Ruler size={15} className="text-green-400" />
            </div>
            <span className="flex-1 text-sm font-medium text-vault-text text-left">Area Unit</span>
            <span className="text-xs font-bold text-gold-500 mr-1">{areaUnit}</span>
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
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" />
                Connected
              </span>
            ) : (
              <button
                onClick={() => router.push('/onboarding?step=gmail')}
                className="text-xs font-semibold text-gold-500"
              >
                Connect →
              </button>
            )}
          </div>

          {/* Privacy */}
          <button className="flex items-center gap-3 px-4 py-3.5 w-full hover:bg-vault-muted/5 transition-colors">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
              <Lock size={15} className="text-purple-400" />
            </div>
            <span className="flex-1 text-sm font-medium text-vault-text text-left">Privacy & Data</span>
            <ChevronRight size={15} className="text-vault-text-muted" />
          </button>

          {/* Install App */}
          {canInstall && !isInstalled && (
            <button onClick={triggerInstall} className="flex items-center gap-3 px-4 py-3.5 w-full hover:bg-vault-muted/5 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-gold-500/10 flex items-center justify-center flex-shrink-0">
                <Smartphone size={15} className="text-gold-500" />
              </div>
              <span className="flex-1 text-sm font-medium text-vault-text text-left">Install App</span>
              <span className="text-[10px] font-bold text-gold-500 bg-gold-500/10 px-2 py-0.5 rounded-full">Add to Home</span>
            </button>
          )}

          {/* Help */}
          <button className="flex items-center gap-3 px-4 py-3.5 w-full hover:bg-vault-muted/5 transition-colors">
            <div className="w-8 h-8 rounded-xl bg-gold-500/10 flex items-center justify-center flex-shrink-0">
              <HelpCircle size={15} className="text-gold-500" />
            </div>
            <span className="flex-1 text-sm font-medium text-vault-text text-left">Help & Support</span>
            <ChevronRight size={15} className="text-vault-text-muted" />
          </button>
        </div>
      </div>

      {/* Export Passport */}
      <div className="mx-5 mb-3">
        <button
          onClick={async () => {
            setExporting(true)
            try {
              await exportPassportPDF({
                property,
                assets,
                snags,
                ownerName: displayName,
                ownerEmail: resolvedEmail,
              })
            } finally {
              setExporting(false)
            }
          }}
          disabled={exporting}
          className="w-full py-3.5 rounded-2xl glass-gold gold-border text-sm font-bold text-gold-500 flex items-center justify-center gap-2 hover:bg-gold-500/10 transition-colors disabled:opacity-60"
        >
          {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          {exporting ? 'Generating PDF…' : 'Export Passport PDF'}
        </button>
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

      <p className="text-center text-[10px] text-vault-muted mt-2">
        Digital Passport v1.0 · © 2025 Peroneira
      </p>
    </div>
  )
}
