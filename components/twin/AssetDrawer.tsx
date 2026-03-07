'use client'

import { X, Phone, ExternalLink, Calendar, Zap, ShieldCheck, Paintbrush2, Info } from 'lucide-react'
import { cn, formatDate, getWarrantyStatus } from '@/lib/utils'

interface Asset {
  id: string
  name: string
  icon: string
  zone: string
  purchaseDate: string
  warrantyExpiry: string | null
  efficiency: string | null
  model: string | null
  serial: string | null
  paintCode: string | null
  warrantyStatus: 'active' | 'expiring' | 'expired'
  lastService: string | null
}

interface AssetDrawerProps {
  asset: Asset
  open: boolean
  onClose: () => void
}

export function AssetDrawer({ asset, open, onClose }: AssetDrawerProps) {
  if (!open) return null

  const status = asset.warrantyExpiry ? getWarrantyStatus(asset.warrantyExpiry) : null

  const statusConfig = {
    active: { label: 'Warranty Active', cls: 'warranty-active' },
    expiring: { label: 'Expiring Soon', cls: 'warranty-expiring' },
    expired: { label: 'Warranty Expired', cls: 'warranty-expired' },
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-vault-surface border-t border-vault-border animate-slide-up shadow-card max-h-[80dvh] overflow-y-auto">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-vault-muted" />
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 w-8 h-8 rounded-xl glass flex items-center justify-center"
        >
          <X size={16} className="text-vault-text-muted" />
        </button>

        <div className="px-6 pb-8">
          {/* Asset header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl glass-gold gold-border flex items-center justify-center text-3xl">
              {asset.icon}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white leading-tight">{asset.name}</h3>
              <p className="text-sm text-vault-text-muted font-medium">{asset.zone}</p>
            </div>
          </div>

          {/* Data rows */}
          <div className="space-y-3">
            <DataRow
              icon={<Calendar size={16} className="text-gold-500" />}
              label="Purchase Date"
              value={formatDate(asset.purchaseDate)}
            />

            {asset.warrantyExpiry && (
              <DataRow
                icon={<ShieldCheck size={16} className={status === 'active' ? 'text-green-400' : status === 'expiring' ? 'text-yellow-400' : 'text-red-400'} />}
                label="Warranty Expiry"
                value={
                  <span className="flex items-center gap-2">
                    {formatDate(asset.warrantyExpiry)}
                    {status && (
                      <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', statusConfig[status].cls)}>
                        {statusConfig[status].label}
                      </span>
                    )}
                  </span>
                }
              />
            )}

            {asset.efficiency && (
              <DataRow
                icon={<Zap size={16} className="text-gold-500" />}
                label="Efficiency Rating"
                value={asset.efficiency}
              />
            )}

            {asset.model && (
              <DataRow
                icon={<Info size={16} className="text-vault-text-muted" />}
                label="Model"
                value={asset.model}
              />
            )}

            {asset.serial && (
              <DataRow
                icon={<Info size={16} className="text-vault-text-muted" />}
                label="Serial No."
                value={asset.serial}
              />
            )}

            {asset.paintCode && (
              <DataRow
                icon={<Paintbrush2 size={16} className="text-gold-500" />}
                label="Paint / Finish"
                value={asset.paintCode}
              />
            )}

            {asset.lastService && (
              <DataRow
                icon={<Calendar size={16} className="text-vault-text-muted" />}
                label="Last Service"
                value={formatDate(asset.lastService)}
              />
            )}
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <button className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gold-gradient text-charcoal-300 font-bold text-sm hover:shadow-gold-glow transition-all">
              <ExternalLink size={16} />
              View Details
            </button>
            <button className="flex items-center justify-center gap-2 py-3.5 rounded-2xl glass gold-border text-vault-text font-semibold text-sm hover:gold-border-active transition-all">
              <Phone size={16} className="text-gold-500" />
              Call Support
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

function DataRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-vault-card/50 border border-vault-border">
      <div className="mt-0.5 flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-vault-text-muted uppercase tracking-widest mb-0.5">{label}</p>
        <div className="text-sm font-semibold text-vault-text">{value}</div>
      </div>
    </div>
  )
}
