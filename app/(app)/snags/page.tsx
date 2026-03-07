'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Camera, MapPin, ChevronRight, CheckCircle2 } from 'lucide-react'
import { cn, formatDateTime } from '@/lib/utils'

type Urgency = 'low' | 'medium' | 'high'
type SnagStatus = 'open' | 'in-progress' | 'fixed'

interface Snag {
  id: string
  title: string
  location: string
  category: string
  urgency: Urgency
  status: SnagStatus
  createdAt: string
  photo?: string
}

const DEMO_SNAGS: Snag[] = [
  { id: 's1', title: 'Paint peeling near bathroom door frame', location: 'Master Bathroom', category: 'Paint & Finish', urgency: 'high', status: 'open', createdAt: '2026-03-05T10:30:00Z' },
  { id: 's2', title: 'Bedroom door not closing flush', location: 'Room 2', category: 'Doors & Windows', urgency: 'medium', status: 'in-progress', createdAt: '2026-03-03T14:00:00Z' },
  { id: 's3', title: 'Kitchen exhaust fan noisy', location: 'Kitchen', category: 'Electrical & Fixtures', urgency: 'low', status: 'open', createdAt: '2026-03-01T09:00:00Z' },
  { id: 's4', title: 'Tiles cracked in balcony', location: 'Balcony', category: 'Flooring', urgency: 'high', status: 'fixed', createdAt: '2026-02-28T16:00:00Z' },
  { id: 's5', title: 'Water seepage in master bathroom ceiling', location: 'Master Bathroom', category: 'Plumbing', urgency: 'high', status: 'fixed', createdAt: '2026-02-25T11:00:00Z' },
]

const TOTAL = DEMO_SNAGS.length
const FIXED = DEMO_SNAGS.filter(s => s.status === 'fixed').length
const PROGRESS_PCT = Math.round((FIXED / TOTAL) * 100)

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
  const [activeTab, setActiveTab] = useState<Tab>('open')

  const filteredSnags = DEMO_SNAGS.filter(s => s.status === activeTab)

  return (
    <div className="min-h-dvh bg-vault-bg">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 bg-gradient-to-b from-vault-surface to-vault-bg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Snag List</h1>
            <p className="text-sm text-vault-text-muted mt-0.5">Defect tracking · Handover phase</p>
          </div>
          <Link
            href="/snags/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold-gradient text-charcoal-300 font-bold text-sm hover:shadow-gold-glow transition-all"
          >
            <Plus size={15} />
            Log Snag
          </Link>
        </div>

        {/* Progress */}
        <div className="mt-4 card p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs font-semibold text-vault-text-muted uppercase tracking-widest">Project Status</p>
              <p className="text-2xl font-bold gold-text mt-0.5">{PROGRESS_PCT}% Resolved</p>
            </div>
            <div className="relative w-16 h-16">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="28" fill="none" stroke="#2A2A2A" strokeWidth="6" />
                <circle
                  cx="32" cy="32" r="28" fill="none"
                  stroke="#FFD700" strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 28}`}
                  strokeDashoffset={`${2 * Math.PI * 28 * (1 - PROGRESS_PCT / 100)}`}
                  className="transition-all duration-500"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gold-500">
                {PROGRESS_PCT}%
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {[
              { label: 'Open', value: DEMO_SNAGS.filter(s=>s.status==='open').length, color: 'text-red-400' },
              { label: 'In Progress', value: DEMO_SNAGS.filter(s=>s.status==='in-progress').length, color: 'text-yellow-400' },
              { label: 'Fixed', value: FIXED, color: 'text-green-400' },
            ].map(stat => (
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
          {(['open', 'in-progress', 'fixed'] as Tab[]).map(tab => (
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

        <div className="space-y-3 pb-4">
          {filteredSnags.length === 0 && (
            <div className="text-center py-12 text-vault-text-muted">
              <CheckCircle2 size={40} className="mx-auto mb-3 text-green-500/40" />
              <p className="text-sm font-medium">No snags in this category</p>
            </div>
          )}
          {filteredSnags.map((snag) => (
            <Link key={snag.id} href={`/snags/${snag.id}`} className="card p-4 card-hover block">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-vault-muted/50 flex items-center justify-center flex-shrink-0">
                  <Camera size={18} className="text-vault-text-muted" />
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
                    <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded-full', URGENCY_CONFIG[snag.urgency].cls)}>
                      {URGENCY_CONFIG[snag.urgency].label}
                    </span>
                    <span className={cn('text-[10px] font-semibold', STATUS_CONFIG[snag.status].color)}>
                      {STATUS_CONFIG[snag.status].label}
                    </span>
                    <span className="text-[9px] text-vault-text-muted ml-auto">
                      {formatDateTime(snag.createdAt)}
                    </span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-vault-text-muted flex-shrink-0 mt-1" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
