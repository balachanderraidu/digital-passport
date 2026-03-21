/**
 * Demo Mode Data
 *
 * All placeholder data for the unauthenticated demo experience.
 * Every page checks `user === null` and falls back to these constants.
 */

import { Timestamp } from 'firebase/firestore'
import type {
  Property, FloorPlanRoom, HomePlanItem,
  WarrantyAsset, VaultDoc, Snag, AppEvent, DashboardStats,
} from './firestore'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ts = (daysAgo: number): Timestamp =>
  Timestamp.fromDate(new Date(Date.now() - daysAgo * 86_400_000))

const isoDate = (daysFromNow: number): string => {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  return d.toISOString().split('T')[0]
}

// ─── Property ─────────────────────────────────────────────────────────────────

export const DEMO_PROPERTY: Property = {
  id: 'demo',
  name: 'Oriana by Cybercity',
  unit: '1202, Tower 1',
  area: 2059,
  floorPlanType: '3BHK',
  location: 'HITEC City, Hyderabad',
  gmailLinked: false,
  projectId: 'demo-project',
  unitTypeId: '3bhk-east',
  unitTypeLabel: '3BHK East',
  occupancy: 'residing',   // Passive mode
  createdAt: ts(30),
}

/** Active mode variant — same property but in renovation/construction phase */
export const DEMO_PROPERTY_ACTIVE: Property = {
  ...DEMO_PROPERTY,
  occupancy: 'renovation',
}

/** Snags for Active (construction) mode — construction-phase defects */
export const DEMO_SNAGS_ACTIVE: Snag[] = [
  {
    id: 'sn-a1',
    title: 'Living room false ceiling uneven',
    location: 'Living Room',
    category: 'False Ceiling',
    urgency: 'high',
    status: 'open',
    photoUrl: null,
    createdAt: ts(2),
    updatedAt: ts(2),
  },
  {
    id: 'sn-a2',
    title: 'Kitchen slab edge not finished',
    location: 'Kitchen',
    category: 'Stonework',
    urgency: 'medium',
    status: 'open',
    photoUrl: null,
    createdAt: ts(3),
    updatedAt: ts(3),
  },
  {
    id: 'sn-a3',
    title: 'Master bedroom flooring chip near door',
    location: 'Master Bedroom',
    category: 'Flooring',
    urgency: 'high',
    status: 'in-progress',
    photoUrl: null,
    createdAt: ts(5),
    updatedAt: ts(1),
  },
  {
    id: 'sn-a4',
    title: 'Bathroom P-trap missing cover',
    location: 'Bathroom',
    category: 'Plumbing',
    urgency: 'high',
    status: 'open',
    photoUrl: null,
    createdAt: ts(4),
    updatedAt: ts(4),
  },
  {
    id: 'sn-a5',
    title: 'Wardrobe frame not flush with wall',
    location: 'Master Bedroom',
    category: 'Carpentry',
    urgency: 'low',
    status: 'open',
    photoUrl: null,
    createdAt: ts(6),
    updatedAt: ts(6),
  },
  {
    id: 'sn-a6',
    title: 'Bedroom 2 window putty incomplete',
    location: 'Bedroom 2',
    category: 'Windows',
    urgency: 'medium',
    status: 'fixed',
    photoUrl: null,
    createdAt: ts(8),
    updatedAt: ts(2),
  },
]

/** Stats for Active mode */
export const DEMO_STATS_ACTIVE: DashboardStats = {
  assetCount: 2,
  expiringSoonCount: 0,
  openSnagCount: DEMO_SNAGS_ACTIVE.filter((s) => s.status === 'open').length,
}

// ─── Floor Plan Rooms (percentage coordinates) ────────────────────────────────
// Layout: realistic 3BHK — living + dining left, kitchen + balcony right,
// master bed bottom-left, 2 beds bottom-right, bathrooms between.

