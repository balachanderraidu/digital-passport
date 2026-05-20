'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ShieldCheck, ShieldAlert, ShieldOff, Plus, ChevronRight, Bell, FileText, X, Loader2 } from 'lucide-react'
import { cn, formatDate, getWarrantyStatus, getDaysUntil } from '@/lib/utils'
import { useAuth } from '@/lib/useAuth'
import { useProperty } from '@/lib/useProperty'
import { subscribeWarrantyAssets, addWarrantyAsset, deleteWarrantyAsset, type WarrantyAsset } from '@/lib/firestore'
import { uploadInvoice } from '@/lib/storage'
import { useDemoDataHook, DEMO_ITEM_LINKS } from '@/lib/demo-data'
import { PassportModeBadge } from '@/components/PassportModeBadge'
import { PageGuide } from '@/components/PageGuide'

const DEMO_ITEM_ENTRIES = Object.entries(DEMO_ITEM_LINKS).map(([k, link]) => ({
  keyPrefix: k.split(' ')[0].toLowerCase(),
  keyLower: k.toLowerCase(),
  link
}))

type FilterTab = 'all' | 'active' | 'expiring' | 'expired'

const ZONES = ['Living Area', 'Kitchen', 'Master Bedroom', 'Room 2', 'Study', 'Utility', 'Balcony']

const ICONS = ['❄️', '📺', '🍳', '🚪', '🫧', '🌀', '💡', '🖥️', '🛁', '🔥', '📱', '🎮']

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

interface AssetForm {
  name: string
  icon: string
  zone: string
  brand: string
  model: string
  serialNumber: string
  purchaseDate: string
  warrantyExpiry: string
  nextService: string
}

const DEFAULT_FORM: AssetForm = {
  name: '',
  icon: '❄️',
  zone: 'Living Area',
  brand: '',
  model: '',
  serialNumber: '',
  purchaseDate: '',
  warrantyExpiry: '',
  nextService: '',
}

