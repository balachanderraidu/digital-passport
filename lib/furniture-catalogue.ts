/**
 * Furniture Catalogue
 * Defines default furniture items for each room type.
 * Positions are % of room dimensions (0-100).
 */

export type FurnitureStyle = 'minimal' | 'modern' | 'classic'

export interface FurnitureDef {
  type: string
  label: string
  emoji: string
  /** default dimensions as % of room */
  defaultW: number
  defaultH: number
  /** default position within room (% of room) */
  defaultX: number
  defaultY: number
  defaultColor: string
}

export const ROOM_FURNITURE: Record<string, FurnitureDef[]> = {
  'Living Room': [
    { type: 'sofa',  label: 'Sofa',      emoji: '🛋️', defaultX: 10, defaultY: 10, defaultW: 55, defaultH: 22, defaultColor: '#4a6fa5' },
    { type: 'tv',    label: 'TV Unit',   emoji: '📺', defaultX: 35, defaultY: 75, defaultW: 30, defaultH: 12, defaultColor: '#2c2c2c' },
    { type: 'table', label: 'Table',     emoji: '🪑', defaultX: 30, defaultY: 35, defaultW: 20, defaultH: 18, defaultColor: '#8B6F4E' },
  ],
  'Kitchen': [
    { type: 'hob',    label: 'Hob',      emoji: '🍳', defaultX: 5,  defaultY: 5,  defaultW: 40, defaultH: 20, defaultColor: '#555' },
    { type: 'fridge', label: 'Fridge',   emoji: '🧊', defaultX: 70, defaultY: 5,  defaultW: 18, defaultH: 28, defaultColor: '#ccc' },
    { type: 'sink',   label: 'Sink',     emoji: '🚿', defaultX: 50, defaultY: 5,  defaultW: 18, defaultH: 18, defaultColor: '#a0aec0' },
  ],
  'Master Bedroom': [
    { type: 'bed',      label: 'Bed',      emoji: '🛏️', defaultX: 15, defaultY: 20, defaultW: 55, defaultH: 50, defaultColor: '#7c6b8a' },
    { type: 'wardrobe', label: 'Wardrobe', emoji: '🚪', defaultX: 5,  defaultY: 5,  defaultW: 20, defaultH: 40, defaultColor: '#8B6F4E' },
  ],
  'Bedroom 2': [
    { type: 'bed',      label: 'Bed',      emoji: '🛏️', defaultX: 15, defaultY: 20, defaultW: 55, defaultH: 50, defaultColor: '#5a7a8a' },
    { type: 'wardrobe', label: 'Wardrobe', emoji: '🚪', defaultX: 5,  defaultY: 5,  defaultW: 20, defaultH: 40, defaultColor: '#8B6F4E' },
  ],
  'Bedroom 3': [
    { type: 'bed',  label: 'Bed',  emoji: '🛏️', defaultX: 15, defaultY: 20, defaultW: 55, defaultH: 50, defaultColor: '#5a8a7a' },
    { type: 'desk', label: 'Desk', emoji: '💻', defaultX: 5,  defaultY: 5,  defaultW: 40, defaultH: 20, defaultColor: '#8B6F4E' },
  ],
  'Study': [
    { type: 'desk',  label: 'Desk',    emoji: '💻', defaultX: 5,  defaultY: 5,  defaultW: 60, defaultH: 25, defaultColor: '#8B6F4E' },
    { type: 'chair', label: 'Chair',   emoji: '🪑', defaultX: 20, defaultY: 40, defaultW: 22, defaultH: 25, defaultColor: '#555' },
  ],
  'Dining Room': [
    { type: 'table', label: 'Dining Table', emoji: '🍽️', defaultX: 15, defaultY: 20, defaultW: 60, defaultH: 50, defaultColor: '#8B6F4E' },
  ],
  'Bathroom': [
    { type: 'toilet', label: 'Toilet',    emoji: '🚽', defaultX: 5,  defaultY: 5,  defaultW: 30, defaultH: 35, defaultColor: '#e2e8f0' },
    { type: 'sink',   label: 'Sink',      emoji: '🚿', defaultX: 5,  defaultY: 55, defaultW: 28, defaultH: 28, defaultColor: '#a0aec0' },
  ],
  'Balcony': [
    { type: 'chair', label: 'Chair', emoji: '🪑', defaultX: 20, defaultY: 20, defaultW: 25, defaultH: 30, defaultColor: '#4a9060' },
  ],
}

export const FURNITURE_COLORS = [
  '#4a6fa5', '#7c6b8a', '#5a8a7a', '#8B6F4E',
  '#e8a838', '#c0392b', '#2c3e50', '#95a5a6',
]

/** Convert a FurnitureDef position (% of room) into canvas % coords */
export function furnitureToCanvas(
  def: FurnitureDef,
  room: { x: number; y: number; w: number; h: number },
  canvasW: number,
  canvasH: number
) {
  const rx = (room.x / 100) * canvasW
  const ry = (room.y / 100) * canvasH
  const rw = (room.w / 100) * canvasW
  const rh = (room.h / 100) * canvasH
  return {
    x: rx + (def.defaultX / 100) * rw,
    y: ry + (def.defaultY / 100) * rh,
    w: (def.defaultW / 100) * rw,
    h: (def.defaultH / 100) * rh,
  }
}
