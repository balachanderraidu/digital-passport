'use client'

import { useState } from 'react'
import { Play, FileVideo, ShieldAlert, BadgeCheck, Clock, FileWarning } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AIWalkthroughWidget() {
  const [isPlaying, setIsPlaying] = useState(false)

  return (
    <div className="card overflow-hidden mt-6 mb-2">
      <div className="p-4 border-b border-vault-border/50 bg-gradient-to-r from-blue-500/10 to-transparent flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <FileVideo size={16} className="text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white leading-tight">Q3 Tenant Walkthrough</h3>
            <p className="text-[10px] text-blue-400 mt-0.5">AI Analysis Complete</p>
          </div>
        </div>
        <p className="text-[10px] text-vault-text-muted">Uploaded 2h ago</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Video Thumbnail */}
        <div 
          onClick={() => setIsPlaying(true)}
          className="relative w-full rounded-xl overflow-hidden aspect-video bg-vault-muted cursor-pointer group"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src="https://images.unsplash.com/photo-1598928506311-c55dd1b6e159?auto=format&fit=crop&q=80&w=800"
            alt="Interior" 
            className="w-full h-full object-cover opacity-60 transition-all group-hover:scale-105 group-hover:opacity-80"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            {isPlaying ? (
              <div className="flex flex-col items-center select-none">
                <div className="w-12 h-12 rounded-full border-t-2 border-r-2 border-white animate-spin mb-2" />
                <span className="text-[10px] font-bold text-white uppercase tracking-widest bg-black/50 px-2 py-0.5 rounded-full">Decyphering...</span>
              </div>
            ) : (
              <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shadow-2xl pl-1 group-hover:bg-gold-500 transition-colors">
                <Play size={24} className="text-white" />
              </div>
            )}
          </div>
          <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/60 text-[10px] font-bold text-white">
            02:45
          </div>
        </div>

        {/* AI Insight Boxes */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <BadgeCheck size={14} className="text-green-400" />
              <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Structural</p>
            </div>
            <p className="text-xs font-medium text-white">No unapproved structural modifications detected.</p>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <FileWarning size={14} className="text-amber-400" />
              <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Maintenance</p>
            </div>
            <p className="text-xs font-medium text-white">AC filter in Master Bedroom dusty. Minor scuff on Living wall.</p>
          </div>
        </div>

        {/* Action Button */}
        <button className="w-full py-2.5 rounded-lg border border-vault-border text-xs font-bold text-vault-text hover:bg-vault-muted/10 transition-colors flex items-center justify-center gap-2">
          <Clock size={14} /> Schedule Vendor Visit
        </button>
      </div>
    </div>
  )
}
