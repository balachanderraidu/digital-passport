'use client'

import { useState } from 'react'
import { Bell, ChevronRight, Thermometer, Sofa, Monitor, ChefHat, Dumbbell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AssetDrawer } from '@/components/twin/AssetDrawer'

// Demo asset data (replace with Firestore in production)
const DEMO_ASSETS = {
  'ac-living': {
    id: 'ac-living',
    name: 'Daikin 2.0T Inverter AC',
    icon: '❄️',
    zone: 'Living Area',
    purchaseDate: '2023-04-15',
    warrantyExpiry: '2028-04-15',
    efficiency: 'BEE 5 Star',
    model: 'FTKM60TV',
    serial: 'DK-2024-LV-001',
    paintCode: null,
    warrantyStatus: 'active' as const,
    lastService: '2025-10-01',
  },
  'wall-living': {
    id: 'wall-living',
    name: 'Feature Wall — Living Room',
    icon: '🎨',
    zone: 'Living Area',
    purchaseDate: '2023-01-20',
    warrantyExpiry: null,
    efficiency: null,
    model: null,
    serial: null,
    paintCode: 'Asian Paints Royale – Morning Glory (N1122)',
    warrantyStatus: 'active' as const,
    lastService: null,
  },
  'tv-unit': {
    id: 'tv-unit',
    name: 'Sony Bravia 75" OLED',
    icon: '📺',
    zone: 'Living Area',
    purchaseDate: '2023-05-10',
    warrantyExpiry: '2026-05-10',
    efficiency: null,
    model: 'XR-75A95L',
    serial: 'SN-TV-LV-005',
    paintCode: null,
    warrantyStatus: 'expiring' as const,
    lastService: null,
  },
  'wardrobe': {
    id: 'wardrobe',
    name: 'Modular Wardrobe — Master',
    icon: '🚪',
    zone: 'Master Bedroom',
    purchaseDate: '2023-02-28',
    warrantyExpiry: '2033-02-28',
    efficiency: null,
    model: 'Spacewood Elite 8×10',
    serial: 'SW-MB-001',
    paintCode: 'Finish: Matte Sand Beige',
    warrantyStatus: 'active' as const,
    lastService: null,
  },
  'kitchen-hob': {
    id: 'kitchen-hob',
    name: 'Elica 4-Burner Hob',
    icon: '🍳',
    zone: 'Kitchen',
    purchaseDate: '2023-03-12',
    warrantyExpiry: '2026-03-12',
    efficiency: null,
    model: 'EHB TF HC 4B DX',
    serial: 'EL-KCH-003',
    paintCode: null,
    warrantyStatus: 'expiring' as const,
    lastService: '2025-01-15',
  },
}

type AssetKey = keyof typeof DEMO_ASSETS

interface HotspotProps {
  id: AssetKey
  label: string
  x: number
  y: number
  icon: React.ReactNode
  status: 'active' | 'expiring' | 'expired'
  onSelect: (id: AssetKey) => void
}

