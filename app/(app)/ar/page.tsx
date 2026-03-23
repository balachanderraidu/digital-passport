'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ScanFace, BoxSelect, Sparkles, Zap, ShieldCheck } from 'lucide-react'

export default function ARVisionPage() {
  const router = useRouter()

  return (
    <div className="min-h-dvh bg-vault-bg flex flex-col relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gold-500/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="px-5 pt-14 pb-4 sticky top-0 z-20 bg-vault-bg/80 backdrop-blur-md">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full glass flex items-center justify-center text-vault-text-muted hover:text-white transition-colors mb-4"
        >
          <ChevronLeft size={20} />
        </button>
      </div>

      <div className="flex-1 px-6 pb-28 flex flex-col items-center justify-center text-center -mt-10 relative z-10">
        
        {/* Main AR Graphic */}
        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-3xl bg-vault-surface glass-gold flex items-center justify-center text-gold-500 relative z-10 mx-auto">
            <ScanFace size={48} strokeWidth={1.5} />
          </div>
          
          {/* Scanning lines animation ring */}
          <div className="absolute inset-0 rounded-3xl border-2 border-gold-500/30 animate-ping" style={{ animationDuration: '3s' }} />
          <div className="absolute -inset-4 rounded-[2rem] border border-gold-500/10 rotate-12" />
          <div className="absolute -inset-8 rounded-[2.5rem] border border-gold-500/5 -rotate-6" />
        </div>

        <h1 className="text-3xl font-bold text-white tracking-tight mb-3">
          AR <span className="gold-text">Vision</span>
        </h1>
        
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-400 text-xs font-bold uppercase tracking-widest mb-8">
          <Sparkles size={12} /> Concept Preview
        </div>

        <p className="text-sm text-vault-text-muted leading-relaxed mb-10 max-w-[280px]">
          The future of home tracking is spatial. Point your phone to unlock a hidden digital layer over your physical property.
        </p>

        {/* Features / Capabilities */}
        <div className="space-y-4 w-full text-left">
          
          {/* X-Ray Walls */}
          <div className="p-5 rounded-2xl glass border border-vault-border/50 relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full" />
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center flex-shrink-0">
                <Zap size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-1">X-Ray Architecture</h3>
                <p className="text-xs text-vault-text-muted leading-relaxed">
                  Look through your walls to see the precise alignment of electrical conduits, plumbing pipes, and structural columns before drilling.
                </p>
              </div>
            </div>
          </div>

          {/* Instant Asset Scanning */}
          <div className="p-5 rounded-2xl glass border border-vault-border/50 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-green-500/5 blur-3xl rounded-full" />
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-400 flex items-center justify-center flex-shrink-0">
                <BoxSelect size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-1">Instant Asset Scanning</h3>
                <p className="text-xs text-vault-text-muted leading-relaxed">
                  Point your camera at a sofa or appliance. AR Vision recognizes the item and instantly floats its warranty status, purchase receipt, and service manual.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
      
      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-vault-bg via-vault-bg/90 to-transparent pb-safe">
        <Link 
          href="/dashboard"
          className="w-full flex items-center justify-center py-4 rounded-2xl bg-vault-surface border border-vault-border text-white text-sm font-bold active:scale-95 transition-all"
        >
          Return to Dashboard
        </Link>
      </div>

    </div>
  )
}
