'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, ShieldCheck, ShieldAlert, ShieldOff, Zap, Info, Bell, Phone, FileText } from 'lucide-react'
import { cn, formatDate, getWarrantyStatus, getDaysUntil } from '@/lib/utils'

interface ServiceEvent {
  date: string
  note: string
}

interface AssetDetail {
  name: string
  icon: string
  zone: string
  brand: string
  model: string
  serial: string
  purchaseDate: string
  warrantyExpiry: string
  efficiency: string | null
  invoiceLinked: boolean
  nextService: string | null
  serviceHistory: ServiceEvent[]
}

const DEMO_ASSETS: Record<string, AssetDetail> = {
  a1: {
    name: 'Daikin 2.0T Inverter AC',
    icon: '❄️',
    zone: 'Living Area',
    brand: 'Daikin',
    model: 'FTKM60TV',
    serial: 'DK-2024-LV-001',
    purchaseDate: '2023-04-15',
    warrantyExpiry: '2028-04-15',
    efficiency: 'BEE 5 Star',
    invoiceLinked: true,
    nextService: '2026-10-01',
    serviceHistory: [
      { date: '2025-10-01', note: 'Annual deep clean & gas top-up' },
      { date: '2024-10-15', note: 'Regular service — no issues found' },
    ],
  },
  a2: {
    name: 'Sony Bravia 75" OLED',
    icon: '📺',
    zone: 'Living Area',
    brand: 'Sony',
    model: 'XR-75A95L',
    serial: 'SN-TV-LV-005',
    purchaseDate: '2023-05-10',
    warrantyExpiry: '2026-05-10',
    efficiency: null,
    invoiceLinked: true,
    nextService: null,
    serviceHistory: [],
  },
  a3: {
    name: 'Elica 4-Burner Hob',
    icon: '🍳',
    zone: 'Kitchen',
    brand: 'Elica',
    model: 'EHB TF HC 4B DX',
    serial: 'EL-KCH-003',
    purchaseDate: '2023-03-12',
    warrantyExpiry: '2026-03-12',
    efficiency: null,
    invoiceLinked: false,
    nextService: null,
    serviceHistory: [{ date: '2025-01-15', note: 'Burner cleaning service' }],
  },
  a4: {
    name: 'Modular Wardrobe — Master',
    icon: '🚪',
    zone: 'Master Bedroom',
    brand: 'Spacewood',
    model: 'Elite 8×10',
    serial: 'SW-MB-001',
    purchaseDate: '2023-02-28',
    warrantyExpiry: '2033-02-28',
    efficiency: null,
    invoiceLinked: true,
    nextService: null,
    serviceHistory: [],
  },
  a5: {
    name: 'Bosch Front Load Washer',
    icon: '🫧',
    zone: 'Utility',
    brand: 'Bosch',
    model: 'WAJ24268IN',
    serial: 'BS-ULT-007',
    purchaseDate: '2023-04-01',
    warrantyExpiry: '2028-04-01',
    efficiency: null,
    invoiceLinked: true,
    nextService: '2026-04-01',
    serviceHistory: [{ date: '2025-04-01', note: 'Annual drum clean & filter check' }],
  },
  a6: {
    name: 'Crompton Ceiling Fan',
    icon: '🌀',
    zone: 'Bedroom',
    brand: 'Crompton',
    model: 'HS Plus 1200mm',
    serial: 'CR-BD-012',
    purchaseDate: '2023-01-15',
    warrantyExpiry: '2025-01-15',
    efficiency: null,
    invoiceLinked: false,
    nextService: null,
    serviceHistory: [],
  },
}

export default function WarrantyDetailClient({ id }: { id: string }) {
  const router = useRouter()
  const asset = DEMO_ASSETS[id] ?? DEMO_ASSETS['a1']

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
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => router.back()} className="w-9 h-9 rounded-xl glass flex items-center justify-center flex-shrink-0">
            <ArrowLeft size={18} className="text-vault-text-muted" />
          </button>
          <h1 className="text-lg font-bold text-white">Asset Detail</h1>
        </div>

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
            ...(asset.efficiency ? [{ icon: <Zap size={16} className="text-gold-500" />, label: 'Efficiency Rating', value: asset.efficiency }] : []),
            { icon: <Info size={16} className="text-vault-text-muted" />, label: 'Model', value: asset.model },
            { icon: <Info size={16} className="text-vault-text-muted" />, label: 'Serial No.', value: asset.serial },
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

          {/* Invoice row */}
          {asset.invoiceLinked && (
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-gold-500/5 border border-gold-500/20">
              <FileText size={16} className="text-gold-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-[10px] font-semibold text-vault-text-muted uppercase tracking-widest mb-0.5">Invoice</p>
                <p className="text-sm font-bold text-gold-500">Invoice linked ✓</p>
              </div>
            </div>
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

        {/* Service history */}
        {asset.serviceHistory.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-white mb-3">Service History</h3>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-vault-border" />
              <div className="space-y-3">
                {asset.serviceHistory.map((event, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="relative z-10 w-8 h-8 rounded-full bg-vault-surface border border-vault-border flex items-center justify-center flex-shrink-0">
                      <span className="w-2 h-2 rounded-full bg-gold-500" />
                    </div>
                    <div className="flex-1 card p-3 mb-0">
                      <p className="text-xs font-semibold text-vault-text">{event.note}</p>
                      <p className="text-[10px] text-vault-text-muted mt-0.5">{formatDate(event.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