export const DEMO_ROOMS: FloorPlanRoom[] = [
  { name: 'Living Room',    x: 2,  y: 2,  w: 46, h: 33 },
  { name: 'Dining Room',    x: 2,  y: 35, w: 28, h: 22 },
  { name: 'Kitchen',        x: 48, y: 2,  w: 28, h: 28 },
  { name: 'Balcony',        x: 76, y: 2,  w: 22, h: 28 },
  { name: 'Master Bedroom', x: 2,  y: 58, w: 36, h: 40 },
  { name: 'Bathroom',       x: 38, y: 64, w: 14, h: 20 }, // en-suite
  { name: 'Bedroom 2',      x: 52, y: 32, w: 26, h: 32 },
  { name: 'Bedroom 3',      x: 52, y: 64, w: 26, h: 24 },
  { name: 'Bathroom',       x: 38, y: 35, w: 14, h: 22 }, // common
]

// HomePlanItems are seeded automatically by FloorPlanCanvas seedItems(DEMO_ROOMS)
// but we export a typed empty array so pages can pass it cleanly.
export const DEMO_HOME_PLAN: HomePlanItem[] = []

// ─── Room Finishing Specifications ────────────────────────────────────────────

export interface RoomSpec {
  area: number          // sq ft
  flooring: string
  wallFinish: string
  paintColor: string
  ceiling: string
  furniture: string[]
  extras?: string[]
}

export const DEMO_ROOM_SPECS: Record<string, RoomSpec> = {
  'Living Room': {
    area: 312,
    flooring: 'Kajaria Porcelain (800×800 mm), Light Beige',
    wallFinish: 'Asian Paints Premium Emulsion, Matte',
    paintColor: 'Antique White (AP-0234)',
    ceiling: 'Gypsum false ceiling with LED coves, 10 ft height',
    furniture: [
      'L-shaped sofa (3+2 seater, Grey velvet)',
      'Tempered glass coffee table',
      'Samsung 55″ QLED TV on wall mount',
      'Wooden TV unit with storage',
      'Floor-to-ceiling bookshelf (west wall)',
      'Pendant lamp trio',
    ],
    extras: ['1.5T LG Split AC (window right)', 'Zebra blinds on balcony door'],
  },
  'Dining Room': {
    area: 138,
    flooring: 'Kajaria Porcelain (800×800 mm), Light Beige (continuous with Living)',
    wallFinish: 'Asian Paints Premium Emulsion, Matte',
    paintColor: 'Antique White (AP-0234)',
    ceiling: 'Plain POP finish, 10 ft',
    furniture: [
      '6-seater dining table (natural teak)',
      'Upholstered dining chairs ×6 (Olive Green)',
      'Sideboard / buffet unit',
      'Pendant chandelier above table',
    ],
  },
  'Kitchen': {
    area: 130,
    flooring: 'Anti-skid ceramic tile (300×600 mm, Matt Grey)',
    wallFinish: 'Subway glass tile backsplash (Metro White)',
    paintColor: 'Warm White (AP-0101) on exposed wall',
    ceiling: 'Grid false ceiling with exhaust vent, 9.5 ft',
    furniture: [
      'Modular kitchen — L-shape layout (Hafele fittings)',
      'Galaxy Black granite countertop',
      'Samsung 265L double-door refrigerator',
      'LG 28L microwave (built-in shelf)',
      'IFB dishwasher (under-counter)',
      'SS undermount sink with Grohe mixer',
    ],
    extras: ['Chimney — Faber 60cm', 'Hettich soft-close hinges throughout'],
  },
  'Balcony': {
    area: 80,
    flooring: 'Anti-skid vitrified tile (600×600 mm, Terracotta)',
    wallFinish: 'Textured exterior paint (Apex Weatherproof)',
    paintColor: 'Sandstone (AP-9901)',
    ceiling: 'Open / exposed RCC slab, waterproofed',
    furniture: [
      'Teak outdoor bistro set (2 chairs + table)',
      'Modular planter shelf (3 tier)',
      'Hanging macramé planters ×4',
    ],
    extras: ['SS railing (frameless glass panels)', 'Utility area with washing point'],
  },
  'Master Bedroom': {
    area: 208,
    flooring: 'Laminate wood flooring (8mm, Walnut finish)',
    wallFinish: 'Asian Paints Premium Emulsion — feature wall: textured Venetian plaster',
    paintColor: 'Sage Green (AP-5578) feature wall · Warm White rest',
    ceiling: 'Gypsum tray ceiling with hidden LED strip, 10 ft',
    furniture: [
      'King bed frame (upholstered, Dark Charcoal)',
      'Premium pocket-spring mattress (Duroflex)',
      'Matching bedside tables ×2 with USB charging',
      'Walk-in wardrobe (6-door sliding, Italian laminate)',
      'Vanity dresser with oval mirror',
      'Lounge armchair + side table',
    ],
    extras: ['Panasonic 1.5T inverter AC', 'Blackout curtains on motorised track'],
  },
  'Bedroom 2': {
    area: 148,
    flooring: 'Laminate wood flooring (8mm, Ash finish)',
    wallFinish: 'Asian Paints Premium Emulsion, Matte',
    paintColor: 'Powder Blue (AP-3312)',
    ceiling: 'Plain POP finish, 9.5 ft',
    furniture: [
      'Queen bed with hydraulic storage',
      'Foam mattress (SleepyCat)',
      'Wardrobe (4-door sliding, White laminate)',
      'Study desk + ergonomic chair',
      'Overhead shelving',
    ],
    extras: ['Carrier 1T wall AC'],
  },
  'Bedroom 3': {
    area: 110,
    flooring: 'Laminate wood flooring (8mm, Ash finish)',
    wallFinish: 'Asian Paints Premium Emulsion, Matte',
    paintColor: 'Soft Peach (AP-4401)',
    ceiling: 'Plain POP finish, 9.5 ft',
    furniture: [
      'Queen bed with headboard',
      'Foam mattress (Wakefit)',
      '3-door wardrobe',
      'Multi-purpose shelf unit',
    ],
  },
  'Bathroom': {
    area: 56,
    flooring: 'Anti-skid vitrified tile (300×600 mm, Light Grey)',
    wallFinish: 'Full-height vitrified tile (Marble pattern, 300×600 mm)',
    paintColor: 'N/A — full tile coverage',
    ceiling: 'Calcium silicate board (moisture resistant), 8.5 ft',
    furniture: [
      'Wall-hung EWC (Jaquar)',
      'Vanity basin with pedestal (Jaquar)',
      'Overhead shower + hand shower (Grohe)',
      'Frameless shower partition (8mm glass)',
      'SS towel rail',
    ],
    extras: ['Racold 25L water heater', 'Exhaust fan with humidity sensor'],
  },
}


