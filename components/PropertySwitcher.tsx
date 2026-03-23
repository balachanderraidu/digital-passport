'use client'

import { useRouter } from 'next/navigation'
import { Check, Plus, X } from 'lucide-react'
import { useProperty } from '@/lib/useProperty'
import { cn } from '@/lib/utils'
import type { Property } from '@/lib/firestore'

interface PropertySwitcherProps {
  onClose: () => void
}

const OCCUPANCY_META: Record<string, { label: string; emoji: string; color: string }> = {
  residing:   { label: 'Residing',     emoji: '🏠', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  rented:     { label: 'Rented Out',   emoji: '🔑', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  renovation: { label: 'Construction', emoji: '🏗️', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  empty:      { label: 'Bare Shell',   emoji: '🪟', color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' },
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
        <p className="text-xs text-vault-text-muted truncate mb-1">
          {[p.unit, p.location].filter(Boolean).join(' · ')}
        </p>
        <div className="flex items-center gap-1.5 flex-wrap">
          <OccupancyBadge occupancy={p.occupancy} />
          <span className="text-[10px] text-vault-text-muted">
            {p.floorPlanType} · {(p.area ?? 0).toLocaleString()} sq ft
          </span>
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
              <p className="text-xs text-vault-text-muted mt-0.5">
                {allProperties.length} Passport{allProperties.length !== 1 ? 's' : ''}
              </p>
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
