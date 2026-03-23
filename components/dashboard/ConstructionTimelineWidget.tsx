import Image from 'next/image'
import { HardHat, Hammer, Clock, FileCheck } from 'lucide-react'

export function ConstructionTimelineWidget() {
  return (
    <div className="card overflow-hidden mt-6 mx-5">
      <div className="relative h-48 w-full bg-vault-muted/20">
        <Image 
          src="/demo-assets/site_foundation.png"
          alt="Active Construction Site"
          fill
          className="object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#151515] to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gold-500/10 border border-gold-500/20 text-xs font-bold text-gold-500 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
              Live Site Feed
            </span>
          </div>
          <h3 className="text-xl font-bold text-white leading-tight mt-2">Tower 3 Foundation</h3>
          <p className="text-sm font-medium text-vault-text-muted mt-0.5">Updated 4 hours ago by Project Team</p>
        </div>
      </div>

      <div className="p-4 bg-vault-surface">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-vault-muted/30 flex items-center justify-center">
              <HardHat size={16} className="text-gold-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-vault-text-muted uppercase tracking-widest leading-none mb-1">Current Stage</p>
              <p className="text-sm font-bold text-white">Foundation & Core</p>
            </div>
          </div>
          <div className="text-right">
             <p className="text-[10px] font-bold text-vault-text-muted uppercase tracking-widest leading-none mb-1">Progress</p>
             <p className="text-sm font-bold text-green-400">18% Complete</p>
          </div>
        </div>

        {/* Mini Timeline steps */}
        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-3 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-gold-500 before:via-vault-border before:to-transparent">
          
          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white bg-gold-500 text-charcoal-300 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
              <CheckIcon />
            </div>
            <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] ml-4">
              <div className="flex flex-col mb-1 justify-center">
                <span className="text-xs font-bold text-white">Site Clearance</span>
                <span className="text-[10px] font-medium text-vault-text-muted">Completed Oct 2025</span>
              </div>
            </div>
          </div>

          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-6 h-6 rounded-full border border-gold-500/30 bg-gold-500/10 text-gold-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
              <Hammer size={12} />
            </div>
            <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] ml-4">
              <div className="flex flex-col mb-1 justify-center">
                <span className="text-xs font-bold text-gold-500">Foundation Pouring</span>
                <span className="text-[10px] font-medium text-gold-500/60">In Progress (Est. 2 weeks)</span>
              </div>
            </div>
          </div>

          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-6 h-6 rounded-full border border-vault-border bg-vault-muted/20 text-vault-text-muted shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
              <div className="w-1.5 h-1.5 rounded-full bg-vault-text-muted" />
            </div>
            <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] ml-4">
              <div className="flex flex-col mb-1 justify-center">
                <span className="text-xs font-bold text-vault-text-muted">Podium Slab</span>
                <span className="text-[10px] font-medium text-vault-muted">Upcoming</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}

function CheckIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
