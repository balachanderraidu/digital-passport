'use client'

import { useState } from 'react'
import { Play, FileVideo, ShieldAlert, BadgeCheck, Clock, FileWarning, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Camera } from 'lucide-react'
import { cn } from '@/lib/utils'

const WALKTHROUGH_HISTORY = [
  {
    id: 'wt-3',
    date: '15 Jan 2025',
    label: 'Walkthrough #3',
    result: 'warning',
    summary: '3 issues flagged',
  },
  {
    id: 'wt-2',
    date: '15 Nov 2024',
    label: 'Walkthrough #2',
    result: 'warning',
    summary: '1 issue flagged',
  },
  {
    id: 'wt-1',
    date: '15 Oct 2024',
    label: 'Walkthrough #1',
    result: 'clear',
    summary: 'All clear',
  },
]

const AI_ANALYSIS = [
  {
    category: 'Structural',
    icon: <ShieldAlert size={14} />,
    result: 'clear' as const,
    detail: 'No unapproved structural modifications detected. Walls, columns, and slab intact.',
  },
  {
    category: 'Maintenance',
    icon: <FileWarning size={14} />,
    result: 'warning' as const,
    detail: 'AC filter blocked in Master Bedroom for 3 months. Kitchen cabinet sagging.',
  },
  {
    category: 'Cleanliness',
    icon: <BadgeCheck size={14} />,
    result: 'clear' as const,
    detail: 'General cleanliness acceptable. Minor paint scuff on living room wall.',
  },
  {
    category: 'Fire Safety',
    icon: <CheckCircle2 size={14} />,
    result: 'clear' as const,
    detail: 'Smoke detectors intact. Exit path unobstructed. No electrical hazards detected.',
  },
]

export function AIWalkthroughWidget() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const daysUntilNext = 15

  return (
    <div className="card overflow-hidden mt-6 mb-2">
      {/* Header */}
      <div className="p-4 border-b border-vault-border/50 bg-gradient-to-r from-blue-500/10 to-transparent flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <FileVideo size={17} className="text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white leading-tight">AI Rental Inspection</h3>
              <span className="text-[8px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold uppercase tracking-widest border border-blue-500/30">Live</span>
            </div>
            <p className="text-[10px] text-blue-400 mt-0.5">Walkthrough #3 · AI processed 15 Jan 2025</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <p className="text-[9px] text-amber-400 font-bold uppercase">Next due in</p>
          <p className="text-sm font-bold text-amber-400">{daysUntilNext}d</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Tenant Info */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-vault-muted/10 border border-vault-border/50">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
            AS
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white">Arjun & Priya Sharma</p>
            <p className="text-[10px] text-vault-text-muted">Lease: Sep 2024 · ₹24,000/mo · Security ₹72,000</p>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[9px] font-bold text-emerald-400 uppercase">Active</span>
            <span className="text-[9px] text-vault-text-muted">8 mo</span>
          </div>
        </div>

        {/* Video Thumbnail */}
        <div
          onClick={() => setIsPlaying(!isPlaying)}
          className="relative w-full rounded-xl overflow-hidden aspect-video bg-vault-muted cursor-pointer group"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/demo-assets/walkthrough_thumb.png"
            alt="AI walkthrough analysis"
            className="w-full h-full object-cover opacity-70 transition-all group-hover:scale-105 group-hover:opacity-90"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            {isPlaying ? (
              <div className="flex flex-col items-center select-none">
                <div className="w-12 h-12 rounded-full border-t-2 border-r-2 border-white animate-spin mb-2" />
                <span className="text-[10px] font-bold text-white uppercase tracking-widest bg-black/60 px-2 py-0.5 rounded-full">Decyphering…</span>
              </div>
            ) : (
              <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shadow-2xl pl-1 group-hover:bg-gold-500 transition-colors">
                <Play size={24} className="text-white" />
              </div>
            )}
          </div>
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-[10px] font-bold text-white flex items-center gap-1">
            <Camera size={10} /> 02:45
          </div>
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-amber-500/80 text-[10px] font-bold text-white">
            ⚠ 3 Issues
          </div>
        </div>

        {/* AI Analysis Grid */}
        <div className="grid grid-cols-2 gap-2">
          {AI_ANALYSIS.map((item) => (
            <div
              key={item.category}
              className={cn(
                'rounded-xl p-3 border',
                item.result === 'clear'
                  ? 'bg-green-500/10 border-green-500/20'
                  : 'bg-amber-500/10 border-amber-500/20'
              )}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className={item.result === 'clear' ? 'text-green-400' : 'text-amber-400'}>
                  {item.icon}
                </span>
                <p className={cn('text-[9px] font-bold uppercase tracking-widest', item.result === 'clear' ? 'text-green-400' : 'text-amber-400')}>
                  {item.category}
                </p>
              </div>
              <p className="text-[10px] font-medium text-vault-text leading-snug">{item.detail}</p>
            </div>
          ))}
        </div>

        {/* Walkthrough History */}
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center justify-between text-[10px] font-bold text-vault-text-muted hover:text-white transition-colors py-1"
        >
          <span>Walkthrough History ({WALKTHROUGH_HISTORY.length})</span>
          {showHistory ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>

        {showHistory && (
          <div className="space-y-2 animate-fade-in">
            {WALKTHROUGH_HISTORY.map((wt) => (
              <div key={wt.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-vault-muted/10 border border-vault-border/40">
                <div className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
                  wt.result === 'clear' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                )}>
                  {wt.result === 'clear' ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-vault-text">{wt.label}</p>
                  <p className="text-[9px] text-vault-text-muted">{wt.date}</p>
                </div>
                <span className={cn('text-[9px] font-bold', wt.result === 'clear' ? 'text-emerald-400' : 'text-amber-400')}>
                  {wt.summary}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button className="py-2.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-[11px] font-bold text-amber-400 hover:bg-amber-500/30 transition-colors flex items-center justify-center gap-1.5">
            <AlertTriangle size={12} /> Notify Tenant
          </button>
          <button className="py-2.5 rounded-lg border border-vault-border text-[11px] font-bold text-vault-text hover:bg-vault-muted/10 transition-colors flex items-center justify-center gap-1.5">
            <Clock size={12} /> Schedule Visit
          </button>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
          <div>
            <p className="text-[10px] font-bold text-blue-400">Next Walkthrough Due</p>
            <p className="text-xs font-medium text-white mt-0.5">15 Feb 2025 · Tenant notified</p>
          </div>
          <button className="px-3 py-1.5 rounded-lg bg-blue-500/20 border border-blue-500/30 text-[10px] font-bold text-blue-400 hover:bg-blue-500/30 transition-colors">
            Request Now
          </button>
        </div>
      </div>
    </div>
  )
}
