/**
 * PropertyTimeline
 *
 * A vertical "life of the property" feed rendered on the dashboard.
 * Shows milestones: purchase, legal, renovation, installations, service visits, snags, warranties.
 * Events are grouped by year with a category colour-coded dot and optional badge.
 * The 5 most recent events show by default; an expand button shows all.
 */
'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TimelineEvent } from '@/lib/demo-data'

const CATEGORY_DOT: Record<string, string> = {
  purchase:     'bg-gold-500',
  legal:        'bg-blue-500',
  renovation:   'bg-amber-500',
  installation: 'bg-cyan-500',
  service:      'bg-violet-500',
  snag:         'bg-red-500',
  warranty:     'bg-emerald-500',
  document:     'bg-stone-400',
}

const CATEGORY_BG: Record<string, string> = {
  purchase:     'bg-gold-500/10 border-gold-500/25',
  legal:        'bg-blue-500/10 border-blue-500/25',
  renovation:   'bg-amber-500/10 border-amber-500/25',
  installation: 'bg-cyan-500/10 border-cyan-500/25',
  service:      'bg-violet-500/10 border-violet-500/25',
  snag:         'bg-red-500/10 border-red-500/25',
  warranty:     'bg-emerald-500/10 border-emerald-500/25',
  document:     'bg-vault-muted/20 border-vault-border',
}

// Fix #3: Clean lookup object instead of a fragile ternary chain
const BADGE_CLASS: Record<string, string> = {
  'text-gold-400':    'bg-gold-500/15 border-gold-500/30 text-gold-400',
  'text-amber-400':   'bg-amber-500/15 border-amber-500/30 text-amber-400',
  'text-red-400':     'bg-red-500/15 border-red-500/30 text-red-400',
  'text-emerald-400': 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
  'text-blue-400':    'bg-blue-500/15 border-blue-500/30 text-blue-400',
  'text-purple-400':  'bg-purple-500/15 border-purple-500/30 text-purple-400',
}
const BADGE_FALLBACK = 'bg-vault-muted/20 border-vault-border text-vault-text-muted'

// Fix #4/#13: Handle all vault ID prefixes (vd-, vdr-, vde-, vdc-)
function resolveLink(linkedId?: string): string | null {
  if (!linkedId) return null
  if (linkedId.startsWith('wa-')) return `/warranty/${linkedId}`
  if (linkedId.startsWith('sn-')) return `/snags/${linkedId}`
  if (
    linkedId.startsWith('vd-')  ||
    linkedId.startsWith('vdr-') ||
    linkedId.startsWith('vde-') ||
    linkedId.startsWith('vdc-')
  ) return '/vault'
  return null
}

interface Props {
  events: TimelineEvent[]
  defaultExpanded?: boolean
}

export function PropertyTimeline({ events, defaultExpanded = false }: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  // Fix #7: memoize sort so it doesn't run on every render
  const sorted = useMemo(
    () => [...events].sort((a, b) => b.date.localeCompare(a.date)),
    [events]
  )
  const visible = expanded ? sorted : sorted.slice(0, 5)

  // Group by year for the year dividers
  let lastYear = ''

  return (
    <div>
      <div className="space-y-0">
        {visible.map((ev, i) => {
          const year = ev.date.slice(0, 4)
          const showYear = year !== lastYear
          lastYear = year
          const href = resolveLink(ev.linkedId)
          const dot = CATEGORY_DOT[ev.category] ?? 'bg-vault-muted'
          const bg  = CATEGORY_BG[ev.category]  ?? 'bg-vault-muted/20 border-vault-border'

          return (
            <div key={ev.id}>
              {/* Year separator */}
              {showYear && (
                <div className="flex items-center gap-3 mb-2 mt-3 first:mt-0">
                  <span className="text-[10px] font-bold text-vault-text-muted uppercase tracking-widest">{year}</span>
                  <div className="flex-1 h-px bg-vault-border" />
                </div>
              )}

              {/* Event row */}
              <div className="flex gap-3 pb-3">
                {/* Timeline spine */}
                <div className="flex flex-col items-center gap-0 w-5 flex-shrink-0">
                  <div className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1', dot)} />
                  {i < visible.length - 1 && <div className="flex-1 w-px bg-vault-border mt-1" style={{ minHeight: 16 }} />}
                </div>

                {/* Card */}
                <div className={cn('flex-1 rounded-xl border px-3 py-2.5 mb-0.5', bg)}>
                  <div className="flex items-start gap-2">
                    <span className="text-base leading-none mt-0.5 flex-shrink-0">{ev.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-bold text-vault-text leading-tight">{ev.title}</p>
                        {ev.badge && (
                          <span className={cn(
                            'text-[8px] font-bold px-1.5 py-0.5 rounded-full border tracking-wide',
                            ev.badgeColor ? (BADGE_CLASS[ev.badgeColor] ?? BADGE_FALLBACK) : BADGE_FALLBACK
                          )}>
                            {ev.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-vault-text-muted mt-1 leading-relaxed">{ev.detail}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[9px] text-vault-text-muted">
                          {new Date(ev.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        {href && (
                          <Link href={href} className="text-[9px] font-bold text-gold-500 flex items-center gap-0.5 hover:underline">
                            View →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Expand / collapse */}
      {events.length > 5 && (
        <button
          onClick={() => setExpanded(v => !v)}
          className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-vault-text-muted hover:text-gold-500 transition-all"
        >
          {expanded ? <><ChevronUp size={14} /> Show less</> : <><ChevronDown size={14} /> Show all {events.length} events</>}
        </button>
      )}
    </div>
  )
}