// ─── Warranty Assets ──────────────────────────────────────────────────────────

export const DEMO_WARRANTY_ASSETS: WarrantyAsset[] = [
  {
    id: 'wa-1',
    name: 'LG Split AC 1.5 Ton',
    icon: '❄️',
    zone: 'Living Area',
    brand: 'LG',
    model: 'RS-Q19JNXE',
    serialNumber: 'LG2024AC0021',
    purchaseDate: isoDate(-365),
    warrantyExpiry: isoDate(15),      // expiring soon
    nextService: isoDate(15),
    invoiceUrl: null,
    source: 'manual',
    createdAt: ts(365),
  },
  {
    id: 'wa-2',
    name: 'Samsung 55" QLED TV',
    icon: '📺',
    zone: 'Living Area',
    brand: 'Samsung',
    model: 'QA55Q70CAKLXL',
    serialNumber: 'SNG23TV004417',
    purchaseDate: isoDate(-200),
    warrantyExpiry: isoDate(165),
    nextService: null,
    invoiceUrl: null,
    source: 'gmail_sync',
    createdAt: ts(200),
  },
  {
    id: 'wa-3',
    name: 'IFB Front Load Washer 7kg',
    icon: '🫧',
    zone: 'Utility',
    brand: 'IFB',
    model: 'Senator WXS 7510',
    serialNumber: 'IFB24WM7711',
    purchaseDate: isoDate(-180),
    warrantyExpiry: isoDate(550),
    nextService: isoDate(90),
    invoiceUrl: null,
    source: 'gmail_sync',
    createdAt: ts(180),
  },
  {
    id: 'wa-4',
    name: 'Samsung 265L Refrigerator',
    icon: '🧊',
    zone: 'Kitchen',
    brand: 'Samsung',
    model: 'RR28T3722S8',
    serialNumber: 'SNG21RF8844',
    purchaseDate: isoDate(-730),
    warrantyExpiry: isoDate(-30),     // already expired
    nextService: null,
    invoiceUrl: null,
    source: 'manual',
    createdAt: ts(730),
  },
  {
    id: 'wa-5',
    name: 'LG 28L Microwave Oven',
    icon: '📡',
    zone: 'Kitchen',
    brand: 'LG',
    model: 'MC2846SL',
    serialNumber: 'LG23MW5566',
    purchaseDate: isoDate(-300),
    warrantyExpiry: isoDate(430),
    nextService: null,
    invoiceUrl: null,
    source: 'manual',
    createdAt: ts(300),
  },
  {
    id: 'wa-6',
    name: 'Racold 25L Water Heater',
    icon: '🚿',
    zone: 'Bathroom',
    brand: 'Racold',
    model: 'Pronto Neo 25L',
    serialNumber: 'RC24WH3322',
    purchaseDate: isoDate(-400),
    warrantyExpiry: isoDate(100),
    nextService: isoDate(60),
    invoiceUrl: null,
    source: 'manual',
    createdAt: ts(400),
  },
  {
    id: 'wa-7',
    name: 'Panasonic Split AC 1.5T',
    icon: '❄️',
    zone: 'Master Bedroom',
    brand: 'Panasonic',
    model: 'CS/CU-KU18ZKYF',
    serialNumber: 'PAN24AC7721',
    purchaseDate: isoDate(-90),
    warrantyExpiry: isoDate(640),
    nextService: isoDate(275),
    invoiceUrl: null,
    source: 'gmail_sync',
    createdAt: ts(90),
  },
  {
    id: 'wa-8',
    name: 'Dyson V11 Vacuum Cleaner',
    icon: '🌀',
    zone: 'Utility',
    brand: 'Dyson',
    model: 'V11 Absolute',
    serialNumber: 'DYS22VC1188',
    purchaseDate: isoDate(-750),
    warrantyExpiry: isoDate(-20),    // expired
    nextService: null,
    invoiceUrl: null,
    source: 'manual',
    createdAt: ts(750),
  },
]

