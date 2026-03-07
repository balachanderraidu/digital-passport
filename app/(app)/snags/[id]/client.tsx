'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Camera, MapPin, CheckCircle2, Share2, MessageSquare } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'

type SnagStatus = 'open' | 'in-progress' | 'fixed'
type Urgency = 'low' | 'medium' | 'high'

interface SnagDetail {
  id: string
  title: string
  location: string
  category: string
  urgency: Urgency
  status: SnagStatus
  createdAt: string
  comments: { text: string; date: string; resolved?: boolean }[]
}

const DEMO_SNAGS: Record<string, SnagDetail> = {
  s1: {
    id: 's1',
    title: 'Paint peeling near bathroom door frame',
    location: 'Master Bathroom',
    category: 'Paint & Finish',
    urgency: 'high',
    status: 'open',
    createdAt: '2026-03-05',
    comments: [],
  },
  s2: {
    id: 's2',
    title: 'Bedroom door not closing flush',
    location: 'Room 2',
    category: 'Doors & Windows',
    urgency: 'medium',
    status: 'in-progress',
    createdAt: '2026-03-03',
    comments: [{ text: 'Carpenter inspected — hinge needs adjustment', date: '2026-03-04' }],
  },
  s3: {
    id: 's3',
    title: 'Kitchen exhaust fan noisy',
    location: 'Kitchen',
    category: 'Electrical & Fixtures',
    urgency: 'low',
    status: 'open',
    createdAt: '2026-03-01',
    comments: [],
  },
  s4: {
    id: 's4',
    title: 'Tiles cracked in balcony',
    location: 'Balcony',
    category: 'Flooring',
    urgency: 'high',
    status: 'fixed',
    createdAt: '2026-02-28',
    comments: [
      { text: 'Builder team inspected and confirmed replacement needed', date: '2026-03-01' },
      { text: 'Tiles replaced — area inspected and cleared', date: '2026-03-10', resolved: true },
    ],
  },
  s5: {
    id: 's5',
    title: 'Water seepage in master bathroom ceiling',
    location: 'Master Bathroom',
    category: 'Plumbing',
    urgency: 'high',
    status: 'fixed',
    createdAt: '2026-02-25',
    comments: [
      { text: 'Plumber inspected, needs pipe replacement', date: '2026-02-28' },
      { text: 'Pipe replaced, area dried out', date: '2026-03-05', resolved: true },
    ],
  },
}

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
  const snag = DEMO_SNAGS[id] ?? DEMO_SNAGS['s1']
  const [status, setStatus] = useState<SnagStatus>(snag.status)
  const currentStepIdx = STATUS_STEPS.findIndex((s) => s.key === status)

  function advance() {
    if (currentStepIdx < STATUS_STEPS.length - 1) {
      setStatus(STATUS_STEPS[currentStepIdx + 1].key)
    }
  }

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
        {/* Photo placeholder */}
        <div className="relative rounded-2xl overflow-hidden border border-vault-border bg-vault-surface mb-4 flex flex-col items-center justify-center gap-2" style={{ height: '200px' }}>
          <Camera size={32} className="text-vault-text-muted/40" />
          <p className="text-xs font-medium text-vault-text-muted">No photo attached</p>
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
                      ? isCurrent && status === 'fixed'
                        ? 'bg-green-500'
                        : 'bg-gold-500'
                      : 'bg-vault-muted'
                  )} />
                  <span className={cn(
                    'text-[9px] font-bold transition-all',
                    isCurrent
                      ? status === 'fixed' ? 'text-green-400' : 'text-gold-500'
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
            <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded-full', URGENCY_CONFIG[snag.urgency].cls)}>
              {URGENCY_CONFIG[snag.urgency].label}
            </span>
            <span className="text-[10px] text-vault-text-muted">Logged {formatDate(snag.createdAt)}</span>
          </div>
        </div>

        {/* Comments */}
        {snag.comments.length > 0 && (
          <div className="mb-5">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <MessageSquare size={14} className="text-gold-500" />
              Updates
            </h3>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-vault-border" />
              <div className="space-y-3">
                {snag.comments.map((c, i) => (
                  <div key={i} className="flex gap-4">
                    <div className={cn(
                      'relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border',
                      c.resolved ? 'bg-green-500/10 border-green-500/30' : 'bg-vault-surface border-vault-border'
                    )}>
                      {c.resolved
                        ? <CheckCircle2 size={14} className="text-green-400" />
                        : <span className="w-2 h-2 rounded-full bg-vault-text-muted" />}
                    </div>
                    <div className="flex-1 card p-3">
                      <p className="text-xs font-semibold text-vault-text">{c.text}</p>
                      <p className="text-[10px] text-vault-text-muted mt-0.5">{formatDate(c.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CTA buttons */}
        <div className="grid grid-cols-2 gap-3">
          {status !== 'fixed' && (
            <button
              onClick={advance}
              className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gold-gradient text-charcoal-300 font-bold text-sm hover:shadow-gold-glow transition-all"
            >
              <CheckCircle2 size={16} />
              {status === 'open' ? 'Mark In Progress' : 'Mark as Fixed'}
            </button>
          )}
          {status === 'fixed' && (
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
