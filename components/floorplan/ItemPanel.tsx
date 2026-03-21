'use client'

import { useState } from 'react'
import { X, RotateCcw, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type HomePlanItem } from '@/lib/firestore'
import { FURNITURE_COLORS } from '@/lib/furniture-catalogue'

interface ItemPanelProps {
  item: HomePlanItem
  onUpdate: (updated: HomePlanItem) => void
  onDelete: (id: string) => void
  onClose: () => void
}

const STYLES: Array<{ value: HomePlanItem['style']; label: string; desc: string }> = [
  { value: 'minimal', label: 'Minimal', desc: 'Rounded soft edges' },
  { value: 'modern',  label: 'Modern',  desc: 'Clean sharp corners' },
  { value: 'classic', label: 'Classic', desc: 'Bold square form' },
]

export function ItemPanel({ item, onUpdate, onDelete, onClose }: ItemPanelProps) {
  const [label, setLabel] = useState(item.label ?? item.type)

  const update = (patch: Partial<HomePlanItem>) => onUpdate({ ...item, ...patch })

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-vault-surface border-t border-vault-border rounded-t-3xl p-5 pb-8 space-y-4 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-vault-text-muted uppercase tracking-widest font-semibold">Item</p>
          <h3 className="text-base font-bold text-white">{item.label ?? item.type}</h3>
          <p className="text-xs text-vault-text-muted">{item.roomName}</p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-xl glass flex items-center justify-center"
        >
          <X size={16} className="text-vault-text-muted" />
        </button>
      </div>

      {/* Label */}
      <div>
        <label className="text-xs font-semibold text-vault-text-muted uppercase tracking-widest mb-1.5 block">
          Custom Label
        </label>
        <input
          value={label}
          onChange={(e) => { setLabel(e.target.value); update({ label: e.target.value }) }}
          className="w-full px-3 py-2.5 text-sm rounded-xl bg-vault-muted border border-vault-border text-white placeholder:text-vault-text-muted focus:outline-none focus:border-gold-500/60"
          placeholder="e.g. My Blue Sofa"
        />
      </div>

      {/* Color picker */}
      <div>
        <label className="text-xs font-semibold text-vault-text-muted uppercase tracking-widest mb-2 block">
          Color
        </label>
        <div className="flex items-center gap-2 flex-wrap">
          {FURNITURE_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => update({ color: c })}
              style={{ backgroundColor: c }}
              className={cn(
                'w-8 h-8 rounded-xl transition-all',
                item.color === c ? 'ring-2 ring-gold-500 ring-offset-1 ring-offset-vault-surface scale-110' : 'opacity-80 hover:opacity-100'
              )}
            />
          ))}
          {/* Custom colour input */}
          <label className="w-8 h-8 rounded-xl border border-dashed border-vault-border flex items-center justify-center cursor-pointer hover:border-gold-500/60 transition-colors">
            <input
              type="color"
              className="sr-only"
              value={item.color}
              onChange={(e) => update({ color: e.target.value })}
            />
            <span className="text-[10px] text-vault-text-muted">+</span>
          </label>
        </div>
      </div>

      {/* Style */}
      <div>
        <label className="text-xs font-semibold text-vault-text-muted uppercase tracking-widest mb-2 block">
          Style
        </label>
        <div className="flex gap-2">
          {STYLES.map((s) => (
            <button
              key={s.value}
              onClick={() => update({ style: s.value })}
              className={cn(
                'flex-1 py-2.5 px-2 rounded-xl text-xs font-semibold border transition-all text-center',
                item.style === s.value
                  ? 'bg-gold-500/10 border-gold-500/60 text-gold-500'
                  : 'card border-vault-border text-vault-text hover:border-gold-500/30'
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => { update({ color: '#4a6fa5', style: 'modern', label: item.type }) }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl card border-vault-border text-xs text-vault-text-muted"
        >
          <RotateCcw size={12} /> Reset
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400"
        >
          <Trash2 size={12} /> Remove
        </button>
      </div>
    </div>
  )
}
