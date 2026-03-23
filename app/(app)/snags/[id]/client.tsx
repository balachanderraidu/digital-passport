'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Camera, MapPin, CheckCircle2, Share2, MessageSquare, Loader2, ShieldOff } from 'lucide-react'
import { cn, formatDate, formatDateTime } from '@/lib/utils'
import { useAuth } from '@/lib/useAuth'
import { useProperty } from '@/lib/useProperty'
import { subscribeSnags, updateSnagStatus, type Snag } from '@/lib/firestore'
import { DEMO_SNAGS, DEMO_ITEM_LINKS } from '@/lib/demo-data'

type SnagStatus = 'open' | 'in-progress' | 'fixed'
type Urgency = 'low' | 'medium' | 'high'

const URGENCY_CONFIG: Record<Urgency, { label: string; cls: string }> = {
  low: { label: 'Low', cls: 'urgency-low' },
  medium: { label: 'Medium', cls: 'urgency-medium' },
  high: { label: 'High', cls: 'urgency-high' },
}

const STATUS_STEPS: { key: SnagStatus; label: string }[] = [
  { key: 'open', label: 'Open' },
  { key: 'in-progress', label: 'In Progress' },
  { key: 'fixed', label: 'Fixed' },
]

export default function SnagDetailClient({ id }: { id: string }) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { activePropertyId } = useProperty()
  const [snag, setSnag] = useState<Snag | null>(null)
  const [loading, setLoading] = useState(true)
  const [advancing, setAdvancing] = useState(false)

  const isDemo = !authLoading && !user

  // Demo mode
  useEffect(() => {
    if (!isDemo) return
    const found = DEMO_SNAGS.find((s) => s.id === id) ?? null
    setSnag(found)
    setLoading(false)
  }, [isDemo, id])

  // Real user
  useEffect(() => {
    if (!user) return
    setLoading(true)
    const unsub = subscribeSnags(user.uid, (snags) => {
      const found = snags.find((s) => s.id === id) ?? null
      setSnag(found)
      setLoading(false)
    }, activePropertyId)
    return unsub
  }, [user, id, activePropertyId])

  async function advance() {
    if (!user || !snag) return
    const currentIdx = STATUS_STEPS.findIndex((s) => s.key === snag.status)
    if (currentIdx >= STATUS_STEPS.length - 1) return
    const nextStatus = STATUS_STEPS[currentIdx + 1].key
    setAdvancing(true)
    try {
      await updateSnagStatus(user.uid, snag.id, nextStatus, activePropertyId)
    } finally {
      setAdvancing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-dvh bg-vault-bg flex items-center justify-center">
        <Loader2 size={28} className="text-gold-500 animate-spin" />
      </div>
    )
  }

  if (!snag) {
    return (
      <div className="min-h-dvh bg-vault-bg flex flex-col items-center justify-center gap-4 px-6 text-center">
        <ShieldOff size={40} className="text-vault-text-muted opacity-40" />
        <p className="text-base font-bold text-white">Snag not found</p>
        <p className="text-sm text-vault-text-muted">This snag may have been deleted or belongs to a different property.</p>
        <button onClick={() => router.replace('/snags')} className="mt-2 text-sm font-semibold text-gold-500">
          ← Back to Snag List
        </button>
      </div>
    )
  }

  const currentStepIdx = STATUS_STEPS.findIndex((s) => s.key === snag.status)

  return (
    <div className="min-h-dvh bg-vault-bg">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 bg-gradient-to-b from-vault-surface to-vault-bg">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-9 h-9 rounded-xl glass flex items-center justify-center flex-shrink-0">
            <ArrowLeft size={18} className="text-vault-text-muted" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white">Snag Detail</h1>
            <p className="text-xs text-vault-text-muted mt-0.5">{snag.location} · {snag.category}</p>
          </div>
        </div>
      </div>

      <div className="px-5 pb-28">
        {/* Photo Hero */}
        <div className="relative rounded-2xl overflow-hidden border border-vault-border shadow-2xl bg-vault-surface mb-5 w-full aspect-[4/3] flex flex-col items-center justify-center gap-2 group">
          {snag.photoUrl ? (
            <>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10 pointer-events-none" />
              <img src={snag.photoUrl} alt="Snag photo" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            </>
          ) : (
            <>
              <Camera size={32} className="text-vault-text-muted/40 z-10 relative" />
              <p className="text-xs font-medium text-vault-text-muted z-10 relative">No photo attached</p>
            </>
          )}
        </div>

        {/* Status progress bar */}
        <div className="card p-4 mb-4">
          <div className="flex items-center gap-1">
            {STATUS_STEPS.map((step, idx) => {
              const isDone = idx <= currentStepIdx
              const isCurrent = idx === currentStepIdx
              return (
                <div key={step.key} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className={cn(
                    'h-1.5 rounded-full w-full transition-all duration-300',
                    isDone
                      ? isCurrent && snag.status === 'fixed'
                        ? 'bg-green-500'
                        : 'bg-gold-500'
                      : 'bg-vault-muted'
                  )} />
                  <span className={cn(
                    'text-[9px] font-bold transition-all',
                    isCurrent
                      ? snag.status === 'fixed' ? 'text-green-400' : 'text-gold-500'
                      : isDone ? 'text-vault-text-muted' : 'text-vault-muted'
                  )}>
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Info card */}
        <div className="card p-4 mb-4 space-y-3">
          <p className="text-sm font-bold text-vault-text">{snag.title}</p>
          <div className="flex items-center gap-1.5">
            <MapPin size={12} className="text-vault-text-muted" />
            <span className="text-xs text-vault-text-muted">{snag.location}</span>
            <span className="text-vault-border">·</span>
            <span className="text-xs text-vault-text-muted">{snag.category}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded-full', URGENCY_CONFIG[snag.urgency as Urgency]?.cls ?? 'urgency-low')}>
              {URGENCY_CONFIG[snag.urgency as Urgency]?.label ?? snag.urgency}
            </span>
            <span className="text-[10px] text-vault-text-muted">
              Logged {snag.createdAt ? formatDateTime(snag.createdAt.toDate().toISOString()) : '—'}
            </span>
          </div>
          {snag.updatedAt && snag.updatedAt !== snag.createdAt && (
            <p className="text-[10px] text-vault-text-muted">
              Updated {formatDateTime(snag.updatedAt.toDate().toISOString())}
            </p>
          )}
        </div>

        {/* Linked spec item cross-reference */}
        {(() => {
          const linkedItem = Object.entries(DEMO_ITEM_LINKS).find(
            ([, link]) => link.snagIds?.includes(snag.id)
          )
          if (!linkedItem) return null
          const [itemName] = linkedItem
          return (
            <div className="card p-3.5 mb-4 flex items-start gap-3 border-gold-500/20">
              <span className="text-lg flex-shrink-0">🔗</span>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-bold text-vault-text-muted uppercase tracking-widest mb-1">Linked Spec Item</p>
                <p className="text-sm font-semibold text-vault-text leading-snug">{itemName}</p>
                <p className="text-[10px] text-vault-text-muted mt-0.5">{snag.location} · Tap room in Home Twin to view full spec</p>
              </div>
            </div>
          )
        })()}

        {/* CTA buttons */}
        <div className="grid grid-cols-2 gap-3">
          {snag.status !== 'fixed' && !isDemo && (
            <button
              onClick={advance}
              disabled={advancing}
              className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gold-gradient text-charcoal-300 font-bold text-sm hover:shadow-gold-glow transition-all disabled:opacity-60"
            >
              {advancing
                ? <Loader2 size={15} className="animate-spin" />
                : <CheckCircle2 size={16} />
              }
              {snag.status === 'open' ? 'Mark In Progress' : 'Mark as Fixed'}
            </button>
          )}
          {snag.status === 'fixed' && (
            <div className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-green-500/10 border border-green-500/30 text-green-400 font-bold text-sm">
              <CheckCircle2 size={16} />
              Resolved ✓
            </div>
          )}
          <button className="flex items-center justify-center gap-2 py-3.5 rounded-2xl glass gold-border text-vault-text font-semibold text-sm hover:gold-border-active transition-all">
            <Share2 size={16} className="text-gold-500" />
            Share Report
          </button>
        </div>
      </div>
    </div>
  )
}
