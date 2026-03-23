import Image from 'next/image'
import Link from 'next/link'
import { HardHat, Hammer, AlertTriangle, CheckCircle2, Clock, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

// Reflects DEMO_TIMELINE_CONSTRUCTION and DEMO_SNAGS_CONSTRUCTION from demo-data.ts
const MILESTONES = [
  { label: 'Unit Booked',               date: 'Apr 2024',  status: 'done',        progress: 10 },
  { label: 'Builder-Buyer Agreement',   date: 'May 2024',  status: 'done',        progress: 15 },
  { label: 'Foundation Slab',           date: 'Jul 2024',  status: 'done',        progress: 30 },
  { label: 'Brickwork — Floors 1–5',    date: 'Oct 2024',  status: 'done',        progress: 45 },
  { label: 'Fit-out Phase — Floor 8',   date: 'Feb 2025',  status: 'active',      progress: 67 },
  { label: 'Pre-possession Inspection', date: 'Aug 2025',  status: 'upcoming',    progress: 85 },
  { label: 'Possession',                date: 'Dec 2025',  status: 'upcoming',    progress: 100 },
]

const TRANCHES = [
  { label: 'Booking (10%)',     amount: '₹11,20,000',   paid: true  },
  { label: 'Foundation (10%)', amount: '₹11,20,000',   paid: true  },
  { label: 'Slab (15%)',       amount: '₹16,80,000',   paid: true  },
  { label: 'Brickwork (15%)',  amount: '₹16,80,000',   paid: true  },
  { label: 'Fit-out (25%)',    amount: '₹28,00,000',   paid: false },
  { label: 'Possession (25%)', amount: '₹28,00,000',   paid: false },
]

const OVERALL = 67

export function ConstructionTimelineWidget() {
  const paidAmount = TRANCHES.filter(t => t.paid).reduce((_, __) => _, 0)
  const activeSnags = 5

  return (
    <div className="card overflow-hidden mt-6 mx-0">
      {/* Hero image */}
      <div className="relative h-44 w-full bg-vault-muted/20">
        <Image
          src="/demo-assets/construction_site.png"
          alt="Nexus Towers — C-801 construction progress"
          fill
          className="object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#151515] to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gold-500/10 border border-gold-500/20 text-[10px] font-bold text-gold-400 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
              Live Fit-out
            </span>
            <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-bold text-amber-400 backdrop-blur-md">
              ⚠ {activeSnags} Snags
            </span>
          </div>
          <h3 className="text-lg font-bold text-white leading-tight">C-801 · Nexus Towers</h3>
          <p className="text-[11px] font-medium text-vault-text-muted mt-0.5">Financial District · 1800 sqft · 3BHK · Floor 8</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Overall progress bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] font-bold text-vault-text-muted uppercase tracking-widest">Construction Progress</p>
            <p className="text-sm font-bold text-gold-400">{OVERALL}% Complete</p>
          </div>
          <div className="w-full h-2 rounded-full bg-vault-muted/30 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-gold-600 to-gold-400 transition-all"
              style={{ width: `${OVERALL}%` }}
            />
          </div>
          <p className="text-[10px] text-vault-text-muted mt-1">Possession ETA: Dec 2025</p>
        </div>

        {/* Milestones */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-vault-text-muted uppercase tracking-widest">Milestones</p>
          <div className="relative space-y-0">
            <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-gold-500 via-vault-border to-transparent" />
            {MILESTONES.map((m) => (
              <div key={m.label} className="relative flex items-center gap-3 py-1.5 pl-1">
                <div className={cn(
                  'relative z-10 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0',
                  m.status === 'done'     && 'bg-gold-500 border border-gold-400',
                  m.status === 'active'   && 'bg-gold-500/20 border-2 border-gold-400 ring-2 ring-gold-500/20',
                  m.status === 'upcoming' && 'bg-vault-muted/20 border border-vault-border'
                )}>
                  {m.status === 'done'   && <CheckCircle2 size={10} className="text-charcoal-300" />}
                  {m.status === 'active' && <span className="w-2 h-2 rounded-full bg-gold-400 animate-pulse" />}
                  {m.status === 'upcoming' && <span className="w-1.5 h-1.5 rounded-full bg-vault-text-muted" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-[11px] font-bold leading-tight', m.status === 'done' ? 'text-white' : m.status === 'active' ? 'text-gold-400' : 'text-vault-text-muted')}>
                    {m.label}
                  </p>
                </div>
                <span className={cn('text-[9px] font-medium flex-shrink-0', m.status === 'done' ? 'text-emerald-400' : m.status === 'active' ? 'text-gold-400' : 'text-vault-text-muted')}>
                  {m.date}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment tranches */}
        <div>
          <p className="text-[11px] font-bold text-vault-text-muted uppercase tracking-widest mb-2">Payment Schedule</p>
          <div className="grid grid-cols-2 gap-1.5">
            {TRANCHES.map((t) => (
              <div key={t.label} className={cn('p-2 rounded-xl border text-[10px]', t.paid ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-vault-muted/5 border-vault-border')}>
                <div className="flex items-center justify-between gap-1">
                  <span className={t.paid ? 'text-emerald-400' : 'text-vault-text-muted'}>{t.label}</span>
                  {t.paid ? <CheckCircle2 size={10} className="text-emerald-400" /> : <Clock size={10} className="text-vault-text-muted" />}
                </div>
                <p className={cn('font-bold mt-0.5', t.paid ? 'text-white' : 'text-vault-text-muted')}>{t.amount}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Open snags */}
        <Link href="/snags" className="flex items-center justify-between p-3 rounded-xl bg-red-500/5 border border-red-500/20 hover:bg-red-500/10 transition-colors">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-400" />
            <div>
              <p className="text-[11px] font-bold text-red-400">{activeSnags} Construction Snags Open</p>
              <p className="text-[9px] text-vault-text-muted">3 High urgency · Raise with builder</p>
            </div>
          </div>
          <ChevronRight size={14} className="text-red-400" />
        </Link>

        {/* Builder contact */}
        <div className="p-3 rounded-xl bg-vault-muted/10 border border-vault-border/50">
          <p className="text-[10px] font-bold text-vault-text-muted uppercase tracking-widest mb-1.5">Builder Contact</p>
          <p className="text-xs font-bold text-white">Nexus Realty Pvt Ltd</p>
          <p className="text-[10px] text-vault-text-muted mt-0.5">Site Manager: Rakesh Nair · +91 98490 55677</p>
          <p className="text-[10px] text-vault-text-muted">RERA: P02400008231</p>
        </div>
      </div>
    </div>
  )
}
