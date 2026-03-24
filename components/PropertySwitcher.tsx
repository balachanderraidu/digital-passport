'use client'
import 'leaflet/dist/leaflet.css'

import { useRouter } from 'next/navigation'
import { Check, Plus, X, ShieldCheck, Hammer, FolderLock, LayoutList, Map as MapIcon } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useProperty } from '@/lib/useProperty'
import { cn } from '@/lib/utils'
import type { Property } from '@/lib/firestore'
import { DEMO_DATA_CATALOG } from '@/lib/demo-data'

interface PropertySwitcherProps {
  onClose: () => void
}

const OCCUPANCY_META: Record<string, { label: string; emoji: string; color: string }> = {
  residing:   { label: 'Residing',     emoji: '🏠', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  rented:     { label: 'Rented Out',   emoji: '🔑', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  renovation: { label: 'Construction', emoji: '🏗️', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  empty:      { label: 'Bare Shell',   emoji: '🪟', color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' },
}

const DEMO_STATS: Record<string, { assets: number; snags: number; docs: number; context: string }> = {
  p_villa:        { assets: 10, snags: 5,  docs: 11, context: '5BHK · G+2 Villa' },
  p_rental:       { assets: 4,  snags: 3,  docs: 6,  context: '2BHK · Rented Out' },
  p_empty:        { assets: 0,  snags: 0,  docs: 4,  context: '3BHK · Bare Shell' },
  p_construction: { assets: 0,  snags: 6,  docs: 5,  context: '3BHK · Under Construction' },
}

function OccupancyBadge({ occupancy }: { occupancy?: string }) {
  const meta = occupancy ? OCCUPANCY_META[occupancy] : null
  if (!meta) return null
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border',
      meta.color
    )}>
      {meta.emoji} {meta.label}
    </span>
  )
}

function PropertyCard({ p, isActive, onSelect }: { p: Property; isActive: boolean; onSelect: () => void }) {
  const stats = DEMO_STATS[p.id]
  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full rounded-2xl flex items-center gap-3 transition-all text-left overflow-hidden',
        isActive ? 'glass-gold gold-border' : 'card hover:border-gold-500/20'
      )}
    >
      {p.heroImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.heroImageUrl} alt={p.name} className="w-20 h-16 object-cover flex-shrink-0 rounded-l-2xl" />
      ) : (
        <div className={cn(
          'w-20 h-16 flex-shrink-0 flex items-center justify-center rounded-l-2xl text-2xl',
          isActive ? 'bg-gold-500/20' : 'bg-vault-muted/20'
        )}>
          {OCCUPANCY_META[p.occupancy ?? '']?.emoji ?? '🏢'}
        </div>
      )}
      <div className="flex-1 min-w-0 py-2 pr-3">
        <div className="flex items-center gap-2 mb-0.5">
          <p className={cn('text-sm font-bold truncate', isActive ? 'text-gold-500' : 'text-white')}>
            {p.name}
          </p>
          {isActive && <Check size={14} className="text-gold-500 flex-shrink-0" />}
        </div>
        <p className="text-[10px] text-vault-text-muted truncate mb-1.5">
          {stats?.context ?? [p.unit, p.location].filter(Boolean).join(' · ')}
        </p>
        <div className="flex items-center gap-1.5 flex-wrap">
          <OccupancyBadge occupancy={p.occupancy} />
          {stats && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-0.5 text-[9px] text-vault-text-muted">
                <ShieldCheck size={8} className="text-gold-500" /> {stats.assets}
              </span>
              {stats.snags > 0 && (
                <span className="inline-flex items-center gap-0.5 text-[9px] text-red-400 font-bold">
                  <Hammer size={8} /> {stats.snags}
                </span>
              )}
              <span className="inline-flex items-center gap-0.5 text-[9px] text-vault-text-muted">
                <FolderLock size={8} className="text-gold-500" /> {stats.docs}
              </span>
            </div>
          )}
        </div>
      </div>
    </button>
  )
}

