'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Camera, MapPin, ChevronRight, CheckCircle2, Loader2 } from 'lucide-react'
import { cn, formatDateTime } from '@/lib/utils'
import { useAuth } from '@/lib/useAuth'
import { useProperty } from '@/lib/useProperty'
import { subscribeSnags, type Snag } from '@/lib/firestore'
import { useDemoDataHook } from '@/lib/demo-data'
import { PageGuide } from '@/components/PageGuide'
import { PassportModeBadge } from '@/components/PassportModeBadge'

type Urgency = 'low' | 'medium' | 'high'
type SnagStatus = 'open' | 'in-progress' | 'fixed'

const URGENCY_CONFIG: Record<Urgency, { label: string; cls: string }> = {
  low: { label: 'Low', cls: 'urgency-low' },
  medium: { label: 'Medium', cls: 'urgency-medium' },
  high: { label: 'High', cls: 'urgency-high' },
}

const STATUS_CONFIG: Record<SnagStatus, { label: string; color: string }> = {
  open: { label: 'Open', color: 'text-red-400' },
  'in-progress': { label: 'In Progress', color: 'text-yellow-400' },
  fixed: { label: 'Fixed', color: 'text-green-400' },
}

type Tab = 'open' | 'in-progress' | 'fixed'

export default function SnagsPage() {
  const { user, loading: authLoading } = useAuth()
  const { activePropertyId, activeProperty } = useProperty()
  const [activeTab, setActiveTab] = useState<Tab>('open')
  const [snags, setSnags] = useState<Snag[]>([])
  const [loading, setLoading] = useState(true)

  const isDemo = !authLoading && !user
  const demoContext = useDemoDataHook(activePropertyId)

  // Demo mode
  useEffect(() => {
    if (!isDemo) return
    setSnags(demoContext.snags)
    setLoading(false)
  }, [isDemo, demoContext.snags])

  // Real user
  useEffect(() => {
    if (!user) return
    setLoading(true)
    const unsub = subscribeSnags(user.uid, (data) => {
      setSnags(data)
      setLoading(false)
    }, activePropertyId)
    return unsub
  }, [user, activePropertyId])

  const total = snags.length
  const fixed = snags.filter((s) => s.status === 'fixed').length
  const progressPct = total > 0 ? Math.round((fixed / total) * 100) : 0
  const filteredSnags = snags.filter((s) => s.status === activeTab)

  if (authLoading) {
    return (
      <div className="min-h-dvh bg-vault-bg flex items-center justify-center">
        <Loader2 size={28} className="text-gold-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-vault-bg">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 bg-gradient-to-b from-vault-surface to-vault-bg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Snag List</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-sm text-vault-text-muted">Defect tracking · Punch list</p>
              <PassportModeBadge occupancy={isDemo ? demoContext.property.occupancy : activeProperty?.occupancy} />
            </div>
          </div>
          <Link
            href="/snags/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold-gradient text-charcoal-300 font-bold text-sm hover:shadow-gold-glow transition-all"
          >
            <Plus size={15} />
            Log Snag
          </Link>
        </div>

        <div className="mt-4">
          <PageGuide id="snags" title="Punch List & Defect Tracking">
            Log construction defects or maintenance issues here. Attach photos, set priority levels, and 
            track the contractor's progress until the issue is perfectly resolved.
          </PageGuide>
        </div>

        {/* Progress */}
        <div className="mt-4 card p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs font-semibold text-vault-text-muted uppercase tracking-widest">Project Status</p>
              <p className="text-2xl font-bold gold-text mt-0.5">{progressPct}% Resolved</p>
            </div>
            <div className="relative w-16 h-16">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="28" fill="none" stroke="#2A2A2A" strokeWidth="6" />
                <circle
                  cx="32" cy="32" r="28" fill="none"
                  stroke="#FFD700" strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 28}`}
                  strokeDashoffset={`${2 * Math.PI * 28 * (1 - progressPct / 100)}`}
                  className="transition-all duration-500"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gold-500">
                {progressPct}%
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {[
              { label: 'Open', value: snags.filter((s) => s.status === 'open').length, color: 'text-red-400' },
              { label: 'In Progress', value: snags.filter((s) => s.status === 'in-progress').length, color: 'text-yellow-400' },
              { label: 'Fixed', value: fixed, color: 'text-green-400' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className={cn('text-lg font-bold', stat.color)}>{stat.value}</p>
                <p className="text-[10px] text-vault-text-muted font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 mt-2">
        <div className="flex gap-1 p-1 glass rounded-xl mb-4">
          {(['open', 'in-progress', 'fixed'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex-1 py-2 rounded-lg text-xs font-bold transition-all capitalize',
                activeTab === tab
                  ? 'bg-gold-500 text-charcoal-300 shadow-gold-glow-sm'
                  : 'text-vault-text-muted hover:text-vault-text'
              )}
            >
              {tab === 'in-progress' ? 'In Progress' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex flex-col items-center py-12 gap-3">
            <Loader2 size={28} className="text-gold-500 animate-spin" />
            <p className="text-sm text-vault-text-muted">Loading snags…</p>
          </div>
        )}

        <div className="pb-28">
          {!loading && filteredSnags.length === 0 && (
            <div className="text-center py-12 text-vault-text-muted">
              <CheckCircle2 size={40} className="mx-auto mb-3 text-green-500/40" />
              <p className="text-sm font-medium">No snags in this category</p>
            </div>
          )}

          {/* Urgency groups: High → Medium → Low */}
          {!loading && (['high', 'medium', 'low'] as Urgency[]).map((urgency) => {
            const group = filteredSnags.filter((s) => s.urgency === urgency)
            if (group.length === 0) return null
            const cfg = URGENCY_CONFIG[urgency]
            const dotColor = urgency === 'high' ? 'bg-red-500' : urgency === 'medium' ? 'bg-amber-500' : 'bg-stone-400'
            return (
              <div key={urgency} className="mb-5">
                {/* Group header */}
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
                  <span className={cn('text-[10px] font-bold uppercase tracking-widest', cfg.cls.replace('urgency-high', 'text-red-400').replace('urgency-medium', 'text-amber-400').replace('urgency-low', 'text-stone-400'))}>
                    {cfg.label} Priority
                  </span>
                  <span className="text-[10px] text-vault-text-muted">({group.length})</span>
                  <div className="flex-1 h-px bg-vault-border" />
                </div>

                <div className="space-y-2.5">
                  {group.map((snag) => (
                    <Link key={snag.id} href={`/snags/${snag.id}`} className="card p-4 card-hover block">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-vault-muted/50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {snag.photoUrl ? (
                            <img src={snag.photoUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Camera size={18} className="text-vault-text-muted" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-vault-text leading-tight">{snag.title}</p>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <MapPin size={11} className="text-vault-text-muted" />
                            <span className="text-xs text-vault-text-muted">{snag.location}</span>
                            <span className="text-vault-border">·</span>
                            <span className="text-xs text-vault-text-muted">{snag.category}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded-full', cfg.cls)}>
                              {cfg.label}
                            </span>
                            <span className="text-[9px] text-vault-text-muted ml-auto">
                              {snag.createdAt ? formatDateTime(snag.createdAt.toDate().toISOString()) : '—'}
                            </span>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-vault-text-muted flex-shrink-0 mt-1" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

