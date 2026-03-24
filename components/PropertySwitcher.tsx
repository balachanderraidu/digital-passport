'use client'

import { useRouter } from 'next/navigation'
import { Check, Plus, X, ShieldCheck, Hammer, FolderLock } from 'lucide-react'
import { useProperty } from '@/lib/useProperty'
import { cn } from '@/lib/utils'
import type { Property } from '@/lib/firestore'
import { DEMO_DATA_CATALOG } from '@/lib/demo-data'

interface PropertySwitcherProps {
  onClose: () => void
}

const OCCUPANCY_META: Record<string, { label: string; emoji: string; color: string }> = {
  residing:   { label: 'Residing',     emoji: '🏠', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  rented:     { label: 'Rented Out',   emoji: '🔑', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  renovation: { label: 'Construction', emoji: '🏗️', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  empty:      { label: 'Bare Shell',   emoji: '🪟', color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' },
}

// Per-property quick stats from the DEMO_DATA_CATALOG
const DEMO_STATS: Record<string, { assets: number; snags: number; docs: number; context: string }> = {
  p_villa:        { assets: 10, snags: 5,  docs: 11, context: '5BHK · G+2 Villa' },
  p_rental:       { assets: 4,  snags: 3,  docs: 6,  context: '2BHK · Rented Out' },
  p_empty:        { assets: 0,  snags: 0,  docs: 4,  context: '3BHK · Bare Shell' },
  p_construction: { assets: 0,  snags: 6,  docs: 5,  context: '3BHK · Under Construction' },
}

function OccupancyBadge({ occupancy }: { occupancy?: string }) {
  const meta = occupancy ? OCCUPANCY_META[occupancy] : null
  if (!meta) return null
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border',
      meta.color
    )}>
      {meta.emoji} {meta.label}
    </span>
  )
}

function PropertyCard({ p, isActive, onSelect }: { p: Property; isActive: boolean; onSelect: () => void }) {
  const stats = DEMO_STATS[p.id]

  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full rounded-2xl flex items-center gap-3 transition-all text-left overflow-hidden',
        isActive ? 'glass-gold gold-border' : 'card hover:border-gold-500/20'
      )}
    >
      {/* Hero thumbnail */}
      {p.heroImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={p.heroImageUrl}
          alt={p.name}
          className="w-20 h-16 object-cover flex-shrink-0 rounded-l-2xl"
        />
      ) : (
        <div className={cn(
          'w-20 h-16 flex-shrink-0 flex items-center justify-center rounded-l-2xl text-2xl',
          isActive ? 'bg-gold-500/20' : 'bg-vault-muted/20'
        )}>
          {OCCUPANCY_META[p.occupancy ?? '']?.emoji ?? '🏢'}
        </div>
      )}

      <div className="flex-1 min-w-0 py-2 pr-3">
        <div className="flex items-center gap-2 mb-0.5">
          <p className={cn('text-sm font-bold truncate', isActive ? 'text-gold-500' : 'text-white')}>
            {p.name}
          </p>
          {isActive && <Check size={14} className="text-gold-500 flex-shrink-0" />}
        </div>
        <p className="text-[10px] text-vault-text-muted truncate mb-1.5">
          {stats?.context ?? [p.unit, p.location].filter(Boolean).join(' · ')}
        </p>
        <div className="flex items-center gap-1.5 flex-wrap">
          <OccupancyBadge occupancy={p.occupancy} />
          {stats && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-0.5 text-[9px] text-vault-text-muted">
                <ShieldCheck size={8} className="text-gold-500" /> {stats.assets}
              </span>
              {stats.snags > 0 && (
                <span className="inline-flex items-center gap-0.5 text-[9px] text-red-400 font-bold">
                  <Hammer size={8} /> {stats.snags}
                </span>
              )}
              <span className="inline-flex items-center gap-0.5 text-[9px] text-vault-text-muted">
                <FolderLock size={8} className="text-gold-500" /> {stats.docs}
              </span>
            </div>
          )}
        </div>
      </div>
    </button>
  )
}

export function PropertySwitcher({ onClose }: PropertySwitcherProps) {
  const { allProperties, activePropertyId, switchProperty } = useProperty()
  const router = useRouter()

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 animate-fade-in" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-vault-surface border-t border-vault-border animate-slide-up max-h-[80dvh] overflow-y-auto">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-vault-muted" />
        </div>
        <div className="px-6 pb-10">
          <div className="flex items-center justify-between mb-5 pt-3">
            <div>
              <h3 className="text-base font-bold text-white">Your Properties</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-vault-text-muted">
                  {allProperties.length} Passport{allProperties.length !== 1 ? 's' : ''}
                </p>
                <div className="flex items-center gap-1 text-[9px] text-vault-text-muted">
                  <ShieldCheck size={9} className="text-gold-500" /> Assets 
                  <Hammer size={9} className="text-red-400 ml-1" /> Snags
                  <FolderLock size={9} className="text-gold-500 ml-1" /> Docs
                </div>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl glass flex items-center justify-center">
              <X size={15} className="text-vault-text-muted" />
            </button>
          </div>

          <div className="space-y-2 mb-4">
            {allProperties.length === 0 && (
              <div className="text-center py-8 text-vault-text-muted">
                <span className="text-4xl block mb-2">🏢</span>
                <p className="text-sm">No properties yet</p>
              </div>
            )}
            {allProperties.map((p) => (
              <PropertyCard
                key={p.id}
                p={p}
                isActive={p.id === activePropertyId}
                onSelect={() => { switchProperty(p.id); onClose() }}
              />
            ))}
          </div>

          <button
            onClick={() => { onClose(); router.push('/onboarding?new=1') }}
            className="w-full py-3.5 rounded-2xl glass gold-border text-sm font-bold text-gold-500 flex items-center justify-center gap-2 hover:bg-gold-500/10 transition-colors"
          >
            <Plus size={16} /> Add New Property
          </button>
        </div>
      </div>
    </>
  )
}
