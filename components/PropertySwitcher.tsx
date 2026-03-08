'use client'

import { useRouter } from 'next/navigation'
import { Check, Plus, X, Building2 } from 'lucide-react'
import { useProperty } from '@/lib/useProperty'
import { cn } from '@/lib/utils'

interface PropertySwitcherProps {
  onClose: () => void
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
                <Building2 size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No properties yet</p>
              </div>
            )}
            {allProperties.map((p) => {
              const isActive = p.id === activePropertyId
              return (
                <button
                  key={p.id}
                  onClick={() => { switchProperty(p.id); onClose() }}
                  className={cn(
                    'w-full p-4 rounded-2xl flex items-center gap-3 transition-all text-left',
                    isActive ? 'glass-gold gold-border' : 'card hover:border-gold-500/20'
                  )}
                >
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                    isActive ? 'bg-gold-500/20 border border-gold-500/40' : 'bg-vault-muted/20'
                  )}>
                    <Building2 size={18} className={isActive ? 'text-gold-500' : 'text-vault-text-muted'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-bold truncate', isActive ? 'text-gold-500' : 'text-white')}>
                      {p.name}
                    </p>
                    <p className="text-xs text-vault-text-muted mt-0.5 truncate">
                      {[p.unit, p.floorPlanType, p.location].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  {isActive && <Check size={16} className="text-gold-500 flex-shrink-0" />}
                </button>
              )
            })}
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
