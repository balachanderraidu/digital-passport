'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Shield, Clock, Lock, AlertTriangle, Loader2, Home, FileText, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getShareLinkByToken, type ShareTokenLookup } from '@/lib/firestore'

const CATEGORY_META: Record<string, { label: string; icon: string }> = {
  ownership:   { label: 'Ownership Docs',   icon: '🏠' },
  maintenance: { label: 'Maintenance Logs', icon: '🔧' },
  interior:    { label: 'Interior Specs',   icon: '🎨' },
  tax:         { label: 'Tax & Invoices',   icon: '🧾' },
  manuals:     { label: 'Tech Manuals',     icon: '📘' },
  warranties:  { label: 'Warranties',       icon: '🛡️' },
}

type ViewState = 'loading' | 'valid' | 'expired' | 'notfound'

function AccessDenied({ reason, expires }: { reason: string; expires?: boolean }) {
  return (
    <div className="min-h-dvh bg-vault-bg flex flex-col items-center justify-center px-6 text-center">
      <div className={cn(
        'w-16 h-16 rounded-3xl flex items-center justify-center mb-5',
        expires ? 'bg-red-500/10 border border-red-500/20' : 'bg-vault-surface border border-vault-border'
      )}>
        {expires ? <AlertTriangle size={28} className="text-red-400" /> : <Lock size={28} className="text-vault-text-muted" />}
      </div>
      <h1 className="text-xl font-bold text-white mb-2">
        {expires ? 'Link Expired' : 'Access Denied'}
      </h1>
      <p className="text-sm text-vault-text-muted max-w-xs leading-relaxed">{reason}</p>
      <p className="text-xs text-vault-text-muted mt-4">
        Secured by <span className="text-gold-500 font-semibold">Digital Passport</span> · Peroneira Architects
      </p>
    </div>
  )
}

export function ViewPageClient() {
  const params = useParams()
  const token = params?.token as string
  const [state, setState] = useState<ViewState>('loading')
  const [linkData, setLinkData] = useState<ShareTokenLookup | null>(null)

  useEffect(() => {
    if (!token) { setState('notfound'); return }
    getShareLinkByToken(token).then((data) => {
      if (!data) { setState('notfound'); return }
      const isExpired = data.expiresAt.toDate() < new Date() || data.status !== 'active'
      setLinkData(data)
      setState(isExpired ? 'expired' : 'valid')
    }).catch(() => setState('notfound'))
  }, [token])

  if (state === 'loading') return (
    <div className="min-h-dvh bg-vault-bg flex flex-col items-center justify-center gap-4">
      <div className="w-14 h-14 rounded-2xl bg-gold-500/20 border border-gold-500/30 flex items-center justify-center">
        <Loader2 size={24} className="text-gold-500 animate-spin" />
      </div>
      <p className="text-sm text-vault-text-muted">Verifying secure link…</p>
    </div>
  )

  if (state === 'notfound') return <AccessDenied reason="This link is invalid or doesn't exist." />
  if (state === 'expired') return <AccessDenied reason="This secure link has expired or been revoked." expires />

  const data = linkData!
  const expiresInMs = data.expiresAt.toDate().getTime() - Date.now()
  const expiresInH = Math.max(0, Math.floor(expiresInMs / (1000 * 60 * 60)))
  const sharedCategories: string[] = data.categories?.length > 0
    ? data.categories
    : (data.scope ? [data.scope] : [])

  return (
    <div className="min-h-dvh bg-vault-bg">
      {/* Watermark overlay */}
      {data.watermark && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center rotate-[-35deg] overflow-hidden">
          <div className="text-[60px] font-black text-white/[0.03] whitespace-nowrap select-none">
            FOR QUOTATION ONLY · FOR QUOTATION ONLY · FOR QUOTATION ONLY
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-5 pt-14 pb-6 bg-gradient-to-b from-vault-surface to-vault-bg">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-gold-500/20 border border-gold-500/30 flex items-center justify-center">
            <Home size={13} className="text-gold-500" />
          </div>
          <span className="text-xs font-bold text-gold-500 uppercase tracking-widest">Digital Passport by Peroneira</span>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0 mt-1">
            <Shield size={22} className="text-green-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Secure Document Access</h1>
            <p className="text-sm text-vault-text-muted mt-0.5">Shared with <span className="text-vault-text font-semibold">{data.recipient}</span></p>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gold-500">
            <Clock size={13} />
            {expiresInH > 24
              ? `Expires in ${Math.ceil(expiresInH / 24)}d`
              : `Expires in ${expiresInH}h`}
          </div>
          {data.passwordProtected && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-400">
              <Lock size={13} /> Password Protected
            </div>
          )}
          {data.watermark && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-400">
              <FileText size={13} /> Watermarked
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-5">
        <div className="card p-4 mb-4 border-green-500/20 bg-green-500/5">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 size={14} className="text-green-400" />
            <p className="text-xs font-bold text-green-400 uppercase tracking-widest">Access Granted</p>
          </div>
          <p className="text-sm text-vault-text">
            <span className="font-semibold">{data.scope || 'Document access'}</span> — scoped read-only access for quotation purposes.
          </p>
        </div>

        {sharedCategories.length > 0 && (
          <div className="mb-5">
            <h2 className="text-sm font-bold text-white mb-3">Accessible Categories</h2>
            <div className="space-y-2">
              {sharedCategories.map((cat) => {
                const meta = CATEGORY_META[cat] ?? { label: cat, icon: '📄' }
                return (
                  <div key={cat} className="card p-4 flex items-center gap-3">
                    <span className="text-2xl">{meta.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-vault-text">{meta.label}</p>
                      <p className="text-xs text-vault-text-muted mt-0.5">Read-only · no download</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="card p-4 border-vault-border bg-vault-card/50 mb-24">
          <p className="text-[11px] text-vault-text-muted leading-relaxed">
            ⚠️ This is a time-limited, read-only view. No personal data is shared. This link expires automatically and cannot be forwarded.
          </p>
          <p className="text-[11px] text-vault-text-muted mt-2">
            Secured by <span className="text-gold-500 font-semibold">Digital Passport</span> · Peroneira Architects © 2026
          </p>
        </div>
      </div>
    </div>
  )
}
