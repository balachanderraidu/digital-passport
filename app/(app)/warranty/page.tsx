'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ShieldCheck, ShieldAlert, ShieldOff, Plus, ChevronRight, Bell, FileText, X } from 'lucide-react'
import { cn, formatDate, getWarrantyStatus, getDaysUntil } from '@/lib/utils'

interface Asset {
  id: string
  name: string
  icon: string
  zone: string
  brand: string
  model: string
  purchaseDate: string
  warrantyExpiry: string
  invoiceLinked: boolean
  nextService: string | null
}

const DEMO_ASSETS: Asset[] = [
  { id: 'a1', name: 'Daikin 2.0T Inverter AC', icon: '❄️', zone: 'Living Area', brand: 'Daikin', model: 'FTKM60TV', purchaseDate: '2023-04-15', warrantyExpiry: '2028-04-15', invoiceLinked: true, nextService: '2026-10-01' },
  { id: 'a2', name: 'Sony Bravia 75" OLED', icon: '📺', zone: 'Living Area', brand: 'Sony', model: 'XR-75A95L', purchaseDate: '2023-05-10', warrantyExpiry: '2026-05-10', invoiceLinked: true, nextService: null },
  { id: 'a3', name: 'Elica 4-Burner Hob', icon: '🍳', zone: 'Kitchen', brand: 'Elica', model: 'EHB TF HC 4B DX', purchaseDate: '2023-03-12', warrantyExpiry: '2026-03-12', invoiceLinked: false, nextService: null },
  { id: 'a4', name: 'Modular Wardrobe — Master', icon: '🚪', zone: 'Master Bedroom', brand: 'Spacewood', model: 'Elite 8×10', purchaseDate: '2023-02-28', warrantyExpiry: '2033-02-28', invoiceLinked: true, nextService: null },
  { id: 'a5', name: 'Bosch Front Load Washer', icon: '🫧', zone: 'Utility', brand: 'Bosch', model: 'WAJ24268IN', purchaseDate: '2023-04-01', warrantyExpiry: '2028-04-01', invoiceLinked: true, nextService: '2026-04-01' },
  { id: 'a6', name: 'Crompton Ceiling Fan', icon: '🌀', zone: 'Bedroom', brand: 'Crompton', model: 'HS Plus 1200mm', purchaseDate: '2023-01-15', warrantyExpiry: '2025-01-15', invoiceLinked: false, nextService: null },
]

type FilterTab = 'all' | 'active' | 'expiring' | 'expired'

const STATUS_ICON = {
  active: <ShieldCheck size={16} className="text-green-400" />,
  expiring: <ShieldAlert size={16} className="text-yellow-400" />,
  expired: <ShieldOff size={16} className="text-red-400" />,
}

const STATUS_BADGE = {
  active: 'warranty-active',
  expiring: 'warranty-expiring',
  expired: 'warranty-expired',
}

const STATUS_LABEL = {
  active: 'Active',
  expiring: 'Expiring Soon',
  expired: 'Expired',
}

