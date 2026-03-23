import { ScanEye, Paintbrush, ChevronRight, Layers } from 'lucide-react'
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
            <h3 className="text-sm font-bold text-white">AR Renovation Estimator</h3>
            <p className="text-[10px] font-medium text-vault-text-muted mt-0.5">Bare Shell / Unfurnished Property Detected</p>
          </div>
        </div>
      </div>

      <div className="relative h-44 w-full bg-charcoal-900 border-b border-vault-border overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
            src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&q=80&w=800"
            className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-luminosity"
            alt="Concrete Shell"
        />
        {/* Placeholder for the user-generated video / image */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <Layers size={24} className="text-vault-text-muted mb-3 opacity-50" />
            <p className="text-xs font-bold text-vault-text uppercase tracking-widest mb-1">Upload Video / Photo</p>
            <p className="text-[10px] text-vault-text-muted">Drop a video of the bare concrete shell here.</p>
            <p className="text-[9px] text-gold-500/70 mt-3 font-medium">The AI will estimate paint volume, flooring tiles, and plaster runs automatically.</p>
        </div>
        
        {/* Example overlay UI that would appear over the video */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/10">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[9px] font-bold text-white tracking-wider">LIDAR SCANNING</span>
        </div>
      </div>

      <div className="p-4 bg-vault-surface">
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-vault-text flex items-center gap-2 font-medium"><Paintbrush size={12} className="text-gold-500"/> Primer & Paint Volume</span>
            <span className="text-gold-500 font-bold">Pending Scan</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-vault-text flex items-center gap-2 font-medium"><Layers size={12} className="text-vault-text-muted"/> Flooring (Sq. Ft)</span>
            <span className="text-white font-bold tracking-widest">—</span>
          </div>
        </div>
        <Link 
            href="/ar"
            className="mt-4 w-full py-2.5 rounded-xl bg-gold-500/10 hover:bg-gold-500/20 text-gold-500 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
        >
            Start Room Scan <ChevronRight size={14}/>
        </Link>
      </div>
    </div>
  )
}
