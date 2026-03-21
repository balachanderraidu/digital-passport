'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import type { KonvaEventObject } from 'konva/lib/Node'
import { v4 as uuidv4 } from 'uuid'
import { type FloorPlanRoom, type HomePlanItem } from '@/lib/firestore'
import { ROOM_FURNITURE, furnitureToCanvas } from '@/lib/furniture-catalogue'

// Konva is canvas-only — dynamic import with ssr:false required in Next.js
const Stage  = dynamic(() => import('react-konva').then(m => m.Stage),  { ssr: false })
const Layer  = dynamic(() => import('react-konva').then(m => m.Layer),  { ssr: false })
const Rect   = dynamic(() => import('react-konva').then(m => m.Rect),   { ssr: false })
const Text   = dynamic(() => import('react-konva').then(m => m.Text),   { ssr: false })
const Group  = dynamic(() => import('react-konva').then(m => m.Group),  { ssr: false })
const KImage = dynamic(() => import('react-konva').then(m => m.Image),  { ssr: false })

const ROOM_FILL: Record<string, string> = {
  'Living Room':    'rgba(59,130,246,0.12)',
  'Kitchen':        'rgba(234,179,8,0.12)',
  'Master Bedroom': 'rgba(168,85,247,0.12)',
  'Bedroom 2':      'rgba(236,72,153,0.12)',
  'Bedroom 3':      'rgba(244,114,182,0.12)',
  'Bathroom':       'rgba(20,184,166,0.12)',
  'Balcony':        'rgba(34,197,94,0.12)',
  'Study':          'rgba(249,115,22,0.12)',
  'Dining Room':    'rgba(239,68,68,0.12)',
}

function seedItems(rooms: FloorPlanRoom[]): HomePlanItem[] {
  return rooms.flatMap((room) => {
    const defs = ROOM_FURNITURE[room.name] ?? []
    return defs.map((def) => {
      const { x, y, w, h } = furnitureToCanvas(def, room, 100, 100)
      return {
        id: uuidv4(),
        type: def.type,
        roomName: room.name,
        x: room.x + (x / 100) * room.w,
        y: room.y + (y / 100) * room.h,
        w: (w / 100) * room.w,
        h: (h / 100) * room.h,
        rotation: 0,
        color: def.defaultColor,
        style: 'modern' as const,
        label: def.label,
      }
    })
  })
}

export interface FloorPlanCanvasProps {
  rooms: FloorPlanRoom[]
  floorPlanUrl?: string         // background reference image
  initialItems?: HomePlanItem[]
  mode: 'edit' | 'view'
  totalArea?: number
  onItemsChange?: (items: HomePlanItem[]) => void
  onRoomSelect?: (room: FloorPlanRoom | null) => void
  onItemSelect?: (item: HomePlanItem | null) => void
}

