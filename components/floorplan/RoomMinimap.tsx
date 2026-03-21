/**
 * RoomMinimap — Architectural Floor Plan SVG
 *
 * Renders rooms as an architectural-style floor plan with:
 * - Thick outer boundary walls
 * - Room-coloured fills (subtle)
 * - Clickable rooms that highlight on hover/tap
 * - Warranty status dots
 * - A compass rose and scale bar
 * - "Tap a room" affordance
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { FloorPlanRoom, WarrantyAsset } from '@/lib/firestore'
import { getWarrantyStatus } from '@/lib/utils'

const ROOM_FILL: Record<string, string> = {
  'Living Room':    'rgba(59,130,246,0.10)',
  'Kitchen':        'rgba(234,179,8,0.10)',
  'Master Bedroom': 'rgba(168,85,247,0.10)',
  'Bedroom 2':      'rgba(236,72,153,0.10)',
  'Bedroom 3':      'rgba(244,114,182,0.08)',
  'Bathroom':       'rgba(20,184,166,0.10)',
  'Balcony':        'rgba(34,197,94,0.10)',
  'Study':          'rgba(249,115,22,0.10)',
  'Dining Room':    'rgba(239,68,68,0.08)',
}

const ROOM_FILL_SELECTED: Record<string, string> = {
  'Living Room':    'rgba(59,130,246,0.28)',
  'Kitchen':        'rgba(234,179,8,0.28)',
  'Master Bedroom': 'rgba(168,85,247,0.28)',
  'Bedroom 2':      'rgba(236,72,153,0.28)',
  'Bedroom 3':      'rgba(244,114,182,0.22)',
  'Bathroom':       'rgba(20,184,166,0.28)',
  'Balcony':        'rgba(34,197,94,0.28)',
  'Study':          'rgba(249,115,22,0.28)',
  'Dining Room':    'rgba(239,68,68,0.22)',
}

const ROOM_STROKE: Record<string, string> = {
  'Living Room':    'rgba(59,130,246,0.6)',
  'Kitchen':        'rgba(234,179,8,0.6)',
  'Master Bedroom': 'rgba(168,85,247,0.6)',
  'Bedroom 2':      'rgba(236,72,153,0.6)',
  'Bedroom 3':      'rgba(244,114,182,0.5)',
  'Bathroom':       'rgba(20,184,166,0.6)',
  'Balcony':        'rgba(34,197,94,0.6)',
  'Study':          'rgba(249,115,22,0.6)',
  'Dining Room':    'rgba(239,68,68,0.5)',
}

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

const ROOM_ABBR: Record<string, string> = {
  'Living Room':    'LIVING',
  'Dining Room':    'DINING',
  'Kitchen':        'KITCHEN',
  'Balcony':        'BALCONY',
  'Master Bedroom': 'MASTER BED',
  'Bedroom 2':      'BED 2',
  'Bedroom 3':      'BED 3',
  'Bathroom':       'BATH',
  'Study':          'STUDY',
}

type StatusBubble = 'active' | 'expiring' | 'expired' | 'none'

function getRoomStatus(name: string, assets: WarrantyAsset[]): StatusBubble {
  // Bathrooms share same name — check any
  const zoneAssets = assets.filter((a) => a.zone === name && a.warrantyExpiry)
  if (zoneAssets.length === 0) return 'none'
  const statuses = zoneAssets.map((a) => getWarrantyStatus(a.warrantyExpiry))
  if (statuses.includes('expired')) return 'expired'
  if (statuses.includes('expiring')) return 'expiring'
  return 'active'
}

const BUBBLE_COLOR: Record<StatusBubble, string> = {
  active:   '#22c55e',
  expiring: '#eab308',
  expired:  '#ef4444',
  none:     'transparent',
}

interface Props {
  rooms: FloorPlanRoom[]
  warrantyAssets?: WarrantyAsset[]
  propertyLabel?: string
  area?: number
  isDemo?: boolean
  onRoomClick?: (room: FloorPlanRoom) => void
}

export function RoomMinimap({
  rooms,
  warrantyAssets = [],
  propertyLabel,
  area,
  isDemo,
  onRoomClick,
}: Props) {
  const VW = 420
  const VH = 300
  const [hovered, setHovered] = useState<string | null>(null)

  // Build outer boundary (bounding box of all rooms + 2% padding)
  const minX = Math.min(...rooms.map(r => r.x))
  const minY = Math.min(...rooms.map(r => r.y))
  const maxX = Math.max(...rooms.map(r => r.x + r.w))
  const maxY = Math.max(...rooms.map(r => r.y + r.h))

  const bx = ((minX - 0.5) / 100) * VW
  const by = ((minY - 0.5) / 100) * VH
  const bw = ((maxX - minX + 1) / 100) * VW
  const bh = ((maxY - minY + 1) / 100) * VH

  return (
    <div className="rounded-2xl overflow-hidden border border-vault-border bg-[#0a0d12]">
      {/* Tap hint */}
      {onRoomClick && (
        <div className="flex items-center justify-center gap-1.5 pt-2 pb-0">
          <span className="text-[9px] font-semibold text-vault-text-muted">
            👆 Tap a room to explore details
          </span>
        </div>
      )}

      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        className="w-full"
        style={{ display: 'block' }}
      >
        <defs>
          {/* Cross-hatch background like blueprint paper */}
          <pattern id="bp-grid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,215,0,0.035)" strokeWidth="0.6" />
          </pattern>
          {/* Outer wall drop shadow */}
          <filter id="wall-shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.5)" />
          </filter>
        </defs>

        {/* Blueprint grid background */}
        <rect width={VW} height={VH} fill="url(#bp-grid)" />

        {/* Outer building boundary — thick wall */}
        <rect
          x={bx} y={by} width={bw} height={bh}
          fill="rgba(255,255,255,0.02)"
          stroke="rgba(255,215,0,0.35)"
          strokeWidth={3}
          rx={2}
          filter="url(#wall-shadow)"
        />

        {/* Rooms */}
        {rooms.map((room, idx) => {
          const rx = (room.x / 100) * VW
          const ry = (room.y / 100) * VH
          const rw = (room.w / 100) * VW
          const rh = (room.h / 100) * VH
          const cx = rx + rw / 2
          const cy = ry + rh / 2
          const status = getRoomStatus(room.name, warrantyAssets)
          const isSelected = hovered === `${room.name}-${idx}`
          const fill = isSelected
            ? (ROOM_FILL_SELECTED[room.name] ?? 'rgba(255,255,255,0.14)')
            : (ROOM_FILL[room.name] ?? 'rgba(255,255,255,0.04)')
          const stroke = ROOM_STROKE[room.name] ?? 'rgba(255,255,255,0.25)'
          const icon = ROOM_ICONS[room.name] ?? '🏠'
          const abbr = ROOM_ABBR[room.name] ?? room.name.toUpperCase()
          const labelSize = Math.max(5.5, Math.min(rw / 6.5, 9))
          const iconSize = Math.max(8, Math.min(Math.min(rw, rh) * 0.38, 18))

          return (
            <g
              key={`${room.name}-${idx}`}
              onClick={() => onRoomClick?.(room)}
              onMouseEnter={() => setHovered(`${room.name}-${idx}`)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: onRoomClick ? 'pointer' : 'default' }}
            >
              {/* Room fill */}
              <rect
                x={rx + 0.5} y={ry + 0.5}
                width={rw - 1} height={rh - 1}
                fill={fill}
                stroke={stroke}
                strokeWidth={isSelected ? 1.5 : 0.75}
                rx={1.5}
                style={{ transition: 'fill 0.15s, stroke-width 0.15s' }}
              />

              {/* Room label (top-left, all-caps) */}
              {rw > 28 && rh > 18 && (
                <text
                  x={rx + 3.5} y={ry + labelSize + 2.5}
                  fontSize={labelSize}
                  fill={isSelected ? stroke : 'rgba(255,255,255,0.38)'}
                  fontFamily="Inter, ui-monospace, system-ui, sans-serif"
                  fontWeight="700"
                  letterSpacing="0.04em"
                  style={{ transition: 'fill 0.15s' }}
                >
                  {abbr}
                </text>
              )}

              {/* Centred emoji icon */}
              {rw > 35 && rh > 28 && (
                <text
                  x={cx} y={cy + iconSize * 0.32}
                  fontSize={iconSize}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  opacity={isSelected ? 1 : 0.65}
                  style={{ transition: 'opacity 0.15s' }}
                >
                  {icon}
                </text>
              )}

              {/* Warranty status dot */}
              {status !== 'none' && (
                <circle
                  cx={rx + rw - 5.5} cy={ry + 5.5}
                  r={4}
                  fill={BUBBLE_COLOR[status]}
                  opacity={0.92}
                  stroke="rgba(0,0,0,0.6)"
                  strokeWidth={0.8}
                />
              )}

              {/* Hover ring */}
              {isSelected && (
                <rect
                  x={rx + 0.5} y={ry + 0.5}
                  width={rw - 1} height={rh - 1}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={2.5}
                  strokeDasharray="4 3"
                  rx={1.5}
                  opacity={0.7}
                />
              )}
            </g>
          )
        })}

        {/* Compass rose — bottom right */}
        <g transform={`translate(${VW - 24}, ${VH - 24})`}>
          <circle r="10" fill="rgba(0,0,0,0.4)" stroke="rgba(255,215,0,0.2)" strokeWidth="0.8" />
          <text x="0" y="-4" fontSize="5.5" textAnchor="middle" fill="rgba(255,215,0,0.7)" fontWeight="700">N</text>
          <line x1="0" y1="-3" x2="0" y2="2" stroke="rgba(255,215,0,0.7)" strokeWidth="1" />
        </g>

        {/* Scale bar — bottom left */}
        <g transform={`translate(8, ${VH - 10})`}>
          <line x1="0" y1="0" x2="30" y2="0" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
          <line x1="0" y1="-3" x2="0" y2="0" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
          <line x1="30" y1="-3" x2="30" y2="0" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
          <text x="15" y="-4" fontSize="5" textAnchor="middle" fill="rgba(255,255,255,0.3)">~5m</text>
        </g>
      </svg>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-vault-border flex items-center justify-between bg-[#0a0d12]">
        <div>
          {propertyLabel && (
            <p className="text-[10px] font-bold text-gold-500">{propertyLabel}</p>
          )}
          <p className="text-[9px] text-vault-text-muted">
            {area?.toLocaleString()} sq ft
            {warrantyAssets.length > 0 && (
              <> · <span className="text-vault-text">{warrantyAssets.length} assets tracked</span></>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Legend */}
          <div className="flex items-center gap-1.5">
            <span className="text-[8px] text-vault-text-muted flex items-center gap-0.5">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> OK
            </span>
            <span className="text-[8px] text-vault-text-muted flex items-center gap-0.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Expiring
            </span>
            <span className="text-[8px] text-vault-text-muted flex items-center gap-0.5">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Expired
            </span>
          </div>
          {isDemo && (
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-gold-500/10 text-gold-500 font-semibold border border-gold-500/20">
              Demo
            </span>
          )}
          <Link href="/home-plan" className="text-[10px] font-bold text-gold-500 hover:underline">
            Edit Plan →
          </Link>
        </div>
      </div>
    </div>
  )
}
