/**
 * RoomDetailSheet
 *
 * A premium bottom-drawer panel that appears when the user taps a room
 * in the Home Twin SVG minimap. Shows room finishing specs: flooring, walls,
 * ceiling, paint, furniture list, extras.
 */

'use client'

import { useEffect, useRef } from 'react'
import { X, Layers, Paintbrush, Sofa, Ruler, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FloorPlanRoom } from '@/lib/firestore'
import type { RoomSpec } from '@/lib/demo-data'

const ROOM_ICONS: Record<string, string> = {
  'Living Room':    '🛋️',
  'Kitchen':        '🍳',
  'Master Bedroom': '🛏️',
  'Bedroom 2':      '🛏️',
  'Bedroom 3':      '🛏️',
  'Bathroom':       '🚿',
  'Balcony':        '🌿',
  'Study':          '💻',
  'Dining Room':    '🍽️',
}

const ROOM_ACCENT: Record<string, string> = {
  'Living Room':    'text-blue-400',
  'Kitchen':        'text-amber-400',
  'Master Bedroom': 'text-purple-400',
  'Bedroom 2':      'text-pink-400',
  'Bedroom 3':      'text-orange-400',
  'Bathroom':       'text-teal-400',
  'Balcony':        'text-green-400',
  'Study':          'text-orange-400',
  'Dining Room':    'text-red-400',
}

interface Props {
  room: FloorPlanRoom | null
  spec: RoomSpec | null
  warrantyCount?: number
  onClose: () => void
}

function SpecRow({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType
  label: string
  value: string
  accent?: string
}) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-vault-border/50 last:border-0">
      <div className="w-7 h-7 rounded-lg bg-vault-muted/30 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon size={13} className={accent ?? 'text-vault-text-muted'} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[9px] font-bold text-vault-text-muted uppercase tracking-widest mb-0.5">{label}</p>
        <p className="text-xs font-medium text-vault-text leading-snug">{value}</p>
      </div>
    </div>
  )
}

export function RoomDetailSheet({ room, spec, warrantyCount = 0, onClose }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const isOpen = !!room && !!spec

  // Prevent body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  const icon = ROOM_ICONS[room.name] ?? '🏠'
  const accent = ROOM_ACCENT[room.name] ?? 'text-gold-500'

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-vault-surface border-t border-vault-border max-h-[80vh] flex flex-col shadow-2xl"
        style={{ animation: 'slideUp 0.28s cubic-bezier(0.32,0.72,0,1) forwards' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-vault-muted rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 pb-3 pt-1 flex items-center gap-3 border-b border-vault-border">
          <div className="w-12 h-12 rounded-2xl bg-vault-muted/30 flex items-center justify-center text-2xl flex-shrink-0">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className={cn('text-lg font-bold', accent)}>{room.name}</h2>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-xs text-vault-text-muted flex items-center gap-1">
                <Ruler size={10} />
                {spec.area.toLocaleString()} sq ft
              </span>
              {warrantyCount > 0 && (
                <span className="text-xs text-gold-500 font-semibold flex items-center gap-1">
                  🛡️ {warrantyCount} {warrantyCount === 1 ? 'asset' : 'assets'}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-vault-muted/30 flex items-center justify-center hover:bg-vault-muted/50 transition-all"
          >
            <X size={16} className="text-vault-text-muted" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 pb-safe-area-inset-bottom">

          {/* Finishing specs */}
          <div className="mt-4 mb-2">
            <p className="text-[10px] font-bold text-vault-text-muted uppercase tracking-widest mb-1">Finishing Specs</p>
            <div className="card p-2">
              <SpecRow icon={Layers} label="Flooring" value={spec.flooring} accent="text-amber-400" />
              <SpecRow icon={Paintbrush} label="Wall Finish" value={spec.wallFinish} accent="text-blue-400" />
              <SpecRow icon={Sparkles} label="Paint Colour" value={spec.paintColor} accent="text-pink-400" />
              <SpecRow icon={Layers} label="Ceiling" value={spec.ceiling} accent="text-purple-400" />
            </div>
          </div>

          {/* Furniture */}
          <div className="mt-4 mb-2">
            <p className="text-[10px] font-bold text-vault-text-muted uppercase tracking-widest mb-2">
              Furniture & Fittings
            </p>
            <div className="space-y-1.5">
              {spec.furniture.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-vault-card/60 border border-vault-border"
                >
                  <Sofa size={12} className={accent} />
                  <span className="text-xs font-medium text-vault-text">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Extras */}
          {spec.extras && spec.extras.length > 0 && (
            <div className="mt-3 mb-6">
              <p className="text-[10px] font-bold text-vault-text-muted uppercase tracking-widest mb-2">
                Additional Installations
              </p>
              <div className="space-y-1.5">
                {spec.extras.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gold-500/5 border border-gold-500/20"
                  >
                    <Sparkles size={12} className="text-gold-500" />
                    <span className="text-xs font-semibold text-gold-400">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom spacer for nav bar */}
          <div className="h-24" />
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
      `}</style>
    </>
  )
}