export default function WarrantyPage() {
  const { user, loading: authLoading } = useAuth()
  const { activePropertyId, activeProperty } = useProperty()
  const [filter, setFilter] = useState<FilterTab>('all')
  const [showAddAsset, setShowAddAsset] = useState(false)
  const [assets, setAssets] = useState<WarrantyAsset[]>([])
  const [loadingAssets, setLoadingAssets] = useState(true)
  const [form, setForm] = useState<AssetForm>(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null)
  const invoiceRef = useRef<HTMLInputElement>(null)

  const isDemo = (!authLoading && !user) || !!(activePropertyId && activePropertyId.startsWith('p_'))
  const demoContext = useDemoDataHook(activePropertyId)

  // Demo mode
  useEffect(() => {
    if (!isDemo) return
    setAssets(demoContext.assets)
    setLoadingAssets(false)
  }, [isDemo, demoContext.assets])

  // Real user
  useEffect(() => {
    if (!user) return
    setLoadingAssets(true)
    const unsub = subscribeWarrantyAssets(user.uid, (data) => {
      setAssets(data)
      setLoadingAssets(false)
    }, activePropertyId)
    return unsub
  }, [user, activePropertyId])

  // Check URL for quick action triggers
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('add=true')) {
      setShowAddAsset(true)
      // Remove query param without reload
      window.history.replaceState({}, '', '/warranty')
    }
  }, [])

  const assetsWithStatus = assets.map((a) => ({
    ...a,
    status: getWarrantyStatus(a.warrantyExpiry),
    daysLeft: getDaysUntil(a.warrantyExpiry),
  }))

  const expiringSoon = assetsWithStatus.filter((a) => a.status === 'expiring').length

  const filtered =
    filter === 'all' ? assetsWithStatus : assetsWithStatus.filter((a) => a.status === filter)

  const sorted = [...filtered].sort((a, b) => a.daysLeft - b.daysLeft)

  async function handleSave() {
    if (!user) {
      if (isDemo && form.name && form.purchaseDate && form.warrantyExpiry) {
        setSaving(true)
        setTimeout(() => {
          setSaving(false)
          setForm(DEFAULT_FORM)
          setInvoiceFile(null)
          setShowAddAsset(false)
        }, 800)
      }
      return
    }
    if (!form.name || !form.purchaseDate || !form.warrantyExpiry) return
    
    setSaving(true)
    try {
      let invoiceUrl: string | null = null
      if (invoiceFile) {
        const tempId = `${Date.now()}`
        invoiceUrl = await uploadInvoice(user.uid, tempId, invoiceFile)
      }
      await addWarrantyAsset(user.uid, {
        name: form.name,
        icon: form.icon,
        zone: form.zone,
        brand: form.brand,
        model: form.model,
        serialNumber: form.serialNumber,
        purchaseDate: form.purchaseDate,
        warrantyExpiry: form.warrantyExpiry,
        nextService: form.nextService || null,
        invoiceUrl,
        source: 'manual',
      }, activePropertyId)
      setForm(DEFAULT_FORM)
      setInvoiceFile(null)
      setShowAddAsset(false)
    } finally {
      setSaving(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-dvh bg-vault-bg flex items-center justify-center">
        <Loader2 size={28} className="text-gold-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-vault-bg">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 bg-gradient-to-b from-vault-surface to-vault-bg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Warranty Center</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-sm text-vault-text-muted">Service & warranty automation</p>
              <PassportModeBadge occupancy={isDemo ? demoContext.property.occupancy : activeProperty?.occupancy} />
            </div>
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

        <PageGuide id="warranty" title="Warranty & Asset Tracker">
          <p>Track every appliance, fixture, and fitting in your home — from ACs to water heaters. Get expiry alerts before warranties lapse, store invoices, and log service visits.</p>
          <p className="mt-1">📧 <span className="text-white font-medium">Gmail Sync</span> auto-discovers warranty emails from brands like LG, Samsung, and Bosch — no manual entry needed.</p>
        </PageGuide>

        {/* Filter tabs */}
      <div className="px-5 mt-2">
        <div className="flex gap-1 p-1 glass rounded-xl mb-4">
          {(['all', 'active', 'expiring', 'expired'] as FilterTab[]).map((tab) => (
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

        {/* Loading state */}
        {loadingAssets && (
          <div className="flex flex-col items-center py-16 gap-3">
            <Loader2 size={28} className="text-gold-500 animate-spin" />
            <p className="text-sm text-vault-text-muted">Loading assets…</p>
          </div>
        )}

        {/* Empty state */}
        {!loadingAssets && sorted.length === 0 && (() => {
          const occupancy = isDemo ? demoContext.property?.occupancy : undefined
          if (occupancy === 'renovation') return (
            <div className="text-center py-16 text-vault-text-muted">
              <span className="text-4xl block mb-3">🏗️</span>
              <p className="text-sm font-bold text-white">No appliances yet</p>
              <p className="text-xs mt-1">Still under construction — no fittings installed yet.<br/>Assets will appear once the property is handed over.</p>
            </div>
          )
          if (occupancy === 'empty') return (
            <div className="text-center py-16 text-vault-text-muted">
              <span className="text-4xl block mb-3">🪟</span>
              <p className="text-sm font-bold text-white">Bare shell — no assets yet</p>
              <p className="text-xs mt-1">Renovation hasn't started. Once fitted out,<br/>add appliances and fixtures here.</p>
            </div>
          )
          return (
            <div className="text-center py-16 text-vault-text-muted">
              <span className="text-4xl block mb-3">🛡️</span>
              <p className="text-sm font-medium">No assets yet</p>
              <p className="text-xs mt-1">Tap Add Asset to start tracking warranties</p>
            </div>
          )
        })()}

        {/* Asset timeline */}
        {!loadingAssets && sorted.length > 0 && (
          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-px bg-vault-border" />
            <div className="space-y-4 pb-28">
              {sorted.map((asset) => (
                <div key={asset.id} className="relative flex gap-4">
                  <div
                    className={cn(
                      'relative z-10 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden',
                      asset.photoUrl ? 'border border-vault-border' :
                      asset.status === 'active'
                        ? 'bg-green-500/10 border border-green-500/30 text-xl'
                        : asset.status === 'expiring'
                        ? 'bg-yellow-500/10 border border-yellow-500/30 text-xl'
                        : 'bg-red-500/10 border border-red-500/30 text-xl'
                    )}
                  >
                    {asset.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={asset.photoUrl} alt={asset.name} className="w-full h-full object-cover" />
                    ) : (
                      asset.icon
                    )}
                  </div>

                  <Link href={`/warranty/${asset.id}`} className="flex-1 card p-4 card-hover block">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-vault-text leading-tight">{asset.name}</p>
                        <p className="text-xs text-vault-text-muted mt-0.5">
                          {asset.brand} · {asset.zone}
                        </p>

                        <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                          <div className="flex items-center gap-1">{STATUS_ICON[asset.status]}</div>
                          <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded-full', STATUS_BADGE[asset.status])}>
                            {STATUS_LABEL[asset.status]}
                          </span>
                          {asset.status !== 'expired' && (
                            <span className="text-[9px] text-vault-text-muted font-medium">
                              {asset.daysLeft > 0 ? `${asset.daysLeft}d remaining` : 'Today'}
                            </span>
                          )}
                          {asset.invoiceUrl && (
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

                        {/* Service metadata — demo mode */}
                        {(() => {
                          const assetNameLower = asset.name.toLowerCase()
                          const assetNamePrefix = asset.name.split(' ')[0].toLowerCase()
                          const found = DEMO_ITEM_ENTRIES.find(e => 
                            assetNameLower.includes(e.keyPrefix) ||
                            e.keyLower.includes(assetNamePrefix)
                          )
                          const link = found?.link || null
                          const history = link?.serviceHistory ?? []
                          if (history.length === 0) return null
                          const lastSvc = [...history].sort((a, b) => b.date.localeCompare(a.date))[0]
                          const totalCost = history.reduce((s, e) => s + (e.cost ?? 0), 0)
                          const daysSince = Math.round((Date.now() - new Date(lastSvc.date).getTime()) / 86400000)
                          return (
                            <div className="mt-2 flex items-center gap-3 pt-2 border-t border-vault-border/40">
                              <span className="text-[9px] text-vault-text-muted flex items-center gap-1">
                                🔧 <span className="font-semibold text-vault-text">Last serviced</span> {daysSince}d ago
                              </span>
                              {totalCost > 0 && (
                                <span className="text-[9px] text-vault-text-muted ml-auto">
                                  ₹{totalCost.toLocaleString()} total
                                </span>
                              )}
                            </div>
                          )
                        })()}
                      </div>
                      <ChevronRight size={16} className="text-vault-text-muted flex-shrink-0 mt-1" />
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Asset Modal */}
      {showAddAsset && (
        <>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[55] animate-fade-in" onClick={() => setShowAddAsset(false)} />
          <div className="fixed inset-x-0 bottom-0 z-[60] rounded-t-3xl bg-vault-surface border-t border-vault-border animate-slide-up max-h-[90dvh] overflow-y-auto pb-safe">
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
                {/* Icon picker */}
                <div>
                  <label className="text-xs font-semibold text-vault-text-muted uppercase tracking-widest mb-2 block">Icon</label>
                  <div className="flex flex-wrap gap-2">
                    {ICONS.map((ic) => (
                      <button
                        key={ic}
                        onClick={() => setForm({ ...form, icon: ic })}
                        className={cn('w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all', form.icon === ic ? 'bg-gold-500/20 border border-gold-500' : 'glass border border-vault-border')}
                      >
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>

                {[
                  { label: 'Asset Name', key: 'name', placeholder: 'e.g. Samsung Front Load Washer' },
                  { label: 'Brand', key: 'brand', placeholder: 'e.g. Samsung' },
                  { label: 'Model Number', key: 'model', placeholder: 'e.g. WW80T3040BS' },
                  { label: 'Serial Number', key: 'serialNumber', placeholder: 'e.g. SNB-20231223' },
                ].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <label className="text-xs font-semibold text-vault-text-muted uppercase tracking-widest mb-2 block">{label}</label>
                    <input
                      className="w-full px-4 py-3.5 text-sm rounded-2xl"
                      placeholder={placeholder}
                      value={(form as unknown as Record<string, string>)[key]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    />
                  </div>
                ))}

                <div>
                  <label className="text-xs font-semibold text-vault-text-muted uppercase tracking-widest mb-2 block">Zone / Room</label>
                  <select
                    className="w-full px-4 py-3.5 text-sm rounded-2xl bg-vault-card border border-vault-border text-vault-text"
                    value={form.zone}
                    onChange={(e) => setForm({ ...form, zone: e.target.value })}
                  >
                    {ZONES.map((z) => <option key={z}>{z}</option>)}
                  </select>
                </div>

                {[
                  { label: 'Purchase Date', key: 'purchaseDate' },
                  { label: 'Warranty Expiry', key: 'warrantyExpiry' },
                  { label: 'Next Service Date (optional)', key: 'nextService' },
                ].map(({ label, key }) => (
                  <div key={key}>
                    <label className="text-xs font-semibold text-vault-text-muted uppercase tracking-widest mb-2 block">{label}</label>
                    <input
                      type="date"
                      className="w-full px-4 py-3.5 text-sm rounded-2xl"
                      value={(form as unknown as Record<string, string>)[key]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    />
                  </div>
                ))}

                <div>
                  <label className="text-xs font-semibold text-vault-text-muted uppercase tracking-widest mb-2 block">Invoice (optional)</label>
                  <input ref={invoiceRef} type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => setInvoiceFile(e.target.files?.[0] ?? null)} />
                  <div
                    onClick={() => invoiceRef.current?.click()}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-vault-card border border-vault-border cursor-pointer hover:border-gold-500/40 transition-all"
                  >
                    <FileText size={16} className="text-gold-500" />
                    <span className="text-sm text-vault-text-muted">{invoiceFile ? invoiceFile.name : 'Attach invoice PDF or image'}</span>
                  </div>
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving || !form.name || !form.purchaseDate || !form.warrantyExpiry}
                  className="w-full py-4 rounded-2xl bg-gold-gradient text-charcoal-300 font-bold text-sm hover:shadow-gold-glow transition-all mt-2 disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {saving ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : 'Save Asset'}
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