// ─── Map View ────────────────────────────────────────────────────────────────
// Uses react-leaflet dynamically imported to avoid SSR issues
function PropertyMap({ properties, activeId, onSelect }: {
  properties: Property[]
  activeId: string | null
  onSelect: (id: string) => void
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletRef = useRef<ReturnType<typeof import('leaflet')['map']> | null>(null)
  const markersRef = useRef<{ marker: L.Marker; id: string }[]>([])

  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return

    // Dynamic import to avoid SSR
    import('leaflet').then((L) => {
      // Fix Leaflet default icon issues with bundlers
      // @ts-expect-error -- _getIconUrl is not in types
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({ iconUrl: '', iconRetinaUrl: '', shadowUrl: '' })

      const propsWithCoords = properties.filter((p) => p.lat && p.lng)
      if (propsWithCoords.length === 0) return

      const center: [number, number] = [
        propsWithCoords.reduce((s, p) => s + (p.lat ?? 0), 0) / propsWithCoords.length,
        propsWithCoords.reduce((s, p) => s + (p.lng ?? 0), 0) / propsWithCoords.length,
      ]

      const map = L.map(mapRef.current!, {
        center,
        zoom: 12,
        zoomControl: false,
        attributionControl: false,
      })
      leafletRef.current = map

      // CartoDB Dark Matter tiles — no API key required
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map)

      // Attribution (small, bottom-right)
      L.control.attribution({ position: 'bottomright', prefix: false })
        .addAttribution('© <a href="https://carto.com/">CARTO</a> © <a href="https://openstreetmap.org">OSM</a>')
        .addTo(map)

      // Add property markers
      propsWithCoords.forEach((p) => {
        const isActive = p.id === activeId
        const meta = OCCUPANCY_META[p.occupancy ?? '']

        const html = `
          <div style="
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            cursor: pointer;
          ">
            <div style="
              background: ${isActive ? '#D4AF37' : '#1C1C1E'};
              border: 2px solid ${isActive ? '#D4AF37' : 'rgba(212,175,55,0.4)'};
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              width: 36px;
              height: 36px;
              box-shadow: 0 2px 12px rgba(0,0,0,0.5);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <span style="transform: rotate(45deg); font-size: 14px; line-height:1;">
                ${meta?.emoji ?? '🏢'}
              </span>
            </div>
            <div style="
              margin-top: 4px;
              background: rgba(13,13,13,0.9);
              border: 1px solid ${isActive ? '#D4AF37' : 'rgba(255,255,255,0.15)'};
              border-radius: 8px;
              padding: 2px 6px;
              white-space: nowrap;
              font-size: 9px;
              font-weight: 700;
              color: ${isActive ? '#D4AF37' : 'rgba(255,255,255,0.7)'};
              font-family: system-ui, sans-serif;
              max-width: 120px;
              overflow: hidden;
              text-overflow: ellipsis;
            ">${p.name}</div>
          </div>
        `

        const icon = L.divIcon({ html, className: '', iconSize: [120, 70], iconAnchor: [18, 36] })
        const marker = L.marker([p.lat!, p.lng!], { icon }).addTo(map)
        marker.on('click', () => onSelect(p.id))
        markersRef.current.push({ marker, id: p.id })
      })

      // Fit all markers in view
      if (propsWithCoords.length > 1) {
        const bounds = L.latLngBounds(propsWithCoords.map((p) => [p.lat!, p.lng!] as [number, number]))
        map.fitBounds(bounds, { padding: [40, 40] })
      }
    })

    return () => {
      if (leafletRef.current) {
        leafletRef.current.remove()
        leafletRef.current = null
        markersRef.current = []
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="relative rounded-2xl overflow-hidden border border-vault-border" style={{ height: 320 }}>
      <div ref={mapRef} className="w-full h-full" />
      {/* Property info cards overlay at bottom */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2 pt-8 pointer-events-none">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {properties.filter((p) => p.lat && p.lng).map((p) => (
            <div
              key={p.id}
              className={cn(
                'flex-shrink-0 rounded-lg px-2 py-1 text-[9px] font-bold border pointer-events-auto cursor-pointer',
                p.id === activeId
                  ? 'bg-gold-500/20 border-gold-500/60 text-gold-500'
                  : 'bg-black/40 border-white/10 text-white/60'
              )}
              onClick={() => onSelect(p.id)}
            >
              {OCCUPANCY_META[p.occupancy ?? '']?.emoji} {p.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function PropertySwitcher({ onClose }: PropertySwitcherProps) {
  const { allProperties, activePropertyId, switchProperty } = useProperty()
  const router = useRouter()
  const [view, setView] = useState<'list' | 'map'>('list')

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 animate-fade-in" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-vault-surface border-t border-vault-border animate-slide-up max-h-[85dvh] overflow-y-auto">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-vault-muted" />
        </div>
        <div className="px-6 pb-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-5 pt-3">
            <div>
              <h3 className="text-base font-bold text-white">Your Properties</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-vault-text-muted">
                  {allProperties.length} Passport{allProperties.length !== 1 ? 's' : ''}
                </p>
                <div className="flex items-center gap-1 text-[9px] text-vault-text-muted">
                  <ShieldCheck size={9} className="text-gold-500" /> Assets{' '}
                  <Hammer size={9} className="text-red-400 ml-1" /> Snags{' '}
                  <FolderLock size={9} className="text-gold-500 ml-1" /> Docs
                </div>
              </div>
            </div>
            {/* List / Map toggle */}
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5 p-0.5 glass rounded-xl">
                <button
                  onClick={() => setView('list')}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all',
                    view === 'list'
                      ? 'bg-gold-500 text-charcoal-300'
                      : 'text-vault-text-muted hover:text-vault-text'
                  )}
                >
                  <LayoutList size={12} /> List
                </button>
                <button
                  onClick={() => setView('map')}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all',
                    view === 'map'
                      ? 'bg-gold-500 text-charcoal-300'
                      : 'text-vault-text-muted hover:text-vault-text'
                  )}
                >
                  <MapIcon size={12} /> Map
                </button>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-xl glass flex items-center justify-center">
                <X size={15} className="text-vault-text-muted" />
              </button>
            </div>
          </div>

          {/* List View */}
          {view === 'list' && (
            <div className="space-y-2 mb-4">
              {allProperties.length === 0 && (
                <div className="text-center py-8 text-vault-text-muted">
                  <span className="text-4xl block mb-2">🏢</span>
                  <p className="text-sm">No properties yet</p>
                </div>
              )}
              {allProperties.map((p) => (
                <PropertyCard
                  key={p.id}
                  p={p}
                  isActive={p.id === activePropertyId}
                  onSelect={() => { switchProperty(p.id); onClose() }}
                />
              ))}
            </div>
          )}

          {/* Map View */}
          {view === 'map' && (
            <div className="mb-4">
              <PropertyMap
                properties={allProperties}
                activeId={activePropertyId}
                onSelect={(id) => { switchProperty(id); onClose() }}
              />
              <p className="text-[10px] text-vault-text-muted text-center mt-2">
                Tap a pin to switch to that property
              </p>
            </div>
          )}

          <button
            onClick={() => { onClose(); router.push('/onboarding?new=1') }}
            className="w-full py-3.5 rounded-2xl glass gold-border text-sm font-bold text-gold-500 flex items-center justify-center gap-2 hover:bg-gold-500/10 transition-colors"
          >
            <Plus size={16} /> Add New Property
          </button>
        </div>
      </div>

      {/* Leaflet CSS — injected globally once */}
      <style>{`
        .leaflet-container { background: #0D0D0D !important; }
        .leaflet-control-attribution {
          background: rgba(13,13,13,0.7) !important;
          color: rgba(255,255,255,0.3) !important;
          font-size: 8px !important;
        }
        .leaflet-control-attribution a { color: rgba(212,175,55,0.6) !important; }
      `}</style>
    </>
  )
}
