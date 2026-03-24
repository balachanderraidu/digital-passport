'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Bell, ChevronRight, X, Loader2, Upload, Plus, Hammer, Sparkles, ChevronDown } from 'lucide-react'
import { PWAInstallButton } from '@/components/PWAInstallButton'
import { cn, getWarrantyStatus, getDaysUntil } from '@/lib/utils'
import { AssetDrawer } from '@/components/twin/AssetDrawer'
import { useAuth } from '@/lib/useAuth'
import { useProperty } from '@/lib/useProperty'
import { PropertySwitcher } from '@/components/PropertySwitcher'
import { RoomMinimap } from '@/components/floorplan/RoomMinimap'
import { RoomDetailSheet } from '@/components/floorplan/RoomDetailSheet'
import { PassportModeBadge } from '@/components/PassportModeBadge'
import { PropertyTimeline } from '@/components/PropertyTimeline'
import { PageGuide } from '@/components/PageGuide'
import { AIWalkthroughWidget } from '@/components/tenant/AIWalkthroughWidget'
import { ConstructionTimelineWidget } from '@/components/dashboard/ConstructionTimelineWidget'
import { RenovationEstimatorWidget } from '@/components/dashboard/RenovationEstimatorWidget'
import {
  subscribeDashboardStats,
  subscribeWarrantyAssets,
  subscribeSnags,
  subscribeProperty,
  subscribeEvents,
  type DashboardStats,
  type WarrantyAsset,
  type Snag,
  type Property,
  type AppEvent,
} from '@/lib/firestore'
import {
  useDemoDataHook,
  DEMO_TIMELINE_EVENTS,
} from '@/lib/demo-data'

// Canonical hotspot definitions — positions are fixed layout-wise
const HOTSPOT_DEFS = [
  { key: 'ac-living',    label: 'AC Unit',      x: 28, y: 25, icon: '❄️', zone: 'Living Area' },
  { key: 'tv-unit',      label: 'TV',           x: 48, y: 55, icon: '📺', zone: 'Living Area' },
  { key: 'wall-living',  label: 'Feature Wall', x: 22, y: 65, icon: '🎨', zone: 'Living Area' },
  { key: 'kitchen-hob',  label: 'Hob',          x: 73, y: 32, icon: '🍳', zone: 'Kitchen' },
  { key: 'wardrobe',     label: 'Wardrobe',     x: 32, y: 80, icon: '🚪', zone: 'Master Bedroom' },
]

// Room name → emoji icon for the AI SVG hotspot overlay
const ROOM_ICONS: Record<string, string> = {
  'Living Room':    '🛋️',
  'Kitchen':        '🍳',
  'Master Bedroom': '🛏️',
  'Bedroom 2':      '🛏️',
  'Bedroom 3':      '🛏️',
  'Bathroom':       '🚿',
  'Balcony':        '🌿',
  'Study':          '💻',
  'Dining Room':    '🍽️',
}
function getRoomIcon(name: string) { return ROOM_ICONS[name] ?? '🏠' }

type StatusType = 'active' | 'expiring' | 'expired'

interface HotspotProps {
  label: string
  x: number
  y: number
  icon: string
  status: StatusType
  onSelect: () => void
}

function Hotspot({ label, x, y, icon, status, onSelect }: HotspotProps) {
  const colors: Record<StatusType, string> = {
    active: 'border-green-500/60 bg-green-500/10',
    expiring: 'border-yellow-500/60 bg-yellow-500/10',
    expired: 'border-red-500/60 bg-red-500/10',
  }
  return (
    <button
      onClick={onSelect}
      className="absolute flex flex-col items-center gap-1 group transform -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <div className={cn(
        'w-10 h-10 rounded-xl border flex items-center justify-center text-lg',
        'transition-all duration-200 group-hover:scale-110 group-hover:border-gold-500',
        'shadow-card backdrop-blur-sm',
        colors[status]
      )}>
        {icon}
      </div>
      <span className={cn(
        'text-[9px] font-semibold text-center leading-tight px-1.5 py-0.5 rounded-md',
        'bg-vault-card/90 backdrop-blur-sm border border-vault-border',
        'text-vault-text opacity-80 group-hover:opacity-100',
        'max-w-[60px] whitespace-nowrap overflow-hidden text-ellipsis'
      )}>
        {label}
      </span>
    </button>
  )
}

