/**
 * RoomDetailSheet — 3-Tab Bottom Drawer
 *
 * Tabs: Specs | Items | Snags
 *
 * - Specs: flooring, wall finish, paint, ceiling — each with doc/snag badge
 * - Items: furniture & fittings with warranty badge, invoice badge, snag count,
 *          expandable service history timeline
 * - Snags: snags filtered to this room with status badges
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  X, Layers, Paintbrush, Sofa, Ruler, Sparkles, Wrench, Calendar,
  FileText, AlertTriangle, ChevronDown, ChevronUp, Clock, CheckCircle2,
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FloorPlanRoom } from '@/lib/firestore'
import type { RoomSpec, ItemLink, ServiceEvent } from '@/lib/demo-data'
import {
  DEMO_WARRANTY_ASSETS, DEMO_SNAGS, DEMO_ITEM_LINKS,
  DEMO_VAULT_DOCS,
} from '@/lib/demo-data'
import { getWarrantyStatus } from '@/lib/utils'

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

const SERVICE_TYPE_ICON: Record<string, string> = {
  'Installation': '🔌',
  'Annual Service': '🔧',
  'Repair': '🛠️',
  'Inspection': '🔍',
  'Cleaning': '🧹',
}

const SNAG_STATUS_COLOR = {
  open: 'text-red-400 bg-red-500/10 border-red-500/30',
  'in-progress': 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  fixed: 'text-green-400 bg-green-500/10 border-green-500/30',
}

const SNAG_STATUS_DOT = {
  open: 'bg-red-500',
  'in-progress': 'bg-amber-500',
  fixed: 'bg-green-500',
}

type Tab = 'specs' | 'items' | 'snags'

// ─── Sub-components ───────────────────────────────────────────────────────────

function WarrantyBadge({ warrantyId }: { warrantyId: string }) {
  const asset = DEMO_WARRANTY_ASSETS.find(a => a.id === warrantyId)
  if (!asset) return null
  const status = getWarrantyStatus(asset.warrantyExpiry)
  const daysLeft = Math.round(
    (new Date(asset.warrantyExpiry).getTime() - Date.now()) / 86_400_000
  )
  const color =
    status === 'expired'  ? 'text-red-400 bg-red-500/10 border-red-500/25' :
    status === 'expiring' ? 'text-amber-400 bg-amber-500/10 border-amber-500/25' :
                            'text-green-400 bg-green-500/10 border-green-500/25'
  const label =
    status === 'expired'  ? 'Expired' :
    status === 'expiring' ? `${daysLeft}d left` :
                            `${daysLeft}d`
  return (
    <Link
      href={`/warranty/${warrantyId}`}
      className={cn('flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md border', color)}
      onClick={(e) => e.stopPropagation()}
    >
      🛡️ {label}
    </Link>
  )
}

function DocBadge({ docId, onPreview }: { docId: string; onPreview: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onPreview() }}
      className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md border text-gold-400 bg-gold-500/10 border-gold-500/25"
    >
      🧾 Doc
    </button>
  )
}

function SnagBadge({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md border text-red-400 bg-red-500/10 border-red-500/25">
      🔴 {count} snag{count > 1 ? 's' : ''}
    </span>
  )
}

function ServiceTimeline({ events }: { events: ServiceEvent[] }) {
  return (
    <div className="mt-2 ml-2 pl-3 border-l border-vault-border space-y-3.5">
      {[...events].reverse().map((ev, i) => (
        <div key={i} className="relative">
          {/* Timeline dot */}
          <div className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-vault-muted border border-vault-border flex items-center justify-center">
            <span className="text-[6px]">{SERVICE_TYPE_ICON[ev.type] ?? '•'}</span>
          </div>

          {/* Event header */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold text-vault-text">{ev.type}</span>
            {ev.cost !== undefined && ev.cost > 0 && (
              <span className="text-[9px] font-semibold text-vault-text-muted">₹{ev.cost.toLocaleString()}</span>
            )}
            {ev.cost === 0 && (
              <span className="text-[9px] font-bold text-green-500">Free / Warranty</span>
            )}
            {ev.invoiceRef && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-gold-500/10 border border-gold-500/20 text-gold-400 font-mono">
                #{ev.invoiceRef}
              </span>
            )}
          </div>

          {/* Date + Technician */}
          <p className="text-[9px] text-vault-text-muted mt-0.5">
            {new Date(ev.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            {' · '}<span className="font-semibold text-vault-text">{ev.tech}</span>
          </p>

          {/* Contact */}
          {ev.contact && (
            <p className="text-[9px] text-blue-400 mt-0.5 font-medium">{ev.contact}</p>
          )}

          {/* Description */}
          <p className="text-[10px] text-vault-text mt-1 leading-relaxed">{ev.notes}</p>
        </div>
      ))}
    </div>
  )
}


