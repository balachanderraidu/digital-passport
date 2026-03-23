import { ScanEye, Paintbrush, ChevronRight, Layers, Sparkles, Hammer, HardHat, CheckCircle2, Clock } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'

// Matches DEMO_VAULT_DOCS_EMPTY architect quote data
const ROOM_WISE_QUOTE = [
  { room: 'Living + Dining',  flooring: '₹3.2L',  painting: '₹0.8L',  electrical: '₹0.6L', total: '₹4.6L' },
  { room: 'Master Bedroom',   flooring: '₹1.8L',  painting: '₹0.5L',  electrical: '₹0.4L', total: '₹2.7L' },
  { room: 'Bedroom 2',        flooring: '₹1.4L',  painting: '₹0.4L',  electrical: '₹0.3L', total: '₹2.1L' },
  { room: 'Bedroom 3',        flooring: '₹1.2L',  painting: '₹0.4L',  electrical: '₹0.3L', total: '₹1.9L' },
  { room: 'Kitchen',          flooring: '₹0.9L',  painting: '₹0.3L',  electrical: '₹0.8L', total: '₹2.0L' },
  { room: 'Bathrooms (3)',    flooring: '₹1.8L',  painting: '₹0.6L',  electrical: '₹0.5L', total: '₹2.9L' },
]

const PLANNING_PHASES = [
  { label: 'Purchase & Registration',   status: 'done' },
  { label: 'GHMC Building Plan Approval', status: 'done' },
  { label: 'Architect Engaged',          status: 'done' },
  { label: 'Interior Design Drawings',   status: 'active' },
  { label: 'Construction Tendering',     status: 'upcoming' },
  { label: 'Construction Start (Q3)',    status: 'upcoming' },
]

export function RenovationEstimatorWidget() {
  return (
    <div className="card overflow-hidden mt-6 mx-0">
      {/* Hero */}
      <div className="relative h-44 w-full bg-charcoal-900 border-b border-vault-border overflow-hidden">
        <Image
          src="/demo-assets/bare_shell_interior.png"
          alt="Bare shell interior — Green Meadows Plot 104"
          fill
          className="object-cover opacity-50 mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/60 backdrop-blur-md border border-amber-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-[9px] font-bold text-amber-400 tracking-wider">RENOVATION PLANNING</span>
        </div>
        <div className="absolute bottom-3 left-4 right-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles size={11} className="text-gold-400" />
            <span className="text-[10px] font-bold text-gold-400 uppercase tracking-wider">AI Estimate Ready</span>
          </div>
          <p className="text-sm font-bold text-white">Plot 104, Green Meadows Phase 3</p>
          <p className="text-[10px] text-vault-text-muted mt-0.5">2400 sqft · 3BHK Bare Shell · Shamshabad</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Summary Cost */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Basic Fitout', value: '₹32L', sub: 'Builder grade' },
            { label: 'Premium', value: '₹42L', sub: 'Architect quote ✅', highlight: true },
            { label: 'Luxury', value: '₹58L', sub: 'High-end finishes' },
          ].map((t) => (
            <div key={t.label} className={cn('p-2 rounded-xl border text-center', t.highlight ? 'bg-gold-500/10 border-gold-500/30' : 'bg-vault-muted/5 border-vault-border')}>
              <p className={cn('text-sm font-bold', t.highlight ? 'text-gold-400' : 'text-white')}>{t.value}</p>
              <p className={cn('text-[9px] font-bold mt-0.5', t.highlight ? 'text-gold-400/70' : 'text-vault-text-muted')}>{t.label}</p>
              <p className="text-[8px] text-vault-text-muted mt-0.5">{t.sub}</p>
            </div>
          ))}
        </div>

        {/* Room-wise breakdown */}
        <div>
          <p className="text-[10px] font-bold text-vault-text-muted uppercase tracking-widest mb-2">Room-Wise Breakdown</p>
          <div className="space-y-1.5">
            {ROOM_WISE_QUOTE.map((r) => (
              <div key={r.room} className="flex items-center gap-2">
                <span className="text-[10px] font-medium text-vault-text w-28 flex-shrink-0 truncate">{r.room}</span>
                <div className="flex-1 flex gap-1">
                  {[r.flooring, r.painting, r.electrical].map((val, i) => (
                    <div key={i} className="flex-1 h-1.5 rounded-full bg-vault-muted/30 relative overflow-hidden">
                      <div className="absolute inset-y-0 left-0 rounded-full bg-gold-500/60" style={{ width: `${60 + i * 15}%` }} />
                    </div>
                  ))}
                </div>
                <span className="text-[10px] font-bold text-gold-400 w-10 text-right flex-shrink-0">{r.total}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 border-t border-vault-border/40 mt-1">
              <span className="text-[10px] font-bold text-vault-text-muted uppercase tracking-widest">Total (Premium)</span>
              <span className="text-base font-bold text-white">₹42,00,000</span>
            </div>
          </div>
        </div>

        {/* Architect info */}
        <div className="p-3 rounded-xl bg-vault-muted/10 border border-vault-border/50">
          <p className="text-[10px] font-bold text-vault-text-muted uppercase tracking-widest mb-1.5">Engaged Architect</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white">Prism Design Studio</p>
              <p className="text-[10px] text-vault-text-muted mt-0.5">Kondapur, Hyderabad · project@prismdesign.in</p>
              <p className="text-[10px] text-vault-text-muted">+91 98490 66432 · Ref: PDS-2025-104</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-amber-400 font-bold uppercase">In Progress</p>
              <p className="text-[9px] text-vault-text-muted mt-0.5">Design drawings</p>
            </div>
          </div>
        </div>

        {/* Planning phases */}
        <div>
          <p className="text-[10px] font-bold text-vault-text-muted uppercase tracking-widest mb-2">Planning Phases</p>
          <div className="space-y-1.5">
            {PLANNING_PHASES.map((p) => (
              <div key={p.label} className="flex items-center gap-2.5">
                <div className={cn(
                  'w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0',
                  p.status === 'done'     && 'bg-emerald-500/20 text-emerald-400',
                  p.status === 'active'   && 'bg-gold-500/20 text-gold-400',
                  p.status === 'upcoming' && 'bg-vault-muted/20 text-vault-text-muted'
                )}>
                  {p.status === 'done'     && <CheckCircle2 size={10} />}
                  {p.status === 'active'   && <span className="w-2 h-2 rounded-full bg-gold-400 animate-pulse" />}
                  {p.status === 'upcoming' && <Clock size={8} />}
                </div>
                <p className={cn(
                  'text-[11px] font-medium',
                  p.status === 'done' ? 'text-white' : p.status === 'active' ? 'text-gold-400' : 'text-vault-text-muted'
                )}>{p.label}</p>
              </div>
            ))}
          </div>
        </div>

        <Link
          href="/ar"
          className="w-full py-2.5 rounded-xl bg-gold-500/10 hover:bg-gold-500/20 text-gold-500 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
        >
          <ScanEye size={14} /> AR Scan for Precise Measure <ChevronRight size={12} />
        </Link>
      </div>
    </div>
  )
}
