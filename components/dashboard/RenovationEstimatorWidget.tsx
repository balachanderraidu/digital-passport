import { ScanEye, Paintbrush, ChevronRight, Layers, Sparkles } from 'lucide-react'
import Link from 'next/link'

export function RenovationEstimatorWidget() {
  return (
    <div className="card overflow-hidden mt-6 mx-5">
      <div className="p-4 bg-vault-surface border-b border-vault-border">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gold-500/10 flex items-center justify-center flex-shrink-0">
            <ScanEye size={20} className="text-gold-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">AI Renovation Estimator</h3>
            <p className="text-[10px] font-medium text-vault-text-muted mt-0.5">Bare Shell · 2,400 sq ft · Hyderabad</p>
          </div>
        </div>
      </div>

      <div className="relative h-44 w-full bg-charcoal-900 border-b border-vault-border overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
            src="/demo-assets/empty_shell.png"
            className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-luminosity"
            alt="Bare Shell Interior"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles size={11} className="text-gold-400" />
            <span className="text-[10px] font-bold text-gold-400 uppercase tracking-wider">AI Estimate Ready</span>
          </div>
          <p className="text-xs font-semibold text-white">Based on 2,400 sq ft bare concrete shell</p>
        </div>
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/10">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[9px] font-bold text-white tracking-wider">LIDAR SCANNING</span>
        </div>
      </div>

      <div className="p-4 bg-vault-surface">
        <p className="text-[9px] font-bold text-vault-text-muted uppercase tracking-widest mb-3">AI Cost Breakdown (Est.)</p>
        <div className="space-y-2.5">
          {[
            { icon: <Paintbrush size={12} className="text-gold-500"/>, label: 'Primer & Emulsion Paint', value: '₹3.2L', sub: '~18,500 sq ft wall area' },
            { icon: <Layers size={12} className="text-blue-400"/>, label: 'Vitrified Flooring + Fixing', value: '₹7.8L', sub: '2,400 sq ft @ ₹325/sqft' },
            { icon: <span className="text-[11px]">🪟</span>, label: 'Doors, Windows & Frames', value: '₹4.1L', sub: '12 openings estimated' },
          ].map(({ icon, label, value, sub }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="flex-shrink-0">{icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-vault-text leading-tight">{label}</p>
                <p className="text-[9px] text-vault-text-muted">{sub}</p>
              </div>
              <span className="text-sm font-bold text-gold-500 flex-shrink-0">{value}</span>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2 border-t border-vault-border/40 mt-1">
            <span className="text-[10px] font-bold text-vault-text-muted uppercase tracking-widest">Total Estimate</span>
            <span className="text-base font-bold text-white">₹24–28L</span>
          </div>
        </div>
        <Link 
            href="/ar"
            className="mt-4 w-full py-2.5 rounded-xl bg-gold-500/10 hover:bg-gold-500/20 text-gold-500 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
        >
            Scan Room for Precise Estimate <ChevronRight size={14}/>
        </Link>
      </div>
    </div>
  )
}