// ─── Vault Docs ───────────────────────────────────────────────────────────────

export const DEMO_VAULT_DOCS: Record<string, VaultDoc[]> = {
  ownership: [
    {
      id: 'vd-1',
      name: 'Sale Agreement – Oriana Unit 1202',
      type: 'pdf',
      size: 10_485_760,
      url: '',
      ocr: true,
      notes: 'Registered sale agreement. Stamp duty paid ₹1,24,000.',
      category: 'ownership',
      createdAt: ts(25),
    },
    {
      id: 'vd-2',
      name: 'Completion Certificate',
      type: 'pdf',
      size: 2_097_152,
      url: '',
      ocr: false,
      notes: 'Issued by GHMC. Valid for home loan/insurance.',
      category: 'ownership',
      createdAt: ts(20),
    },
  ],
  maintenance: [
    {
      id: 'vd-3',
      name: 'Maintenance Schedule 2025',
      type: 'pdf',
      size: 819_200,
      url: '',
      ocr: false,
      notes: 'Annual maintenance schedule from Cybercity FM team.',
      category: 'maintenance',
      createdAt: ts(15),
    },
  ],
  interior: [
    {
      id: 'vd-4',
      name: 'Architectural Floor Plan – 3BHK East',
      type: 'pdf',
      size: 4_718_592,
      url: '',
      ocr: false,
      notes: 'As-built floor plan. Useful for renovation work.',
      category: 'interior',
      createdAt: ts(28),
    },
  ],
  tax: [
    {
      id: 'vd-5',
      name: 'GST Invoice – ₹14,80,000',
      type: 'pdf',
      size: 1_258_291,
      url: '',
      ocr: true,
      notes: 'GST paid at 5% on undivided share. Claim ITC if applicable.',
      category: 'tax',
      createdAt: ts(22),
    },
  ],
  manuals: [
    {
      id: 'vd-6',
      name: 'LG AC Installation & User Manual',
      type: 'pdf',
      size: 3_145_728,
      url: '',
      ocr: false,
      notes: 'RS-Q19JNXE installation guide and troubleshooting.',
      category: 'manuals',
      createdAt: ts(360),
    },
  ],
  warranties: [
    {
      id: 'vd-7',
      name: 'Appliance Warranty Card Bundle',
      type: 'pdf',
      size: 6_083_072,
      url: '',
      ocr: true,
      notes: 'All appliance warranty cards scanned and bundled.',
      category: 'warranties',
      createdAt: ts(180),
    },
  ],
}