function Hotspot({ id, label, x, y, icon, status, onSelect }: HotspotProps) {
  const colors = {
    active: 'border-green-500/60 bg-green-500/10',
    expiring: 'border-yellow-500/60 bg-yellow-500/10',
    expired: 'border-red-500/60 bg-red-500/10',
  }

  return (
    <button
      onClick={() => onSelect(id)}
      className={cn(
        'absolute flex flex-col items-center gap-1 group',
        'transform -translate-x-1/2 -translate-y-1/2'
      )}
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

export default function DashboardPage() {
  const [selectedId, setSelectedId] = useState<AssetKey | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  function handleSelect(id: AssetKey) {
    setSelectedId(id)
    setDrawerOpen(true)
  }

  const selectedAsset = selectedId ? DEMO_ASSETS[selectedId] : null

  return (
    <div className="min-h-dvh bg-vault-bg">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 bg-gradient-to-b from-vault-surface to-vault-bg">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-vault-text-muted font-medium uppercase tracking-widest mb-1">
              Good Evening ✦
            </p>
            <h1 className="text-2xl font-bold text-white">Oberoi Residences</h1>
            <p className="text-sm text-vault-text-muted mt-0.5">Unit 12B, Tower A • Worli, Mumbai</p>
          </div>
          <button className="relative w-10 h-10 rounded-xl glass gold-border flex items-center justify-center mt-1">
            <Bell size={18} className="text-gold-500" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-gold-500 rounded-full text-[9px] font-bold text-charcoal-300 flex items-center justify-center">
              2
            </span>
          </button>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2.5 mt-5">
          {[
            { label: 'Assets', value: '24', sub: 'tracked' },
            { label: 'Warranties', value: '3', sub: 'expiring soon' },
            { label: 'Snags', value: '2', sub: 'open' },
          ].map((stat) => (
            <div key={stat.label} className="card p-3 text-center">
              <div className="text-xl font-bold gold-text">{stat.value}</div>
              <div className="text-[10px] font-medium text-vault-text-muted mt-0.5">{stat.label}</div>
              <div className="text-[9px] text-vault-muted">{stat.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Floor Plan Section */}
      <div className="px-5 mt-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-white">Interactive Home Twin</h2>
          <button className="flex items-center gap-1 text-xs text-gold-500 font-semibold">
            3D View <ChevronRight size={14} />
          </button>
        </div>

        {/* Isometric floor plan */}
        <div className="relative w-full rounded-2xl overflow-hidden border border-vault-border bg-vault-surface" style={{ height: '320px' }}>
          {/* Isometric grid background */}
          <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="iso-grid" x="0" y="0" width="40" height="23" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
                <line x1="0" y1="0" x2="40" y2="0" stroke="#FFD700" strokeWidth="0.5" />
                <line x1="0" y1="0" x2="0" y2="23" stroke="#FFD700" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#iso-grid)" />
          </svg>

          {/* Room labels */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Room zones */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 320" xmlns="http://www.w3.org/2000/svg">
              {/* Living Area */}
              <rect x="20" y="20" width="220" height="160" rx="12" fill="rgba(255,215,0,0.04)" stroke="rgba(255,215,0,0.15)" strokeWidth="1" strokeDasharray="4 4" />
              <text x="125" y="110" fill="rgba(255,215,0,0.3)" fontSize="11" textAnchor="middle" fontFamily="Space Grotesk" fontWeight="600">LIVING AREA</text>

              {/* Kitchen */}
              <rect x="260" y="20" width="120" height="100" rx="12" fill="rgba(34,197,94,0.03)" stroke="rgba(34,197,94,0.15)" strokeWidth="1" strokeDasharray="4 4" />
              <text x="320" y="75" fill="rgba(34,197,94,0.3)" fontSize="11" textAnchor="middle" fontFamily="Space Grotesk" fontWeight="600">KITCHEN</text>

              {/* Master Bedroom */}
              <rect x="20" y="200" width="180" height="100" rx="12" fill="rgba(99,102,241,0.04)" stroke="rgba(99,102,241,0.15)" strokeWidth="1" strokeDasharray="4 4" />
              <text x="110" y="255" fill="rgba(99,102,241,0.3)" fontSize="11" textAnchor="middle" fontFamily="Space Grotesk" fontWeight="600">MASTER BED</text>

              {/* Bathroom */}
              <rect x="220" y="200" width="160" height="100" rx="12" fill="rgba(59,130,246,0.03)" stroke="rgba(59,130,246,0.15)" strokeWidth="1" strokeDasharray="4 4" />
              <text x="300" y="255" fill="rgba(59,130,246,0.3)" fontSize="11" textAnchor="middle" fontFamily="Space Grotesk" fontWeight="600">STUDY</text>
            </svg>
          </div>

          {/* Interactive hotspots */}
          <Hotspot id="ac-living" label="AC Unit" x={28} y={25} icon="❄️" status={DEMO_ASSETS['ac-living'].warrantyStatus} onSelect={handleSelect} />
          <Hotspot id="tv-unit" label="TV" x={48} y={55} icon="📺" status={DEMO_ASSETS['tv-unit'].warrantyStatus} onSelect={handleSelect} />
          <Hotspot id="wall-living" label="Feature Wall" x={22} y={65} icon="🎨" status="active" onSelect={handleSelect} />
          <Hotspot id="kitchen-hob" label="Hob" x={73} y={32} icon="🍳" status={DEMO_ASSETS['kitchen-hob'].warrantyStatus} onSelect={handleSelect} />
          <Hotspot id="wardrobe" label="Wardrobe" x={32} y={80} icon="🚪" status={DEMO_ASSETS['wardrobe'].warrantyStatus} onSelect={handleSelect} />

          {/* Legend */}
          <div className="absolute bottom-3 right-3 flex gap-3 text-[9px] font-medium">
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Active</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Expiring</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Expired</div>
          </div>
        </div>

        <p className="text-center text-xs text-vault-text-muted mt-2 mb-1">
          Tap any node to view asset details
        </p>
      </div>

      {/* Recent Activity */}
      <div className="px-5 mt-5 pb-4">
        <h2 className="text-sm font-bold text-white mb-3">Recent Activity</h2>
        <div className="space-y-2.5">
          {[
            { icon: '🔧', text: 'AC Service scheduled', sub: '3 days ago', color: 'text-gold-500' },
            { icon: '📄', text: 'Sale Deed uploaded', sub: 'Yesterday', color: 'text-green-400' },
            { icon: '⚠️', text: 'Warranty expiring: Sony Bravia', sub: 'In 48 days', color: 'text-yellow-400' },
          ].map((item) => (
            <div key={item.text} className="card p-3.5 flex items-center gap-3 card-hover">
              <span className="text-xl">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-vault-text truncate">{item.text}</p>
                <p className={cn('text-xs font-medium mt-0.5', item.color)}>{item.sub}</p>
              </div>
              <ChevronRight size={16} className="text-vault-text-muted flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Asset Drawer */}
      {selectedAsset && (
        <AssetDrawer
          asset={selectedAsset}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        />
      )}
    </div>
  )
}
