'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Calendar, ShieldCheck, ShieldAlert, ShieldOff,
  Zap, Info, Bell, Phone, FileText, Trash2, Loader2,
} from 'lucide-react'
import { cn, formatDate, getWarrantyStatus, getDaysUntil } from '@/lib/utils'
import { useAuth } from '@/lib/useAuth'
import { useProperty } from '@/lib/useProperty'
import { subscribeWarrantyAssets, deleteWarrantyAsset, type WarrantyAsset } from '@/lib/firestore'
import { DEMO_WARRANTY_ASSETS, DEMO_ITEM_LINKS } from '@/lib/demo-data'

export default function WarrantyDetailClient({ id }: { id: string }) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { activePropertyId } = useProperty()
  const [asset, setAsset] = useState<WarrantyAsset | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const isDemo = !authLoading && !user

  // Demo mode
  useEffect(() => {
    if (!isDemo) return
    const found = DEMO_WARRANTY_ASSETS.find((a) => a.id === id) ?? null
    setAsset(found)
    setLoading(false)
  }, [isDemo, id])

  // Real user
  useEffect(() => {
    if (!user) return
    setLoading(true)
    const unsub = subscribeWarrantyAssets(user.uid, (assets) => {
      const found = assets.find((a) => a.id === id) ?? null
      setAsset(found)
      setLoading(false)
    }, activePropertyId)
    return unsub
  }, [user, id, activePropertyId])

  async function handleDelete() {
    if (!user || !asset) return
    setDeleting(true)
    try {
      await deleteWarrantyAsset(user.uid, asset.id, activePropertyId)
      router.replace('/warranty')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-dvh bg-vault-bg flex items-center justify-center">
        <Loader2 size={28} className="text-gold-500 animate-spin" />
      </div>
    )
  }

  if (!asset) {
    return (
      <div className="min-h-dvh bg-vault-bg flex flex-col items-center justify-center gap-4 px-6 text-center">
        <ShieldOff size={40} className="text-vault-text-muted opacity-40" />
        <p className="text-base font-bold text-white">Asset not found</p>
        <p className="text-sm text-vault-text-muted">This warranty record may have been deleted.</p>
        <button onClick={() => router.replace('/warranty')} className="mt-2 text-sm font-semibold text-gold-500">
          ← Back to Warranty Center
        </button>
      </div>
    )
  }

  const status = getWarrantyStatus(asset.warrantyExpiry)
  const daysLeft = getDaysUntil(asset.warrantyExpiry)

  const statusIcon = {
    active: <ShieldCheck size={16} className="text-green-400" />,
    expiring: <ShieldAlert size={16} className="text-yellow-400" />,
    expired: <ShieldOff size={16} className="text-red-400" />,
  }[status]

  const statusBadge = {
    active: 'bg-green-500/10 text-green-400 border border-green-500/30',
    expiring: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30',
    expired: 'bg-red-500/10 text-red-400 border border-red-500/30',
  }[status]

  const statusLabel = { active: 'Warranty Active', expiring: 'Expiring Soon', expired: 'Warranty Expired' }[status]

  return (
    <div className="min-h-dvh bg-vault-bg">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 bg-gradient-to-b from-vault-surface to-vault-bg">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="w-9 h-9 rounded-xl glass flex items-center justify-center flex-shrink-0">
              <ArrowLeft size={18} className="text-vault-text-muted" />
            </button>
            <h1 className="text-lg font-bold text-white">Asset Detail</h1>
          </div>
          {!isDemo && (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center hover:bg-red-500/20 transition-all"
            >
              <Trash2 size={15} className="text-red-400" />
            </button>
          )}
        </div>

        {/* Hero Image */}
        {asset.photoUrl && (
          <div className="w-full aspect-[16/9] rounded-2xl overflow-hidden mb-5 border border-vault-border shadow-2xl relative group">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10 pointer-events-none" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={asset.photoUrl} 
              alt={asset.name} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>
        )}

        {/* Asset card */}
        <div className="card p-4 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl glass-gold gold-border flex items-center justify-center text-3xl flex-shrink-0">
            {asset.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-white leading-tight">{asset.name}</h2>
            <p className="text-sm text-vault-text-muted">{asset.brand} · {asset.zone}</p>
            <span className={cn('inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full mt-2', statusBadge)}>
              {statusIcon}
              {statusLabel}
              {status !== 'expired' && daysLeft > 0 && ` · ${daysLeft}d left`}
            </span>
          </div>
        </div>
      </div>

      <div className="px-5 pb-28">
        {/* Info rows */}
        <div className="space-y-2 mb-5">
          {[
            { icon: <Calendar size={16} className="text-gold-500" />, label: 'Purchase Date', value: formatDate(asset.purchaseDate) },
            {
              icon: statusIcon,
              label: 'Warranty Expiry',
              value: <span className="flex items-center gap-2">
                {formatDate(asset.warrantyExpiry)}
                <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full', statusBadge)}>{statusLabel}</span>
              </span>,
            },
            ...(asset.model ? [{ icon: <Info size={16} className="text-vault-text-muted" />, label: 'Model', value: asset.model }] : []),
            ...(asset.serialNumber ? [{ icon: <Info size={16} className="text-vault-text-muted" />, label: 'Serial No.', value: asset.serialNumber }] : []),
            ...(asset.nextService ? [{ icon: <Calendar size={16} className="text-blue-400" />, label: 'Next Service', value: <span className="text-blue-400">{formatDate(asset.nextService)}</span> }] : []),
          ].map(({ icon, label, value }) => (
            <div key={label} className="flex items-start gap-3 p-3.5 rounded-xl bg-vault-card/50 border border-vault-border">
              <div className="mt-0.5 flex-shrink-0">{icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-vault-text-muted uppercase tracking-widest mb-0.5">{label}</p>
                <div className="text-sm font-semibold text-vault-text">{value}</div>
              </div>
            </div>
          ))}

          {/* Invoice */}
          {asset.invoiceUrl && (
            <a href={asset.invoiceUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 p-3.5 rounded-xl bg-gold-500/5 border border-gold-500/20 hover:bg-gold-500/10 transition-all">
              <FileText size={16} className="text-gold-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-[10px] font-semibold text-vault-text-muted uppercase tracking-widest mb-0.5">Invoice</p>
                <p className="text-sm font-bold text-gold-500">View Invoice ↗</p>
              </div>
            </a>
          )}
        </div>

        {/* CTA buttons */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gold-gradient text-charcoal-300 font-bold text-sm hover:shadow-gold-glow transition-all">
            <Bell size={16} />
            Set Reminder
          </button>
          <button className="flex items-center justify-center gap-2 py-3.5 rounded-2xl glass gold-border text-vault-text font-semibold text-sm hover:gold-border-active transition-all">
            <Phone size={16} className="text-gold-500" />
            Book Service
          </button>
        </div>

        {/* Service History — from DEMO_ITEM_LINKS keyed by asset name */}
        {(() => {
          const itemKey = Object.keys(DEMO_ITEM_LINKS).find(k =>
            asset.name.toLowerCase().includes(k.split(' ')[0].toLowerCase()) ||
            k.toLowerCase().includes(asset.name.split(' ')[0].toLowerCase())
          )
          const link = itemKey ? DEMO_ITEM_LINKS[itemKey] : null
          const history = link?.serviceHistory ?? []
          if (history.length === 0) return null
          const SERVICE_ICON: Record<string, string> = {
            'Installation': '🔌', 'Annual Service': '🔧', 'Repair': '🛠️', 'Inspection': '🔍', 'Cleaning': '🧹',
          }
          return (
            <div className="mb-6">
              <h3 className="text-xs font-bold text-white mb-3 uppercase tracking-widest">Service History</h3>
              <div className="ml-1 pl-3 border-l border-vault-border space-y-3.5">
                {[...history].reverse().map((ev, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-vault-muted border border-vault-border flex items-center justify-center">
                      <span className="text-[6px]">{SERVICE_ICON[ev.type] ?? '•'}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold text-vault-text">{ev.type}</span>
                      {ev.cost !== undefined && ev.cost > 0 && <span className="text-[9px] text-vault-text-muted">₹{ev.cost.toLocaleString()}</span>}
                      {ev.cost === 0 && <span className="text-[9px] font-bold text-green-500">Free / Warranty</span>}
                      {ev.invoiceRef && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-gold-500/10 border border-gold-500/20 text-gold-400 font-mono">#{ev.invoiceRef}</span>
                      )}
                    </div>
                    <p className="text-[9px] text-vault-text-muted mt-0.5">
                      {new Date(ev.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {' · '}<span className="font-semibold text-vault-text">{ev.tech}</span>
                    </p>
                    {ev.contact && <p className="text-[9px] text-blue-400 mt-0.5">{ev.contact}</p>}
                    <p className="text-[10px] text-vault-text mt-1 leading-relaxed">{ev.notes}</p>
                  </div>
                ))}
              </div>
            </div>
          )
        })()}
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
        <>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" onClick={() => setConfirmDelete(false)} />
          <div className="fixed inset-x-5 top-1/2 -translate-y-1/2 z-50 card p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <Trash2 size={18} className="text-red-400" />
              </div>
              <h3 className="text-base font-bold text-white">Delete Asset?</h3>
            </div>
            <p className="text-sm text-vault-text-muted mb-5">
              This will permanently remove <span className="font-semibold text-white">{asset.name}</span> and its warranty record.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 py-3 rounded-xl glass gold-border text-sm font-semibold text-vault-text">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 py-3 rounded-xl bg-red-500/80 text-sm font-bold text-white hover:bg-red-500 transition-colors flex items-center justify-center gap-2">
                {deleting ? <><Loader2 size={14} className="animate-spin" /> Deleting…</> : 'Delete'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
