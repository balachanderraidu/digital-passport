'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ScanFace, BoxSelect, Sparkles, Zap, ShieldCheck, X, Camera, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/useAuth'
import { useProperty } from '@/lib/useProperty'
import { useDemoDataHook } from '@/lib/demo-data'

export default function ARVisionPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { activePropertyId } = useProperty()
  const isDemo = (!authLoading && !user) || !!(activePropertyId && activePropertyId.startsWith('p_'))
  const demoContext = useDemoDataHook(activePropertyId)

  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<null | {
    icon: React.ElementType
    iconColor: string
    iconBg: string
    title: string
    subtitle: string
    badgeText: string
    badgeColor: string
    subText: string
    actionText: string
  }>(null)
  const [error, setError] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  // Fix #4: keep a ref to the scan timer so we can cancel it on close
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Stop camera when closing
  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scanTimerRef.current) clearTimeout(scanTimerRef.current)
      stopCamera()
    }
  }, [])

  async function launchScanner() {
    setIsScanning(true)
    setScanResult(null)  // Fix #4: was setScanResult(false), use null for type safety
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      // Simulate a scan result after 3.5 seconds
      scanTimerRef.current = setTimeout(() => {
        if (!streamRef.current) return
        
        let resultData = {
          icon: ShieldCheck, iconColor: 'text-gold-400', iconBg: 'bg-gold-500/20',
          title: 'Samsung 55" QLED TV', subtitle: 'Living Room · Serial: SQ49102X',
          badgeText: 'Active Warranty', badgeColor: 'bg-green-500/20 text-green-400 border-green-500/20',
          subText: '342 days left', actionText: 'View Passport Details'
        }

        if (isDemo) {
          if (demoContext.property.id === 'p_rental') {
            resultData = {
              icon: Zap, iconColor: 'text-amber-400', iconBg: 'bg-amber-500/20',
              title: 'AC Unit Filter', subtitle: 'Living Room · Needs Maintenance',
              badgeText: 'Action Required', badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/20',
              subText: 'Last cleaned: 8 months ago', actionText: 'Schedule Cleaning'
            }
          } else if (demoContext.property.id === 'p_construction') {
            resultData = {
              icon: BoxSelect, iconColor: 'text-blue-400', iconBg: 'bg-blue-500/20',
              title: 'MEP Overlay: Column C-12', subtitle: 'Conduit Depth: 4cm · Concrete Curing: OK',
              badgeText: 'Structural Scan', badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/20',
              subText: 'Matches Blueprint V2', actionText: 'Save Scan to Timeline'
            }
          } else if (demoContext.property.id === 'p_empty') {
            resultData = {
              icon: Sparkles, iconColor: 'text-purple-400', iconBg: 'bg-purple-500/20',
              title: 'Wall Area 4', subtitle: 'Bare Paint · 120 sqft calculated',
              badgeText: 'Estimator', badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/20',
              subText: 'Requires 2 gallons of paint', actionText: 'Get Fit-out Quotes'
            }
          }
        }

        setScanResult(resultData)
      }, 3500)
    } catch {
      setError('Camera access denied or unavailable.')
    }
  }

  function closeScanner() {
    // Fix #4: cancel the pending scan timer before closing
    if (scanTimerRef.current) {
      clearTimeout(scanTimerRef.current)
      scanTimerRef.current = null
    }
    stopCamera()
    setIsScanning(false)
    setScanResult(null)
  }

  if (isScanning) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center overflow-hidden">
        {/* Live Camera Feed */}
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="absolute inset-0 w-full h-full object-cover opacity-70"
        />

        {error ? (
          <div className="relative z-10 p-6 glass rounded-2xl text-center max-w-xs">
            <Lock className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <p className="text-sm font-bold text-white mb-2">Camera Access Required</p>
            <p className="text-xs text-vault-text-muted mb-4">{error}</p>
            <button onClick={closeScanner} className="px-4 py-2 bg-vault-surface rounded-xl text-xs font-bold border border-vault-border">Go Back</button>
          </div>
        ) : (
          <>
            {/* HUD Overlay */}
            <div className="absolute top-12 left-6 right-6 flex items-center justify-between z-10">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-bold text-white tracking-widest uppercase">Live Scan</span>
              </div>
              <button onClick={closeScanner} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white">
                <X size={18} />
              </button>
            </div>

            {/* Scanning Reticle */}
            <div className="relative w-64 h-64 z-10">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-gold-500" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-gold-500" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-gold-500" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-gold-500" />
              
              {!scanResult && (
                <div 
                  className="absolute left-0 right-0 h-[2px] bg-gold-500 shadow-[0_0_15px_rgba(255,215,0,0.8)] ar-scan-line"
                />
              )}
            </div>

            {/* Helper Text */}
            {!scanResult && (
              <p className="absolute bottom-28 text-sm font-medium text-white/80 tracking-wide z-10 animate-pulse">
                Point at furniture or walls...
              </p>
            )}

            {/* Simulated Result Card */}
            {scanResult && (
              <div className="absolute bottom-28 left-6 right-6 p-4 rounded-2xl bg-black/60 backdrop-blur-xl border border-vault-border/50 animate-slide-up z-20">
                <div className="flex items-start gap-3">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0", scanResult.iconBg)}>
                    <scanResult.icon className={scanResult.iconColor} size={24} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{scanResult.title}</h3>
                    <p className="text-[10px] text-vault-text-muted mt-0.5">{scanResult.subtitle}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-bold border", scanResult.badgeColor)}>
                        {scanResult.badgeText}
                      </span>
                      <span className="text-[9px] text-vault-text-muted">{scanResult.subText}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={closeScanner}
                  className="w-full mt-4 py-2 rounded-xl bg-vault-surface border border-vault-border/50 text-white text-xs font-bold"
                >
                  {scanResult.actionText}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    )
  }

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
        <button 
          onClick={launchScanner}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gold-500 text-charcoal-300 text-sm font-bold shadow-gold-glow-sm hover:scale-[1.02] active:scale-95 transition-all"
        >
          <Camera size={18} /> Launch Scanner
        </button>
      </div>

    </div>
  )
}