export default function WarrantyPage() {
  const [filter, setFilter] = useState<FilterTab>('all')
  const [showAddAsset, setShowAddAsset] = useState(false)

  const assetsWithStatus = DEMO_ASSETS.map(a => ({
    ...a,
    status: getWarrantyStatus(a.warrantyExpiry),
    daysLeft: getDaysUntil(a.warrantyExpiry),
  }))

  const expiringSoon = assetsWithStatus.filter(a => a.status === 'expiring').length

  const filtered = filter === 'all'
    ? assetsWithStatus
    : assetsWithStatus.filter(a => a.status === filter)

  const sorted = [...filtered].sort((a, b) => a.daysLeft - b.daysLeft)

  return (
    <div className="min-h-dvh bg-vault-bg">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 bg-gradient-to-b from-vault-surface to-vault-bg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Warranty Center</h1>
            <p className="text-sm text-vault-text-muted mt-0.5">Service &amp; warranty automation</p>
          </div>
          <button
            onClick={() => setShowAddAsset(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold-gradient text-charcoal-300 font-bold text-sm hover:shadow-gold-glow transition-all"
          >
            <Plus size={15} />
            Add Asset
          </button>
        </div>

        {expiringSoon > 0 && (
          <div className="mt-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 p-4 flex items-center gap-3 animate-fade-in">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
              <Bell size={18} className="text-yellow-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-yellow-400">
                ⚠ {expiringSoon} {expiringSoon === 1 ? 'warranty' : 'warranties'} expiring in 30 days
              </p>
              <p className="text-xs text-yellow-400/70 mt-0.5">Tap a card to set a reminder or renew</p>
            </div>
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="px-5 mt-2">
        <div className="flex gap-1 p-1 glass rounded-xl mb-4">
          {(['all', 'active', 'expiring', 'expired'] as FilterTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={cn(
                'flex-1 py-2 rounded-lg text-xs font-bold transition-all capitalize',
                filter === tab
                  ? 'bg-gold-500 text-charcoal-300 shadow-gold-glow-sm'
                  : 'text-vault-text-muted hover:text-vault-text'
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Asset timeline */}
        <div className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-px bg-vault-border" />
          <div className="space-y-4 pb-28">
            {sorted.map((asset) => (
              <div key={asset.id} className="relative flex gap-4">
                <div className={cn(
                  'relative z-10 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl',
                  asset.status === 'active' ? 'bg-green-500/10 border border-green-500/30' :
                  asset.status === 'expiring' ? 'bg-yellow-500/10 border border-yellow-500/30' :
                  'bg-red-500/10 border border-red-500/30'
                )}>
                  {asset.icon}
                </div>

                <Link href={`/warranty/${asset.id}`} className="flex-1 card p-4 card-hover block">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-vault-text leading-tight">{asset.name}</p>
                      <p className="text-xs text-vault-text-muted mt-0.5">{asset.brand} · {asset.zone}</p>

                      <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                        <div className="flex items-center gap-1">
                          {STATUS_ICON[asset.status]}
                        </div>
                        <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded-full', STATUS_BADGE[asset.status])}>
                          {STATUS_LABEL[asset.status]}
                        </span>
                        {asset.status !== 'expired' && (
                          <span className="text-[9px] text-vault-text-muted font-medium">
                            {asset.daysLeft > 0 ? `${asset.daysLeft}d remaining` : 'Today'}
                          </span>
                        )}
                        {asset.invoiceLinked && (
                          <span className="flex items-center gap-1 text-[9px] font-bold text-gold-500 bg-gold-500/10 px-1.5 py-0.5 rounded-md">
                            <FileText size={9} /> Invoice linked
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <div>
                          <p className="text-[9px] font-semibold text-vault-text-muted uppercase tracking-widest">Purchase</p>
                          <p className="text-xs font-semibold text-vault-text">{formatDate(asset.purchaseDate)}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-semibold text-vault-text-muted uppercase tracking-widest">Expires</p>
                          <p className={cn('text-xs font-semibold', asset.status === 'expired' ? 'text-red-400' : asset.status === 'expiring' ? 'text-yellow-400' : 'text-vault-text')}>
                            {formatDate(asset.warrantyExpiry)}
                          </p>
                        </div>
                        {asset.nextService && (
                          <div className="col-span-2">
                            <p className="text-[9px] font-semibold text-vault-text-muted uppercase tracking-widest">Next Service</p>
                            <p className="text-xs font-semibold text-blue-400">{formatDate(asset.nextService)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-vault-text-muted flex-shrink-0 mt-1" />
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Asset Modal */}
      {showAddAsset && (
        <>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 animate-fade-in" onClick={() => setShowAddAsset(false)} />
          <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-vault-surface border-t border-vault-border animate-slide-up max-h-[90dvh] overflow-y-auto">
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-vault-muted" />
            </div>
            <div className="px-6 pb-10">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-bold text-white">Add New Asset</h3>
                  <p className="text-xs text-vault-text-muted mt-0.5">Track your home appliance or fixture</p>
                </div>
                <button onClick={() => setShowAddAsset(false)} className="w-8 h-8 rounded-xl glass flex items-center justify-center">
                  <X size={16} className="text-vault-text-muted" />
                </button>
              </div>

              <div className="space-y-4">
                {[{ label: 'Asset Name', placeholder: 'e.g. Samsung Front Load Washer' }, { label: 'Brand', placeholder: 'e.g. Samsung' }, { label: 'Model Number', placeholder: 'e.g. WW80T3040BS' }].map(({ label, placeholder }) => (
                  <div key={label}>
                    <label className="text-xs font-semibold text-vault-text-muted uppercase tracking-widest mb-2 block">{label}</label>
                    <input className="w-full px-4 py-3.5 text-sm rounded-2xl" placeholder={placeholder} />
                  </div>
                ))}

                <div>
                  <label className="text-xs font-semibold text-vault-text-muted uppercase tracking-widest mb-2 block">Zone / Room</label>
                  <select className="w-full px-4 py-3.5 text-sm rounded-2xl bg-vault-card border border-vault-border text-vault-text">
                    {['Living Area', 'Kitchen', 'Master Bedroom', 'Room 2', 'Study', 'Utility', 'Balcony'].map(z => (
                      <option key={z}>{z}</option>
                    ))}
                  </select>
                </div>

                {[{ label: 'Purchase Date' }, { label: 'Warranty Expiry' }].map(({ label }) => (
                  <div key={label}>
                    <label className="text-xs font-semibold text-vault-text-muted uppercase tracking-widest mb-2 block">{label}</label>
                    <input type="date" className="w-full px-4 py-3.5 text-sm rounded-2xl" />
                  </div>
                ))}

                <div>
                  <label className="text-xs font-semibold text-vault-text-muted uppercase tracking-widest mb-2 block">Invoice (optional)</label>
                  <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-vault-card border border-vault-border cursor-pointer hover:border-gold-500/40 transition-all">
                    <FileText size={16} className="text-gold-500" />
                    <span className="text-sm text-vault-text-muted">Attach invoice PDF</span>
                  </div>
                </div>

                <button className="w-full py-4 rounded-2xl bg-gold-gradient text-charcoal-300 font-bold text-sm hover:shadow-gold-glow transition-all mt-2">
                  Save Asset
                </button>
                <button onClick={() => setShowAddAsset(false)} className="w-full py-3 rounded-2xl glass gold-border text-vault-text font-semibold text-sm">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