export function FloorPlanCanvas({
  rooms,
  floorPlanUrl,
  initialItems,
  mode,
  onItemsChange,
  onRoomSelect,
  onItemSelect,
}: FloorPlanCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 360, h: 270 })
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null)
  const [items, setItems] = useState<HomePlanItem[]>(() =>
    initialItems && initialItems.length > 0 ? initialItems : seedItems(rooms)
  )
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)

  // Responsive canvas
  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth
        setSize({ w, h: Math.round(w * 0.72) })
      }
    }
    update()
    const ro = new ResizeObserver(update)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  // Load background floor plan image
  useEffect(() => {
    if (!floorPlanUrl) return
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.src = floorPlanUrl
    img.onload = () => setBgImage(img)
  }, [floorPlanUrl])

  const pushItems = (next: HomePlanItem[]) => {
    setItems(next)
    onItemsChange?.(next)
  }

  /** Bring dragged item to top of render stack */
  const bringToFront = (id: string) => {
    setItems((prev) => {
      const idx = prev.findIndex((it) => it.id === id)
      if (idx < 0 || idx === prev.length - 1) return prev
      const next = [...prev]
      const [item] = next.splice(idx, 1)
      next.push(item)
      return next
    })
  }

  const handleDragEnd = (id: string, e: KonvaEventObject<DragEvent>) => {
    if (mode !== 'edit') return
    const xPct = (e.target.x() / size.w) * 100
    const yPct = (e.target.y() / size.h) * 100
    pushItems(items.map((it) => it.id === id ? { ...it, x: xPct, y: yPct } : it))
  }

  const handleItemClick = (item: HomePlanItem, e: KonvaEventObject<MouseEvent | Event>) => {
    e.cancelBubble = true
    setSelectedItemId(item.id)
    onItemSelect?.(item)
    onRoomSelect?.(null)
  }

  const handleRoomClick = (room: FloorPlanRoom, e: KonvaEventObject<MouseEvent | Event>) => {
    e.cancelBubble = true
    setSelectedItemId(null)
    onItemSelect?.(null)
    onRoomSelect?.(room)
  }

  const handleStageClick = () => {
    setSelectedItemId(null)
    onItemSelect?.(null)
    onRoomSelect?.(null)
  }

  return (
    <div ref={containerRef} className="w-full touch-none select-none">
      <Stage
        width={size.w}
        height={size.h}
        onClick={handleStageClick}
        onTap={handleStageClick}
      >
        {/* 0. Background image layer */}
        {bgImage && (
          <Layer>
            <KImage
              image={bgImage}
              x={0} y={0}
              width={size.w} height={size.h}
              opacity={0.3}
            />
          </Layer>
        )}

        {/* 1. Room layer */}
        <Layer>
          {rooms.map((room) => {
            const rx = (room.x / 100) * size.w
            const ry = (room.y / 100) * size.h
            const rw = (room.w / 100) * size.w
            const rh = (room.h / 100) * size.h
            return (
              <Group
                key={room.name}
                onClick={(e) => handleRoomClick(room, e)}
                onTap={(e) => handleRoomClick(room, e)}
              >
                <Rect
                  x={rx} y={ry} width={rw} height={rh}
                  fill={ROOM_FILL[room.name] ?? 'rgba(255,255,255,0.06)'}
                  stroke="rgba(255,215,0,0.3)"
                  strokeWidth={1}
                  cornerRadius={2}
                />
                <Text
                  x={rx + 4} y={ry + 4}
                  text={room.name}
                  fontSize={Math.max(7, Math.min(rw / 7, 12))}
                  fill="rgba(255,255,255,0.5)"
                  fontFamily="Inter, sans-serif"
                  listening={false}
                />
              </Group>
            )
          })}
        </Layer>

        {/* 2. Furniture layer — draggable */}
        <Layer>
          {items.map((item) => {
            const ix = (item.x / 100) * size.w
            const iy = (item.y / 100) * size.h
            const iw = Math.max(12, (item.w / 100) * size.w)
            const ih = Math.max(10, (item.h / 100) * size.h)
            const isSelected = item.id === selectedItemId

            return (
              <Group
                key={item.id}
                x={ix} y={iy}
                draggable={mode === 'edit'}
                onDragStart={() => bringToFront(item.id)}
                onDragEnd={(e) => handleDragEnd(item.id, e)}
                onClick={(e) => handleItemClick(item, e)}
                onTap={(e) => handleItemClick(item, e)}
              >
                <Rect
                  width={iw} height={ih}
                  fill={item.color}
                  opacity={0.88}
                  cornerRadius={item.style === 'modern' ? 4 : item.style === 'classic' ? 0 : 2}
                  stroke={isSelected ? '#f59e0b' : 'rgba(255,255,255,0.15)'}
                  strokeWidth={isSelected ? 2 : 0.5}
                  shadowColor={isSelected ? '#f59e0b' : undefined}
                  shadowBlur={isSelected ? 8 : 0}
                />
                <Text
                  text={item.label ?? item.type}
                  fontSize={Math.max(6, Math.min(iw / 5, 9))}
                  fill="rgba(255,255,255,0.85)"
                  width={iw}
                  align="center"
                  y={ih / 2 - 4}
                  fontFamily="Inter, sans-serif"
                  listening={false}
                />
              </Group>
            )
          })}
        </Layer>
      </Stage>
    </div>
  )
}