// ─── Snags ────────────────────────────────────────────────────────────────────

export const DEMO_SNAGS: Snag[] = [
  {
    id: 'sn-1',
    title: 'Bathroom floor tiles cracked',
    location: 'Master Bathroom',
    category: 'Tiling',
    urgency: 'high',
    status: 'open',
    photoUrl: null,
    createdAt: ts(5),
    updatedAt: ts(5),
  },
  {
    id: 'sn-2',
    title: 'Kitchen cabinet door misaligned',
    location: 'Kitchen',
    category: 'Carpentry',
    urgency: 'medium',
    status: 'in-progress',
    photoUrl: null,
    createdAt: ts(12),
    updatedAt: ts(3),
  },
  {
    id: 'sn-3',
    title: 'Balcony waterproofing peeling near drain',
    location: 'Balcony',
    category: 'Waterproofing',
    urgency: 'high',
    status: 'open',
    photoUrl: null,
    createdAt: ts(8),
    updatedAt: ts(8),
  },
  {
    id: 'sn-4',
    title: 'Living room ceiling light flickering',
    location: 'Living Room',
    category: 'Electrical',
    urgency: 'low',
    status: 'fixed',
    photoUrl: null,
    createdAt: ts(20),
    updatedAt: ts(6),
  },
  {
    id: 'sn-5',
    title: 'Bedroom 2 window sealing gap',
    location: 'Bedroom 2',
    category: 'Windows',
    urgency: 'medium',
    status: 'open',
    photoUrl: null,
    createdAt: ts(15),
    updatedAt: ts(15),
  },
]

// ─── Events (Activity Timeline) ───────────────────────────────────────────────

export const DEMO_EVENTS: AppEvent[] = [
  {
    id: 'ev-1',
    type: 'vault_upload',
    title: 'Sale Agreement uploaded',
    subtitle: 'Oriana Unit 1202 — 10.2 MB',
    icon: '📄',
    createdAt: ts(2),
  },
  {
    id: 'ev-2',
    type: 'asset_added',
    title: 'LG AC warranty added',
    subtitle: 'Expires in 15 days. Set a service reminder.',
    icon: '❄️',
    createdAt: ts(5),
  },
  {
    id: 'ev-3',
    type: 'snag_opened',
    title: 'Snag reported: Bathroom tiles',
    subtitle: 'Master Bathroom · High urgency',
    icon: '🔨',
    createdAt: ts(5),
  },
  {
    id: 'ev-4',
    type: 'snag_fixed',
    title: 'Snag resolved: Light flickering',
    subtitle: 'Living Room · Electrician visit complete',
    icon: '✅',
    createdAt: ts(6),
  },
  {
    id: 'ev-5',
    type: 'asset_added',
    title: 'Gmail sync complete',
    subtitle: '3 warranty assets added from receipts',
    icon: '📬',
    createdAt: ts(14),
  },
]

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export const DEMO_STATS: DashboardStats = {
  assetCount: DEMO_WARRANTY_ASSETS.length,
  expiringSoonCount: 1,   // LG AC
  openSnagCount: DEMO_SNAGS.filter((s) => s.status === 'open').length,
}