// ─── Tab: Specs ───────────────────────────────────────────────────────────────

function SpecsTab({
  spec,
  onDocPreview,
}: {
  spec: RoomSpec
  onDocPreview: (docId: string) => void
}) {
  const specRows = [
    { icon: Layers,      label: 'Flooring',     value: spec.flooring,   key: spec.flooring,   accent: 'text-amber-400' },
    { icon: Paintbrush,  label: 'Wall Finish',   value: spec.wallFinish, key: spec.wallFinish, accent: 'text-blue-400'  },
    { icon: Sparkles,    label: 'Paint Colour',  value: spec.paintColor, key: spec.paintColor, accent: 'text-pink-400'  },
    { icon: Layers,      label: 'Ceiling',       value: spec.ceiling,    key: spec.ceiling,    accent: 'text-purple-400'},
  ]
  return (
    <div className="py-2">
      <div className="card p-2 mb-3">
        {specRows.map(({ icon: Icon, label, value, key, accent }) => {
          const link = DEMO_ITEM_LINKS[key]
          return (
            <div key={label} className="flex items-start gap-3 py-2.5 border-b border-vault-border/50 last:border-0">
              <div className="w-7 h-7 rounded-lg bg-vault-muted/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon size={13} className={accent} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-bold text-vault-text-muted uppercase tracking-widest mb-0.5">{label}</p>
                <p className="text-xs font-medium text-vault-text leading-snug">{value}</p>
                {link && (
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    {link.vaultDocId && <DocBadge docId={link.vaultDocId} onPreview={() => onDocPreview(link.vaultDocId!)} />}
                    {link.snagIds && link.snagIds.length > 0 && <SnagBadge count={link.snagIds.length} />}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Extras */}
      {spec.extras && spec.extras.length > 0 && (
        <>
          <p className="text-[10px] font-bold text-vault-text-muted uppercase tracking-widest mb-2">Additional Installations</p>
          <div className="space-y-1.5">
            {spec.extras.map((item, i) => {
              const link = DEMO_ITEM_LINKS[item]
              return (
                <div key={i} className="p-2.5 rounded-xl bg-gold-500/5 border border-gold-500/20">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Sparkles size={11} className="text-gold-500 flex-shrink-0" />
                    <span className="text-xs font-semibold text-gold-400 flex-1">{item}</span>
                    {link?.warrantyId && <WarrantyBadge warrantyId={link.warrantyId} />}
                    {link?.vaultDocId && <DocBadge docId={link.vaultDocId} onPreview={() => onDocPreview(link.vaultDocId!)} />}
                    {link?.snagIds && link.snagIds.length > 0 && <SnagBadge count={link.snagIds.length} />}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Tab: Items ───────────────────────────────────────────────────────────────

function ItemsTab({
  spec,
  accent,
  onDocPreview,
}: {
  spec: RoomSpec
  accent: string
  onDocPreview: (docId: string) => void
}) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  function toggle(i: number) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  return (
    <div className="py-2 space-y-2">
      {spec.furniture.map((item, i) => {
        const link = DEMO_ITEM_LINKS[item]
        const hasHistory = (link?.serviceHistory?.length ?? 0) > 0
        const isOpen = expanded.has(i)
        const snagCount = link?.snagIds?.length ?? 0

        return (
          <div
            key={i}
            className="rounded-xl bg-vault-card/60 border border-vault-border overflow-hidden"
          >
            <button
              className="w-full flex items-center gap-2.5 p-3 text-left"
              onClick={() => hasHistory && toggle(i)}
            >
              <Sofa size={13} className={cn('flex-shrink-0', accent)} />
              <span className="text-xs font-medium text-vault-text flex-1 leading-snug">{item}</span>

              {/* Badges */}
              <div className="flex items-center gap-1 flex-shrink-0 flex-wrap justify-end">
                {link?.warrantyId && <WarrantyBadge warrantyId={link.warrantyId} />}
                {link?.vaultDocId && <DocBadge docId={link.vaultDocId} onPreview={() => onDocPreview(link.vaultDocId!)} />}
                {snagCount > 0 && <SnagBadge count={snagCount} />}
                {hasHistory && (
                  isOpen
                    ? <ChevronUp size={13} className="text-vault-text-muted ml-0.5" />
                    : <ChevronDown size={13} className="text-vault-text-muted ml-0.5" />
                )}
              </div>
            </button>

            {/* Service history timeline (on expand) */}
            {hasHistory && isOpen && (
              <div className="px-3 pb-3 border-t border-vault-border/50 pt-2">
                <p className="text-[9px] font-bold text-vault-text-muted uppercase tracking-widest mb-2">
                  Service History
                </p>
                <ServiceTimeline events={link!.serviceHistory!} />
              </div>
            )}

            {/* Non-expandable hint */}
            {!hasHistory && link && (
              <div className="px-3 pb-2">
                <p className="text-[9px] text-vault-text-muted italic">No service records yet</p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Tab: Snags ───────────────────────────────────────────────────────────────

function SnagsTab({ roomName }: { roomName: string }) {
  const roomSnags = DEMO_SNAGS.filter(s => s.location === roomName)

  if (roomSnags.length === 0) {
    return (
      <div className="py-8 text-center">
        <CheckCircle2 size={32} className="text-green-500/40 mx-auto mb-2" />
        <p className="text-sm font-semibold text-vault-text-muted">No open snags</p>
        <p className="text-xs text-vault-text-muted mt-1">This room is defect-free ✓</p>
      </div>
    )
  }

  return (
    <div className="py-2 space-y-2">
      {roomSnags.map(snag => (
        <Link
          key={snag.id}
          href={`/snags/${snag.id}`}
          className="block p-3 rounded-xl bg-vault-card/60 border border-vault-border hover:border-red-500/30 transition-all"
        >
          <div className="flex items-start gap-2.5">
            <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', SNAG_STATUS_DOT[snag.status])} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-vault-text leading-snug">{snag.title}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-[9px] text-vault-text-muted">{snag.category}</span>
                <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded border capitalize', SNAG_STATUS_COLOR[snag.status])}>
                  {snag.status}
                </span>
                <span className={cn(
                  'text-[9px] font-bold px-1.5 py-0.5 rounded border capitalize',
                  snag.urgency === 'high'   ? 'text-red-400 bg-red-500/10 border-red-500/25' :
                  snag.urgency === 'medium' ? 'text-amber-400 bg-amber-500/10 border-amber-500/25' :
                                              'text-vault-text-muted bg-vault-muted/20 border-vault-border'
                )}>
                  {snag.urgency}
                </span>
              </div>
            </div>
            <ExternalLink size={12} className="text-vault-text-muted mt-0.5 flex-shrink-0" />
          </div>
        </Link>
      ))}
    </div>
  )
}

// ─── Doc Preview (inline mini-sheet) ─────────────────────────────────────────

function InlineDocPreview({ docId, onClose }: { docId: string | null; onClose: () => void }) {
  if (!docId) return null
  const allDocs = Object.values(DEMO_VAULT_DOCS).flat()
  const doc = allDocs.find(d => d.id === docId)
  if (!doc) return null

  return (
    <div className="mt-3 p-3 rounded-2xl bg-vault-bg border border-gold-500/20">
      <div className="flex items-center gap-2 mb-2">
        <FileText size={14} className="text-red-400 flex-shrink-0" />
        <p className="text-xs font-bold text-vault-text flex-1 truncate">{doc.name}</p>
        <button onClick={onClose} className="text-vault-text-muted">
          <X size={14} />
        </button>
      </div>
      <p className="text-[10px] text-vault-text-muted leading-snug mb-2">{doc.notes}</p>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[9px] text-vault-text-muted">{(doc.size / 1_048_576).toFixed(1)} MB · PDF</span>
        {doc.ocr && <span className="text-[9px] font-bold text-gold-500 bg-gold-500/10 px-1.5 py-0.5 rounded">OCR ✓</span>}
        <Link href="/vault" className="text-[9px] font-bold text-gold-500 ml-auto flex items-center gap-0.5">
          Open in Vault <ExternalLink size={9} />
        </Link>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  room: FloorPlanRoom | null
  spec: RoomSpec | null
  warrantyCount?: number
  onClose: () => void
}

export function RoomDetailSheet({ room, spec, warrantyCount = 0, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('specs')
  const [previewDocId, setPreviewDocId] = useState<string | null>(null)
  const isOpen = !!room && !!spec

  if (!isOpen) return null

  const icon = ROOM_ICONS[room.name] ?? '🏠'
  const accent = ROOM_ACCENT[room.name] ?? 'text-gold-500'

  // Count snags for tab badge
  const snagCount = DEMO_SNAGS.filter(s => s.location === room.name).length

  // Count items with service history for badge
  const historyCount = spec.furniture.filter(f => DEMO_ITEM_LINKS[f]?.serviceHistory?.length).length

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: 'specs', label: 'Specs' },
    { id: 'items', label: 'Items', badge: historyCount > 0 ? historyCount : undefined },
    { id: 'snags', label: 'Snags', badge: snagCount > 0 ? snagCount : undefined },
  ]

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" onClick={onClose} />

      {/* Sheet */}
      <div
        className="fixed inset-x-0 bottom-0 z-[60] rounded-t-3xl bg-vault-surface border-t border-vault-border max-h-[85vh] flex flex-col shadow-2xl pb-safe"
        style={{ animation: 'slideUp 0.28s cubic-bezier(0.32,0.72,0,1) forwards' }}
      >
        {/* Handle */}
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
                <Ruler size={10} /> {spec.area.toLocaleString()} sq ft
              </span>
              {warrantyCount > 0 && (
                <span className="text-xs text-gold-500 font-semibold">🛡️ {warrantyCount} assets</span>
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

        {/* Tab bar */}
        <div className="flex border-b border-vault-border px-5 gap-1 bg-vault-surface">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setPreviewDocId(null) }}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all',
                activeTab === tab.id
                  ? 'border-gold-500 text-gold-500'
                  : 'border-transparent text-vault-text-muted hover:text-vault-text'
              )}
            >
              {tab.label}
              {tab.badge && (
                <span className={cn(
                  'text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center',
                  tab.id === 'snags' ? 'bg-red-500 text-white' : 'bg-gold-500/20 text-gold-500'
                )}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-5">
          {/* Inline doc preview (visible across all tabs) */}
          {previewDocId && (
            <InlineDocPreview docId={previewDocId} onClose={() => setPreviewDocId(null)} />
          )}

          {activeTab === 'specs' && (
            <SpecsTab spec={spec} onDocPreview={setPreviewDocId} />
          )}
          {activeTab === 'items' && (
            <ItemsTab spec={spec} accent={accent} onDocPreview={setPreviewDocId} />
          )}
          {activeTab === 'snags' && (
            <SnagsTab roomName={room.name} />
          )}

          {/* Bottom spacer */}
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