function getZoneStatus(assets: WarrantyAsset[], zone: string): StatusType {
  const zoneAssets = assets.filter((a) => a.zone === zone && a.warrantyExpiry)
  if (zoneAssets.length === 0) return 'active'
  const statuses = zoneAssets.map((a) => getWarrantyStatus(a.warrantyExpiry))
  if (statuses.includes('expired')) return 'expired'
  if (statuses.includes('expiring')) return 'expiring'
  return 'active'
}

function buildDrawerAsset(hotspot: typeof HOTSPOT_DEFS[0], assets: WarrantyAsset[]) {
  const match = assets.find((a) => a.zone === hotspot.zone) ?? null
  if (!match) return null
  return {
    id: match.id,
    name: match.name,
    icon: match.icon,
    zone: match.zone,
    purchaseDate: match.purchaseDate,
    warrantyExpiry: match.warrantyExpiry ?? '',
    efficiency: null,
    model: match.model,
    serial: match.serialNumber,
    paintCode: null,
    warrantyStatus: getWarrantyStatus(match.warrantyExpiry ?? '') as StatusType,
    lastService: match.nextService,
  }
}

const EVENT_ICONS: Record<string, string> = {
  vault_upload: '📄',
  asset_added: '🛡️',
  snag_opened: '🔨',
  snag_fixed: '✅',
  link_created: '🔗',
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const { activePropertyId, activeProperty, allProperties, switchProperty } = useProperty()
  const [stats, setStats] = useState<DashboardStats>({ assetCount: 0, expiringSoonCount: 0, openSnagCount: 0 })
  const [warrantyAssets, setWarrantyAssets] = useState<WarrantyAsset[]>([])
  const [recentSnags, setRecentSnags] = useState<Snag[]>([])
  const [property, setProperty] = useState<Property | null>(null)
  const [events, setEvents] = useState<AppEvent[]>([])
  const [selectedHotspot, setSelectedHotspot] = useState<typeof HOTSPOT_DEFS[0] | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [showNotif, setShowNotif] = useState(false)
  const [show3D, setShow3D] = useState(false)
  const [showSwitcher, setShowSwitcher] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<any | null>(null)

  const isDemo = (!authLoading && !user) || !!(activePropertyId && activePropertyId.startsWith('p_'))
  const demoContext = useDemoDataHook(activePropertyId)
  const { property: demoProperty, stats: demoStats, snags: demoSnags, assets: demoAssets, events: demoEvents, rooms: demoRooms } = demoContext

  // Demo mode: inject placeholder data
  useEffect(() => {
    if (!isDemo) return
    setStats(demoStats)
    setWarrantyAssets(demoAssets)
    setRecentSnags(demoSnags)
    setProperty(demoProperty)
    setEvents(demoEvents)
  }, [isDemo, activePropertyId, demoProperty])

  // Real user: subscribe to Firestore
  useEffect(() => {
    if (!user) return
    const unsubStats = subscribeDashboardStats(user.uid, setStats, activePropertyId)
    const unsubWarranty = subscribeWarrantyAssets(user.uid, setWarrantyAssets, activePropertyId)
    const unsubSnags = subscribeSnags(user.uid, setRecentSnags, activePropertyId)
    const unsubProperty = subscribeProperty(user.uid, setProperty, activePropertyId)
    const unsubEvents = subscribeEvents(user.uid, setEvents, activePropertyId)
    return () => {
      unsubStats()
      unsubWarranty()
      unsubSnags()
      unsubProperty()
      unsubEvents()
    }
  }, [user, activePropertyId])

  function handleHotspotSelect(hotspot: typeof HOTSPOT_DEFS[0]) {
    setSelectedHotspot(hotspot)
    setDrawerOpen(true)
  }

  const expiringWarranties = warrantyAssets
    .filter((a) => getWarrantyStatus(a.warrantyExpiry) === 'expiring')
    .slice(0, 2)

  const openSnags = recentSnags.filter((s) => s.status === 'open').slice(0, 1)

  const notifItems = [
    ...expiringWarranties.map((a) => ({
      icon: '⚠️',
      title: `${a.name} — Warranty expiring in ${getDaysUntil(a.warrantyExpiry)} days`,
      sub: 'Tap to view',
      accent: 'border-l-yellow-500',
      href: `/warranty/${a.id}`,
    })),
    ...openSnags.map((s) => ({
      icon: '🔨',
      title: s.title,
      sub: `Open · ${s.location}`,
      accent: 'border-l-red-500',
      href: `/snags/${s.id}`,
    })),
  ]

  const selectedAsset = selectedHotspot ? buildDrawerAsset(selectedHotspot, warrantyAssets) : null

  // Greeting
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening'

  // Property display
  const propName = property?.name ?? 'My Residence'
  const propUnit = property ? `${property.unit} · ${property.location}` : 'Set up your property →'
  const isNewUser = !isDemo && stats.assetCount === 0 && !property

  if (authLoading) {
    return (
      <div className="min-h-dvh bg-vault-bg flex items-center justify-center">
        <Loader2 size={28} className="text-gold-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-vault-bg">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 bg-gradient-to-b from-vault-surface to-vault-bg">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-vault-text-muted font-medium uppercase tracking-widest mb-1">
              Good {greeting} ✦
            </p>
            <button
              onClick={() => setShowSwitcher(true)}
              className="flex items-center gap-1.5 group"
            >
              <h1 className="text-2xl font-bold text-white">{propName}</h1>
              {(allProperties.length > 1 || isDemo) && (
                <ChevronDown size={18} className="text-gold-500 group-hover:opacity-80 mt-1" />
              )}
            </button>
            {property || isDemo ? (
              <div className="mt-0.5 flex items-center gap-2 flex-wrap">
                <p className="text-sm text-vault-text-muted">
                  {isDemo
                    ? `${demoProperty.unit} · ${demoProperty.location}`
                    : `${property!.unit} · ${property!.location}`}
                </p>
                <PassportModeBadge occupancy={isDemo ? demoProperty.occupancy : property?.occupancy} />
              </div>
            ) : (
              <Link href="/onboarding" className="text-sm text-gold-500 font-semibold mt-0.5 block">
                Set up your property →
              </Link>
            )}

            {/* Per-property context strip */}
            {isDemo && (() => {
              const occ = demoProperty.occupancy
              if (occ === 'rented') return (
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400">
                    👤 Arjun & Priya Sharma
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400">
                    ₹24,000/mo
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-vault-muted/20 border border-vault-border text-[10px] text-vault-text-muted">
                    🗓 8 months
                  </span>
                </div>
              )
              if (occ === 'renovation') return (
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold-500/10 border border-gold-500/20 text-[10px] font-bold text-gold-400">
                    🏗️ 67% Complete
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-400">
                    Fit-out Stage
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-vault-muted/20 border border-vault-border text-[10px] text-vault-text-muted">
                    📅 Dec 2025
                  </span>
                </div>
              )
              if (occ === 'empty') return (
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-500/10 border border-zinc-500/20 text-[10px] font-bold text-zinc-400">
                    🪟 Bare Shell
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold-500/10 border border-gold-500/20 text-[10px] font-bold text-gold-400">
                    Architect Engaged
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-vault-muted/20 border border-vault-border text-[10px] text-vault-text-muted">
                    Est. ₹42L Reno
                  </span>
                </div>
              )
              // Villa / residing
              return (
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400">
                    🏠 Owner Occupied
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold-500/10 border border-gold-500/20 text-[10px] font-bold text-gold-400">
                    {demoStats.assetCount} Assets
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-vault-muted/20 border border-vault-border text-[10px] text-vault-text-muted">
                    {demoProperty.area?.toLocaleString()} sq ft
                  </span>
                </div>
              )
            })()}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <PWAInstallButton />
            <button
              onClick={() => setShowNotif((v) => !v)}
              className="relative w-10 h-10 rounded-xl glass gold-border flex items-center justify-center"
            >
              <Bell size={18} className="text-gold-500" />
              {notifItems.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-gold-500 rounded-full text-[9px] font-bold text-charcoal-300 flex items-center justify-center">
                  {notifItems.length}
                </span>
              )}
            </button>
          </div>
        </div>
        {showSwitcher && <PropertySwitcher onClose={() => setShowSwitcher(false)} />}

        <div className="mt-6">
          <PageGuide id="dashboard" title="The Command Center">
            Welcome to your Digital Passport. This dashboard provides a live overview of your property's 
            health—tracking total assets, impending warranty expirations, and open construction snags in real time.
          </PageGuide>
        </div>

        {/* Live quick stats */}
        <div className="grid grid-cols-3 gap-2.5 mt-5">
          {[
            { label: 'Assets', value: stats.assetCount, sub: 'tracked', href: '/warranty' },
            { label: 'Warranties', value: stats.expiringSoonCount, sub: 'expiring soon', href: '/warranty', alert: stats.expiringSoonCount > 0 },
            { label: 'Snags', value: stats.openSnagCount, sub: 'open', href: '/snags', alert: stats.openSnagCount > 0 },
          ].map((stat) => (
            <Link key={stat.label} href={stat.href} className="card p-3 text-center hover:border-gold-500/40 transition-all">
              <div className={cn('text-xl font-bold', stat.alert ? 'text-amber-400' : 'gold-text')}>{stat.value}</div>
              <div className="text-[10px] font-medium text-vault-text-muted mt-0.5">{stat.label}</div>
              <div className="text-[9px] text-vault-muted">{stat.sub}</div>
            </Link>
          ))}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          {[
            { label: 'Upload Doc', icon: <Upload size={14} />, href: '/vault?upload=true' },
            { label: 'Add Asset',  icon: <Plus size={14} />, href: '/warranty?add=true' },
            { label: 'Log Snag',   icon: <Hammer size={14} />, href: '/snags/new' },
            { label: 'Home Plan',  icon: <Sparkles size={14} />, href: '/home-plan' },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl glass gold-border text-xs font-bold text-vault-text hover:border-gold-500 hover:text-gold-500 transition-all"
            >
              <span className="text-gold-500">{action.icon}</span>
              {action.label}
            </Link>
          ))}
        </div>

        {isDemo && demoProperty.id === 'p_rental' && (
          <AIWalkthroughWidget />
        )}
        {isDemo && demoProperty.id === 'p_construction' && (
          <ConstructionTimelineWidget />
        )}
        {isDemo && demoProperty.id === 'p_empty' && (
          <RenovationEstimatorWidget />
        )}

        {/* AR Vision Banner */}
        <div className="mt-3">
          <Link
            href="/ar"
            className="w-full flex items-center justify-between p-3.5 rounded-xl border border-gold-500/30 bg-gold-500/5 relative overflow-hidden group transition-all hover:border-gold-500 hover:shadow-gold-glow-sm"
          >
            <div className="absolute inset-0 bg-gold-gradient opacity-0 group-hover:opacity-10 transition-opacity" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-lg bg-gold-500/20 flex items-center justify-center text-xl">
                📱
              </div>
              <div className="flex-1 min-w-0 flex flex-col items-start gap-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-bold text-white">AR Vision</span>
                  <span className="text-[8px] px-1.5 py-0.5 rounded bg-gold-500/20 text-gold-400 font-bold uppercase tracking-widest border border-gold-500/30">Concept</span>
                </div>
                <p className="text-[10px] text-vault-text-muted leading-tight truncate w-full">X-Ray walls & scan furniture instantly</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-vault-text-muted relative z-10 group-hover:text-gold-500 transition-colors flex-shrink-0" />
          </Link>
        </div>
      </div>

      {/* New user CTA */}
      {isNewUser && (
        <div className="px-5 mt-3">
          <Link
            href="/onboarding"
            className="card p-5 border-gold-500/20 bg-gold-500/5 flex items-center gap-4 card-hover block"
          >
            <div className="text-3xl">🏡</div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">Set Up Your Passport</p>
              <p className="text-xs text-vault-text-muted mt-0.5">Add your property, sync receipts, and start tracking assets</p>
            </div>
            <ChevronRight size={18} className="text-gold-500 flex-shrink-0" />
          </Link>
        </div>
      )}

      {/* Floor Plan Section */}
      <div className="px-5 mt-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-white">
            {(isDemo || property?.rooms?.length) ? 'Home Twin' : property?.floorPlanUrl ? 'Floor Plan' : 'Interactive Home Twin'}
          </h2>
          <Link href="/home-plan" className="flex items-center gap-1 text-xs text-gold-500 font-semibold">
            {isDemo || property?.rooms?.length ? 'Edit Plan' : 'Set Up'} <ChevronRight size={14} />
          </Link>
        </div>

        {isDemo ? (
          /* Demo mode: SVG room minimap with clickable rooms */
          <>
            <RoomMinimap
              rooms={demoRooms}
              warrantyAssets={warrantyAssets}
              propertyLabel={demoProperty.unitTypeLabel}
              area={demoProperty.area}
              isDemo
              onRoomClick={(r) => setSelectedRoom(r)}
            />
            <RoomDetailSheet
              room={selectedRoom}
              spec={selectedRoom ? demoContext.roomsSpecs[selectedRoom.name] ?? null : null}
              warrantyCount={warrantyAssets.filter((a) => a.zone === selectedRoom?.name || a.zone?.includes(selectedRoom?.name?.split(' ')[0] ?? '')).length}
              onClose={() => setSelectedRoom(null)}
            />
          </>
        ) : property?.floorPlanUrl ? (
          /* Floor plan PNG from brochure */
          <div className="relative w-full rounded-2xl overflow-hidden border border-vault-border bg-vault-surface">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={property.floorPlanUrl}
              alt={`${property.unitTypeLabel ?? property.floorPlanType} floor plan`}
              className="w-full object-contain"
              style={{ maxHeight: '280px' }}
              loading="lazy"
            />
            {/* Room hotspots from bounding boxes */}
            {(property.rooms ?? []).map((room) => {
              const cx = room.x + room.w / 2
              const cy = room.y + room.h / 2
              const status = getZoneStatus(warrantyAssets, room.name)
              const colors: Record<string, string> = {
                active: 'border-green-500/60 bg-green-500/10',
                expiring: 'border-yellow-500/60 bg-yellow-500/10',
                expired: 'border-red-500/60 bg-red-500/10',
              }
              return (
                <button
                  key={room.name}
                  onClick={() => handleHotspotSelect({ key: room.name, label: room.name, x: cx, y: cy, icon: getRoomIcon(room.name), zone: room.name })}
                  className="absolute flex flex-col items-center gap-0.5 group transform -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${cx}%`, top: `${cy}%` }}
                >
                  <div className={cn('w-8 h-8 rounded-xl border flex items-center justify-center text-sm transition-all group-hover:scale-110 group-hover:border-gold-500 shadow-card backdrop-blur-sm', colors[status] ?? colors.active)}>
                    {getRoomIcon(room.name)}
                  </div>
                </button>
              )
            })}
            <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-vault-card/90 border border-vault-border backdrop-blur-sm">
              <p className="text-[10px] font-bold text-gold-500">{property.unitTypeLabel ?? property.floorPlanType}</p>
              <p className="text-[9px] text-vault-text-muted">{(property.area ?? 0).toLocaleString()} sq ft</p>
            </div>
          </div>
        ) : (
          /* No floor plan — generic wireframe with static hotspots */
          <div className="relative w-full rounded-2xl overflow-hidden border border-vault-border bg-vault-surface" style={{ height: '260px' }}>
            <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="iso-grid" x="0" y="0" width="40" height="23" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
                  <line x1="0" y1="0" x2="40" y2="0" stroke="#FFD700" strokeWidth="0.5" />
                  <line x1="0" y1="0" x2="0" y2="23" stroke="#FFD700" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#iso-grid)" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 260" xmlns="http://www.w3.org/2000/svg">
                <rect x="20" y="20" width="180" height="120" rx="10" fill="rgba(255,215,0,0.04)" stroke="rgba(255,215,0,0.15)" strokeWidth="1" strokeDasharray="4 4" />
                <text x="110" y="85" fill="rgba(255,215,0,0.3)" fontSize="10" textAnchor="middle" fontFamily="Inter" fontWeight="600">LIVING AREA</text>
                <rect x="220" y="20" width="160" height="85" rx="10" fill="rgba(34,197,94,0.03)" stroke="rgba(34,197,94,0.15)" strokeWidth="1" strokeDasharray="4 4" />
                <text x="300" y="66" fill="rgba(34,197,94,0.3)" fontSize="10" textAnchor="middle" fontFamily="Inter" fontWeight="600">KITCHEN</text>
                <rect x="20" y="155" width="155" height="85" rx="10" fill="rgba(99,102,241,0.04)" stroke="rgba(99,102,241,0.15)" strokeWidth="1" strokeDasharray="4 4" />
                <text x="97" y="200" fill="rgba(99,102,241,0.3)" fontSize="10" textAnchor="middle" fontFamily="Inter" fontWeight="600">MASTER BED</text>
                <rect x="195" y="155" width="185" height="85" rx="10" fill="rgba(59,130,246,0.03)" stroke="rgba(59,130,246,0.15)" strokeWidth="1" strokeDasharray="4 4" />
                <text x="287" y="200" fill="rgba(59,130,246,0.3)" fontSize="10" textAnchor="middle" fontFamily="Inter" fontWeight="600">BEDROOM</text>
              </svg>
            </div>
            {HOTSPOT_DEFS.map((h) => (
              <Hotspot key={h.key} label={h.label} x={h.x} y={h.y} icon={h.icon} status={getZoneStatus(warrantyAssets, h.zone)} onSelect={() => handleHotspotSelect(h)} />
            ))}
            <p className="absolute bottom-3 left-0 right-0 text-center text-xs text-vault-text-muted">Tap any node to view asset details</p>
          </div>
        )}
      </div>



      {/* Open Snags */}
      <div className="px-5 mt-4">
        <h2 className="text-sm font-bold text-white mb-3">Open Snags</h2>
        {recentSnags.filter((s) => s.status === 'open').length === 0 ? (
          <div className="text-center py-6 text-vault-text-muted">
            <span className="text-3xl block mb-2">✅</span>
            <p className="text-sm font-medium">All snags resolved</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentSnags.filter((s) => s.status === 'open').slice(0, 3).map((snag) => (
              <Link key={snag.id} href={`/snags/${snag.id}`} className="card p-3.5 flex items-center gap-3 card-hover block">
                <div className="w-12 h-12 rounded-xl bg-vault-muted/50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {snag.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={snag.photoUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl">🔨</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-vault-text truncate">{snag.title}</p>
                  <p className="text-xs font-medium mt-0.5 text-red-400">{snag.location} · Open</p>
                </div>
                <ChevronRight size={16} className="text-vault-text-muted flex-shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Expiring Warranties */}
      {expiringWarranties.length > 0 && (
        <div className="px-5 mt-5">
          <h2 className="text-sm font-bold text-white mb-3">Expiring Warranties</h2>
          <div className="space-y-2.5">
            {expiringWarranties.map((asset) => (
              <Link key={asset.id} href={`/warranty/${asset.id}`} className="card p-3.5 flex items-center gap-3 card-hover block">
                <span className="text-xl">{asset.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-vault-text truncate">{asset.name}</p>
                  <p className="text-xs font-medium mt-0.5 text-yellow-400">Expiring in {getDaysUntil(asset.warrantyExpiry)} days</p>
                </div>
                <ChevronRight size={16} className="text-vault-text-muted flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Property Timeline / Activity */}
      <div className="px-5 mt-5 pb-28">
        <h2 className="text-sm font-bold text-white mb-3">Property Timeline</h2>
        {isDemo ? (
          <PropertyTimeline events={demoContext.timeline || DEMO_TIMELINE_EVENTS} />
        ) : events.length > 0 ? (
          <div className="space-y-2">
            {events.slice(0, 5).map((event) => (
              <div key={event.id} className="card p-3.5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-vault-muted/40 flex items-center justify-center flex-shrink-0 text-lg">
                  {event.icon || EVENT_ICONS[event.type] || '📌'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-vault-text truncate">{event.title}</p>
                  <p className="text-[10px] text-vault-text-muted mt-0.5">{event.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-vault-text-muted">
            <p className="text-sm">No activity yet</p>
          </div>
        )}
      </div>

      {events.length === 0 && expiringWarranties.length === 0 && isDemo && (
        <div className="pb-8" />
      )}

      {/* AI Assistant shortcut fab */}
      <Link
        href="/assistant"
        className="fixed right-5 bottom-24 w-14 h-14 rounded-2xl bg-gold-gradient text-charcoal-300 flex items-center justify-center shadow-gold-glow hover:scale-105 transition-all z-40"
        title="Ask AI"
      >
        <Sparkles size={22} />
      </Link>

      {/* Asset Drawer */}
      {selectedAsset && (
        <AssetDrawer
          asset={selectedAsset}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        />
      )}

      {/* Notifications panel */}
      {showNotif && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowNotif(false)} />
          <div className="fixed top-0 inset-x-0 z-50 bg-vault-surface border-b border-vault-border rounded-b-3xl shadow-card px-5 pt-14 pb-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Notifications</h2>
                {notifItems.length > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gold-500 text-charcoal-300">
                    {notifItems.length} new
                  </span>
                )}
              </div>
              <button onClick={() => setShowNotif(false)} className="w-8 h-8 rounded-xl glass flex items-center justify-center">
                <X size={16} className="text-vault-text-muted" />
              </button>
            </div>
            {notifItems.length === 0 ? (
              <p className="text-sm text-vault-text-muted text-center py-4">No new notifications</p>
            ) : (
              <div className="space-y-2">
                {notifItems.map((n) => (
                  <Link
                    key={n.title}
                    href={n.href}
                    onClick={() => setShowNotif(false)}
                    className={cn('flex items-start gap-3 p-3 rounded-xl bg-vault-card/50 border-l-2 border border-vault-border card-hover block', n.accent)}
                  >
                    <span className="text-base flex-shrink-0 mt-0.5">{n.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-vault-text leading-snug">{n.title}</p>
                      <p className="text-[10px] text-vault-text-muted mt-0.5">{n.sub}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
