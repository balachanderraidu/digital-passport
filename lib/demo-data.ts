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

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const ts = (daysAgo: number): Timestamp =>
  Timestamp.fromDate(new Date(Date.now() - daysAgo * 86_400_000))

const isoDate = (daysFromNow: number): string => {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  return d.toISOString().split('T')[0]
}

// â”€â”€â”€ Property â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
    photoUrl: '/demo-assets/snag_ceiling.png',
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
    photoUrl: '/demo-assets/snag_kitchen.png',
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
    photoUrl: '/demo-assets/snag_tile_crack.png',
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
    photoUrl: '/demo-assets/snag_plumbing.png',
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
    photoUrl: '/demo-assets/snag_kitchen.png',
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
    photoUrl: '/demo-assets/snag_balcony.png',
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

// â”€â”€â”€ Floor Plan Rooms (percentage coordinates) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ Room Finishing Specifications â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
    flooring: 'Kajaria Porcelain (800Ã—800 mm), Light Beige',
    wallFinish: 'Asian Paints Premium Emulsion, Matte',
    paintColor: 'Antique White (AP-0234)',
    ceiling: 'Gypsum false ceiling with LED coves, 10 ft height',
    furniture: [
      'L-shaped sofa (3+2 seater, Grey velvet)',
      'Tempered glass coffee table',
      'Samsung 55â€³ QLED TV on wall mount',
      'Wooden TV unit with storage',
      'Floor-to-ceiling bookshelf (west wall)',
      'Pendant lamp trio',
    ],
    extras: ['1.5T LG Split AC (window right)', 'Zebra blinds on balcony door'],
  },
  'Dining Room': {
    area: 138,
    flooring: 'Kajaria Porcelain (800Ã—800 mm), Light Beige (continuous with Living)',
    wallFinish: 'Asian Paints Premium Emulsion, Matte',
    paintColor: 'Antique White (AP-0234)',
    ceiling: 'Plain POP finish, 10 ft',
    furniture: [
      '6-seater dining table (natural teak)',
      'Upholstered dining chairs Ã—6 (Olive Green)',
      'Sideboard / buffet unit',
      'Pendant chandelier above table',
    ],
  },
  'Kitchen': {
    area: 130,
    flooring: 'Anti-skid ceramic tile (300Ã—600 mm, Matt Grey)',
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
    flooring: 'Anti-skid vitrified tile (600Ã—600 mm, Terracotta)',
    wallFinish: 'Textured exterior paint (Apex Weatherproof)',
    paintColor: 'Sandstone (AP-9901)',
    ceiling: 'Open / exposed RCC slab, waterproofed',
    furniture: [
      'Teak outdoor bistro set (2 chairs + table)',
      'Modular planter shelf (3 tier)',
      'Hanging macramÃ© planters Ã—4',
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
      'Matching bedside tables Ã—2 with USB charging',
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
    flooring: 'Anti-skid vitrified tile (300Ã—600 mm, Light Grey)',
    wallFinish: 'Full-height vitrified tile (Marble pattern, 300Ã—600 mm)',
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

// â”€â”€â”€ Item Cross-Reference Layer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Everything hangs off Room â†’ Spec â†’ Item.
// This layer links each named item to its warranty, vault doc, snags, and service history.

export interface ServiceEvent {
  date: string          // YYYY-MM-DD
  type: 'Installation' | 'Annual Service' | 'Repair' | 'Inspection' | 'Cleaning'
  tech: string          // technician / company name
  contact?: string      // phone or email of the technician/company
  notes: string         // description of what was done
  invoiceRef?: string   // service invoice / job-order number
  cost?: number         // ₹
}

export interface ItemLink {
  warrantyId?: string       // key into DEMO_WARRANTY_ASSETS
  vaultDocId?: string       // key into DEMO_VAULT_DOCS (flat)
  snagIds?: string[]        // keys into DEMO_SNAGS / DEMO_SNAGS_ACTIVE
  serviceHistory?: ServiceEvent[]
}

/** Keyed by the exact furniture/spec item name as it appears in DEMO_ROOM_SPECS */
export const DEMO_ITEM_LINKS: Record<string, ItemLink> = {

  // â”€â”€ Living Room â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  '1.5T LG Split AC (window right)': {
    warrantyId: 'wa-1',
    serviceHistory: [
      { date: '2024-03-18', type: 'Installation', tech: 'LG Authorised Service – Hyderabad', contact: '+91 98490 11223', notes: 'Unit installed, tested and commissioned. Gas charged at factory spec.', invoiceRef: 'LG-INST-2024-0012', cost: 0 },
      { date: '2024-09-05', type: 'Annual Service', tech: 'LG Authorised Service – Hyderabad', contact: '+91 98490 11223', notes: 'Indoor/outdoor coil cleaned, drain pipe flushed, gas pressure verified (8.2 bar). Filter washed.', invoiceRef: 'LG-SVC-2024-0891', cost: 850 },
      { date: '2025-03-10', type: 'Annual Service', tech: 'LG Authorised Service – Hyderabad', contact: '+91 98490 11223', notes: 'Full service done — coil cleaned, refrigerant topped up 150g, remote battery replaced. Warranty expires in 15 days; renewal advised.', invoiceRef: 'LG-SVC-2025-0214', cost: 1200 },
    ],
  },
  'Samsung 55â€³ QLED TV on wall mount': {
    warrantyId: 'wa-2',
    serviceHistory: [
      { date: '2024-08-22', type: 'Installation', tech: 'Samsung SmartCare – Hyderabad', contact: 'smartcare.hyd@samsung.in', notes: 'TV wall-mounted (75Â° tilt bracket), calibrated for room ambient lighting conditions.', invoiceRef: 'SC-INST-2024-0445', cost: 0 },
    ],
  },

  // â”€â”€ Kitchen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  'Samsung 265L double-door refrigerator': {
    warrantyId: 'wa-4',
    serviceHistory: [
      { date: '2024-09-01', type: 'Installation', tech: 'Samsung SmartCare – Hyderabad', contact: 'smartcare.hyd@samsung.in', notes: 'Refrigerator placed and levelled. Initial cooling cycle complete.', invoiceRef: 'SC-INST-2024-0446', cost: 0 },
      { date: '2025-01-15', type: 'Inspection', tech: 'Samsung SmartCare – Hyderabad', contact: 'smartcare.hyd@samsung.in', notes: 'Condenser coils cleaned. Door seals checked — minor gap on right door corrected (no charge, warranty visit).', invoiceRef: 'SC-INSP-2025-0088', cost: 0 },
    ],
  },
  'LG 28L microwave (built-in shelf)': {
    warrantyId: 'wa-5',
    serviceHistory: [
      { date: '2024-09-05', type: 'Installation', tech: 'Self', notes: 'Built into the shelf above counter using Hafele mounting kit. Turntable and timer verified.', cost: 0 },
    ],
  },
  'IFB dishwasher (under-counter)': {
    warrantyId: 'wa-3',
    serviceHistory: [
      { date: '2024-09-10', type: 'Installation', tech: 'IFB Authorised – Hyderabad', contact: '+91 73829 44001', notes: 'Plumbing connection made to existing supply line under counter. Test cycle completed — no leaks detected.', invoiceRef: 'IFB-INST-2024-0203', cost: 0 },
      { date: '2024-12-20', type: 'Cleaning', tech: 'Self', notes: 'Filter basket descaled using dishwasher cleaner. Limescale removed from spray arms. Door seal wiped.', cost: 0 },
      { date: '2025-02-18', type: 'Repair', tech: 'IFB Authorised – Hyderabad', contact: '+91 73829 44001', notes: 'Inlet water valve replaced — unit was displaying E3 error. Valve sourced from IFB warehouse. Part covered under warranty.', invoiceRef: 'IFB-REP-2025-0041', cost: 0 },
    ],
  },
  'Modular kitchen — L-shape layout (Hafele fittings)': {
    vaultDocId: 'vd-4',
    snagIds: ['sn-2'],
    serviceHistory: [
      { date: '2024-08-28', type: 'Inspection', tech: 'Hafele Service Partner – Interior Touch', contact: '+91 99890 32211 · interior.touch.hyd@gmail.com', notes: 'Post-installation snag inspection. Cabinet door hinges adjusted, drawer runners aligned to specification.', invoiceRef: 'HFP-INSP-2024-0018', cost: 0 },
      { date: '2025-03-05', type: 'Repair', tech: 'Hafele Service Partner – Interior Touch', contact: '+91 99890 32211', notes: 'Right upper cabinet door realigned — screw anchor had vibrated loose. Fischer plug replaced with M6 anchor. Snag sn-2 status updated to In Progress.', invoiceRef: 'HFP-REP-2025-0007', cost: 350 },
    ],
  },

  // â”€â”€ Master Bedroom â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  'Panasonic 1.5T inverter AC': {
    warrantyId: 'wa-7',
    serviceHistory: [
      { date: '2024-10-02', type: 'Installation', tech: 'Panasonic Service – Hyderabad', contact: '+91 80001 23456', notes: 'Installed in master bedroom. Star-rated inverter compressor tested at rated load. Earthing verified.', invoiceRef: 'PAN-INST-2024-0088', cost: 0 },
      { date: '2025-02-28', type: 'Annual Service', tech: 'Panasonic Service – Hyderabad', contact: '+91 80001 23456', notes: 'Pre-summer service: indoor/outdoor coil washed, drain pan cleared, inverter board firmware updated to v3.1.2.', invoiceRef: 'PAN-SVC-2025-0031', cost: 950 },
    ],
  },
  'Walk-in wardrobe (6-door sliding, Italian laminate)': {
    snagIds: [],
    serviceHistory: [
      { date: '2024-09-01', type: 'Inspection', tech: 'Prism Interiors – Hyderabad', contact: 'prism.interiors.hyd@gmail.com · +91 98100 77654', notes: 'Post-installation check: all 6 sliding panels aligned and smooth. Soft-close mechanism tested on all doors. Locking mechanism verified.', invoiceRef: 'PRISM-INSP-2024-0031', cost: 0 },
    ],
  },

  // â”€â”€ Bathroom (en-suite + common) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  'Racold 25L water heater': {
    warrantyId: 'wa-6',
    snagIds: [],
    serviceHistory: [
      { date: '2024-08-30', type: 'Installation', tech: 'Racold Authorised – Hyderabad', contact: '+91 90000 55443', notes: 'Unit wall-mounted above shower point. Pressure relief valve tested (opens at 8 bar). Earthing loop verified with tester.', invoiceRef: 'RAC-INST-2024-0199', cost: 0 },
      { date: '2025-01-10', type: 'Annual Service', tech: 'Racold Authorised – Hyderabad', contact: '+91 90000 55443', notes: 'Magnesium anode rod inspected — 30% consumed, still healthy (replacement advised in ~18 months). Tank flushed of sediment. Thermostat recalibrated to 55Â°C.', invoiceRef: 'RAC-SVC-2025-0012', cost: 600 },
    ],
  },
  'Dyson V11 Vacuum Cleaner': {
    warrantyId: 'wa-8',
    serviceHistory: [
      { date: '2023-06-15', type: 'Installation', tech: 'Self', notes: 'Unboxed and assembled. All accessories tested: floor head, crevice tool, mini motorized tool.', cost: 0 },
      { date: '2024-06-10', type: 'Cleaning', tech: 'Self', notes: 'HEPA filter washed and dried 24h. Bin emptied and rinsed. Brush bar removed — hair tangled at ends cleared.', cost: 0 },
    ],
  },

  // â”€â”€ Flooring snag cross-links â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  'Anti-skid vitrified tile (600Ã—600 mm, Terracotta)': {
    snagIds: ['sn-3'],   // Balcony waterproofing peeling near drain
  },
  'Kajaria Porcelain (800Ã—800 mm), Light Beige': {
    snagIds: ['sn-1'],   // Bathroom floor tiles cracked
  },
  'Frameless shower partition (8mm glass)': {
    snagIds: ['sn-5'],   // Bedroom 2 window sealing gap (closest demo snag)
  },

  // â”€â”€ Vault doc links â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  'Laminate wood flooring (8mm, Walnut finish)': {
    vaultDocId: 'vd-4',  // Interior specs / architectural floor plan
  },
  'Gypsum false ceiling with LED coves, 10 ft height': {
    vaultDocId: 'vd-3',  // Maintenance schedule
  },
  'Appliance Warranty Card Bundle': {
    vaultDocId: 'vd-7',
  },
}

// â”€â”€â”€ Warranty Assets â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€


export const DEMO_WARRANTY_ASSETS: WarrantyAsset[] = [
  {
    id: 'wa-hob-1',
    name: 'Bosch Series 8 Induction Hob',
    icon: '🍳',
    zone: 'Kitchen',
    brand: 'Bosch',
    model: 'PXY875KW1E',
    serialNumber: 'BSH-2024-H0992',
    purchaseDate: isoDate(-120),
    warrantyExpiry: isoDate(610),
    nextService: isoDate(90),
    invoiceUrl: null,
    photoUrl: 'https://images.unsplash.com/photo-1556910103-1c02745a872f?auto=format&fit=crop&q=80&w=800',
    source: 'manual',
    createdAt: ts(120),
  },
  {
    id: 'wa-coffee-1',
    name: 'Breville Barista Pro Espresso',
    icon: 'â˜•',
    zone: 'Kitchen',
    brand: 'Breville',
    model: 'BES878',
    serialNumber: 'BRV-ESX-5519',
    purchaseDate: isoDate(-45),
    warrantyExpiry: isoDate(320),
    nextService: null,
    invoiceUrl: null,
    photoUrl: 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?auto=format&fit=crop&q=80&w=800',
    source: 'manual',
    createdAt: ts(45),
  },
  {
    id: 'wa-1',
    name: 'LG Split AC 1.5 Ton',
    icon: 'â„ï¸',
    zone: 'Living Area',
    brand: 'LG',
    model: 'RS-Q19JNXE',
    serialNumber: 'LG2024AC0021',
    purchaseDate: isoDate(-365),
    warrantyExpiry: isoDate(15),      // expiring soon
    nextService: isoDate(15),
    invoiceUrl: null,
    photoUrl: '/demo-assets/asset_ac.png',
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
    photoUrl: '/demo-assets/asset_tv.png',
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
    photoUrl: '/demo-assets/asset_washer.png',
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
    photoUrl: '/demo-assets/asset_fridge.png',
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
    photoUrl: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&q=80&w=800',
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
    icon: 'â„ï¸',
    zone: 'Master Bedroom',
    brand: 'Panasonic',
    model: 'CS/CU-KU18ZKYF',
    serialNumber: 'PAN24AC7721',
    purchaseDate: isoDate(-90),
    warrantyExpiry: isoDate(640),
    nextService: isoDate(275),
    invoiceUrl: null,
    photoUrl: '/demo-assets/asset_ac.png',
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

// â”€â”€â”€ Vault Docs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€â”€ Snags â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const DEMO_SNAGS: Snag[] = [
  {
    id: 'sn-1',
    title: 'Bathroom floor tiles cracked',
    location: 'Master Bathroom',
    category: 'Tiling',
    urgency: 'high',
    status: 'open',
    photoUrl: '/demo-assets/snag_tile_crack.png',
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
    photoUrl: '/demo-assets/snag_kitchen.png',
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
    photoUrl: '/demo-assets/snag_balcony.png',
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

// â”€â”€â”€ Events (Activity Timeline) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
    icon: 'â„ï¸',
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

// â”€â”€â”€ Dashboard Stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const DEMO_STATS: DashboardStats = {
  assetCount: DEMO_WARRANTY_ASSETS.length,
  expiringSoonCount: 1,   // LG AC
  openSnagCount: DEMO_SNAGS.filter((s) => s.status === 'open').length,
}

// â”€â”€â”€ Property Timeline â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Chronological milestones — the "life of the property" feed.

export interface TimelineEvent {
  id: string
  date: string           // YYYY-MM-DD
  category: 'purchase' | 'legal' | 'renovation' | 'installation' | 'service' | 'snag' | 'warranty' | 'document'
  icon: string
  title: string
  detail: string
  badge?: string         // short status label
  badgeColor?: string    // tailwind text colour class
  linkedId?: string      // warrantyId, snagId, vaultDocId etc.
}

export const DEMO_TIMELINE_EVENTS: TimelineEvent[] = [
  // â”€â”€ 2023 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    id: 'tl-1',
    date: '2023-06-10',
    category: 'purchase',
    icon: '🏠',
    title: 'Property Booked',
    detail: 'Unit 1202, Oriana Tower B — Prestige Cybercity, Hyderabad. Booking amount ₹5,00,000 paid.',
  },
  {
    id: 'tl-2',
    date: '2023-08-22',
    category: 'legal',
    icon: '📝',
    title: 'Sale Agreement Signed',
    detail: 'Registered sale agreement executed. Stamp duty ₹1,24,000 paid at SRO Kondapur.',
    badge: 'Legal',
    badgeColor: 'text-blue-400',
    linkedId: 'vd-1',
  },
  {
    id: 'tl-3',
    date: '2023-06-15',
    category: 'installation',
    icon: '🌀',
    title: 'Dyson V11 Vacuum — Purchased',
    detail: 'Dyson V11 Absolute added to household. 2-year warranty registered.',
    linkedId: 'wa-8',
  },

  // â”€â”€ 2024 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    id: 'tl-4',
    date: '2024-03-05',
    category: 'renovation',
    icon: '🔨',
    title: 'Interior Work Commenced',
    detail: 'Prism Interiors started renovations — flooring, false ceiling, modular kitchen, and wardrobes.',
    badge: 'Active Phase',
    badgeColor: 'text-amber-400',
  },
  {
    id: 'tl-5',
    date: '2024-03-18',
    category: 'installation',
    icon: 'â„ï¸',
    title: 'LG AC 1.5T Installed',
    detail: 'LG RS-Q19JNXE installed in living room by LG Authorised Service, Hyderabad. Invoice #LG-INST-2024-0012.',
    linkedId: 'wa-1',
  },
  {
    id: 'tl-6',
    date: '2024-08-22',
    category: 'installation',
    icon: '📺',
    title: 'Samsung 55â€³ QLED Mounted',
    detail: 'TV wall-mounted (75Â° tilt bracket) by Samsung SmartCare. Invoice #SC-INST-2024-0445.',
    linkedId: 'wa-2',
  },
  {
    id: 'tl-7',
    date: '2024-08-28',
    category: 'renovation',
    icon: '🏁',
    title: 'Interior Works Completed',
    detail: 'Renovation signed off by Prism Interiors. Snag inspection done — 3 minor issues logged.',
    badge: 'Passive Phase',
    badgeColor: 'text-emerald-400',
  },
  {
    id: 'tl-8',
    date: '2024-08-30',
    category: 'installation',
    icon: '🚿',
    title: 'Racold Water Heater Installed',
    detail: 'Racold Pronto Neo 25L mounted in bathroom. Invoice #RAC-INST-2024-0199.',
    linkedId: 'wa-6',
  },
  {
    id: 'tl-9',
    date: '2024-09-01',
    category: 'renovation',
    icon: '🛏ï¸',
    title: 'Moved In',
    detail: 'Property handed over. Keys collected from Prestige site office. Passport status: Passive.',
    badge: 'Moved In',
    badgeColor: 'text-emerald-400',
  },
  {
    id: 'tl-10',
    date: '2024-09-01',
    category: 'installation',
    icon: '🧊',
    title: 'Samsung Refrigerator Installed',
    detail: 'Samsung 265L RT28T3722S8 placed and levelled. Invoice #SC-INST-2024-0446.',
    linkedId: 'wa-4',
  },
  {
    id: 'tl-11',
    date: '2024-09-10',
    category: 'installation',
    icon: '🍽ï¸',
    title: 'IFB Dishwasher Installed',
    detail: 'IFB under-counter dishwasher plumbed in by IFB Authorised, Hyderabad. Invoice #IFB-INST-2024-0203.',
    linkedId: 'wa-3',
  },
  {
    id: 'tl-12',
    date: '2024-09-05',
    category: 'service',
    icon: '🔧',
    title: 'LG AC — First Annual Service',
    detail: 'Coil cleaned, drain pipe flushed, gas pressure 8.2 bar verified. Invoice #LG-SVC-2024-0891. ₹850.',
    linkedId: 'wa-1',
  },
  {
    id: 'tl-13',
    date: '2024-10-02',
    category: 'installation',
    icon: 'â„ï¸',
    title: 'Panasonic AC — Master Bed Installed',
    detail: 'Panasonic 1.5T inverter AC installed in master bedroom. Invoice #PAN-INST-2024-0088.',
    linkedId: 'wa-7',
  },
  {
    id: 'tl-14',
    date: '2024-11-15',
    category: 'snag',
    icon: '🔴',
    title: 'Snag Logged: Bathroom Floor Tiles',
    detail: 'Two tiles near the shower partition cracked. High urgency — raised with Prestige Cybercity FM.',
    badge: 'Open',
    badgeColor: 'text-red-400',
    linkedId: 'sn-1',
  },
  {
    id: 'tl-15',
    date: '2024-12-20',
    category: 'service',
    icon: '🧹',
    title: 'IFB Dishwasher — Self Clean',
    detail: 'Filter basket descaled. Limescale removed from spray arms.',
    linkedId: 'wa-3',
  },
  {
    id: 'tl-16',
    date: '2024-12-28',
    category: 'document',
    icon: '🧾',
    title: 'GST Invoice Uploaded',
    detail: 'GST ₹14,80,000 at 5% on undivided share uploaded to Vault. OCR indexed.',
    linkedId: 'vd-5',
  },

  // â”€â”€ 2025 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    id: 'tl-17',
    date: '2025-01-10',
    category: 'service',
    icon: '🔧',
    title: 'Racold Heater — Annual Service',
    detail: 'Anode rod 30% consumed, tank flushed, thermostat at 55Â°C. Invoice #RAC-SVC-2025-0012. ₹600.',
    linkedId: 'wa-6',
  },
  {
    id: 'tl-18',
    date: '2025-02-18',
    category: 'warranty',
    icon: '🛡ï¸',
    title: 'IFB Dishwasher — Warranty Repair',
    detail: 'Inlet valve replaced under warranty (E3 error). Invoice #IFB-REP-2025-0041.',
    badge: 'Warranty Claim',
    badgeColor: 'text-purple-400',
    linkedId: 'wa-3',
  },
  {
    id: 'tl-19',
    date: '2025-02-28',
    category: 'service',
    icon: '🔧',
    title: 'Panasonic AC — Annual Service',
    detail: 'Coil washed, drain cleared, firmware v3.1.2 installed. Invoice #PAN-SVC-2025-0031. ₹950.',
    linkedId: 'wa-7',
  },
  {
    id: 'tl-20',
    date: '2025-03-05',
    category: 'snag',
    icon: '🟡',
    title: 'Kitchen Cabinet Repair — In Progress',
    detail: 'Right upper cabinet door realigned by Hafele service. Fischer anchor replaced. Invoice #HFP-REP-2025-0007. ₹350.',
    badge: 'In Progress',
    badgeColor: 'text-amber-400',
    linkedId: 'sn-2',
  },
  {
    id: 'tl-21',
    date: '2025-03-10',
    category: 'service',
    icon: '🔧',
    title: 'LG AC — Second Annual Service',
    detail: 'Refrigerant topped up 150g, remote battery replaced. Invoice #LG-SVC-2025-0214. ₹1,200.',
    badge: 'âš ï¸ Expiring Soon',
    badgeColor: 'text-amber-400',
    linkedId: 'wa-1',
  },
  {
    id: 'tl-22',
    date: '2025-03-21',
    category: 'warranty',
    icon: 'âš ï¸',
    title: 'LG AC Warranty — Expiring in 15 Days',
    detail: 'Warranty for LG RS-Q19JNXE expires soon. Consider AMC renewal with LG Authorised, Hyderabad (+91 98490 11223).',
    badge: 'Action Needed',
    badgeColor: 'text-amber-400',
    linkedId: 'wa-1',
  },
]

// â”€â”€â”€ DEEP DEMO MULTI-PROPERTY ARCHITECTURE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const p_villa: Property = {
  id: 'p_villa',
  name: 'Cloud 9 Villa — Phase II',
  unit: 'Villa 42, Cloud 9 Gachibowli',
  area: 4500,
  floorPlanType: '5BHK Triplex (G+2)',
  location: 'Gachibowli, Hyderabad',
  gmailLinked: true,
  projectId: 'demo-project',
  unitTypeId: '5bhk-villa',
  unitTypeLabel: 'Luxury Triplex',
  occupancy: 'residing',
  floorPlanUrl: '/demo-assets/floor_plan.png',
  heroImageUrl: '/demo-assets/villa_exterior.png',
  lat: 17.4401,
  lng: 78.3489,
  createdAt: ts(90),
}

export const p_rental: Property = {
  id: 'p_rental',
  name: 'Lakeside Towers — Apt 14B',
  unit: 'Apt 14B, Lakeside Towers',
  area: 1250,
  floorPlanType: '2BHK',
  location: 'Kondapur, Hyderabad',
  gmailLinked: false,
  projectId: 'demo-project',
  unitTypeId: '2bhk-west',
  unitTypeLabel: '2BHK West · Rented to Arjun & Priya',
  occupancy: 'rented',
  floorPlanUrl: '/demo-assets/floor_plan_2bhk.png',
  heroImageUrl: '/demo-assets/rental_interior.png',
  lat: 17.4615,
  lng: 78.3543,
  createdAt: ts(120),
}

export const p_empty: Property = {
  id: 'p_empty',
  name: 'Green Meadows — Plot 104',
  unit: 'Plot 104, Green Meadows Phase 3',
  area: 2400,
  floorPlanType: '3BHK Bare Shell',
  location: 'Shamshabad, Hyderabad',
  gmailLinked: false,
  projectId: 'demo-project',
  unitTypeId: 'demo-empty',
  unitTypeLabel: 'Bare Shell · Renovation Planning',
  occupancy: 'empty',
  floorPlanUrl: '/demo-assets/floor_plan_3bhk.png',
  heroImageUrl: '/demo-assets/empty_shell.png',
  lat: 17.3120,
  lng: 78.4294,
  createdAt: ts(5),
}

export const p_construction: Property = {
  id: 'p_construction',
  name: 'Nexus Towers — Block C, Fl.8',
  unit: 'C-801, Nexus Towers',
  area: 1800,
  floorPlanType: '3BHK',
  location: 'Financial District, Hyderabad',
  gmailLinked: false,
  projectId: 'demo-project',
  unitTypeId: 'demo-active',
  unitTypeLabel: 'Under Construction · 67% complete',
  occupancy: 'renovation',
  floorPlanUrl: '/demo-assets/floor_plan_3bhk.png',
  heroImageUrl: '/demo-assets/construction_site.png',
  lat: 17.4127,
  lng: 78.3358,
  createdAt: ts(1),
}

export const DEMO_PROPERTIES = [p_villa, p_rental, p_empty, p_construction]

// â”€â”€â”€ RENTAL — Fixed fittings ONLY (not tenant's movable furniture) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Owner tracks: AC units, water heater, electrical fittings, bathroom fixtures
// NOT tracked: tenant's sofa, dining table, beds, fridge (their own), TV

export const DEMO_WARRANTY_ASSETS_RENTAL: WarrantyAsset[] = [
  {
    id: 'wa-r1',
    name: 'LG Split AC 1.5T — Living Room',
    icon: 'â„ï¸',
    zone: 'Living Area',
    brand: 'LG',
    model: 'RS-Q18JNXE',
    serialNumber: 'LG2022AC0077',
    purchaseDate: isoDate(-700),
    warrantyExpiry: isoDate(-35),    // expired
    nextService: isoDate(-35),
    invoiceUrl: null,
    photoUrl: '/demo-assets/asset_ac.png',
    source: 'manual',
    createdAt: ts(700),
  },
  {
    id: 'wa-r2',
    name: 'Daikin Split AC 1T — Bedroom',
    icon: 'â„ï¸',
    zone: 'Master Bedroom',
    brand: 'Daikin',
    model: 'FTKF25TV',
    serialNumber: 'DKN23AC8812',
    purchaseDate: isoDate(-400),
    warrantyExpiry: isoDate(330),
    nextService: isoDate(45),
    invoiceUrl: null,
    photoUrl: '/demo-assets/asset_ac.png',
    source: 'manual',
    createdAt: ts(400),
  },
  {
    id: 'wa-r3',
    name: 'Racold 15L Water Heater',
    icon: '🚿',
    zone: 'Bathroom',
    brand: 'Racold',
    model: 'Pronto Neo 15L',
    serialNumber: 'RC23WH7744',
    purchaseDate: isoDate(-550),
    warrantyExpiry: isoDate(90),
    nextService: isoDate(30),
    invoiceUrl: null,
    source: 'manual',
    createdAt: ts(550),
  },
  {
    id: 'wa-r4',
    name: 'Havells Bathroom Exhaust Fan',
    icon: '💨',
    zone: 'Bathroom',
    brand: 'Havells',
    model: 'Ventil Air DSX 150mm',
    serialNumber: 'HVL22EF3309',
    purchaseDate: isoDate(-700),
    warrantyExpiry: isoDate(-100),   // expired
    nextService: null,
    invoiceUrl: null,
    source: 'manual',
    createdAt: ts(700),
  },
]

// â”€â”€â”€ RENTAL — Vault Docs (ownership + lease paperwork) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const DEMO_VAULT_DOCS_RENTAL: Record<string, VaultDoc[]> = {
  ownership: [
    {
      id: 'vdr-1',
      name: 'Sale Deed — Apt 14B, Lakeside Towers',
      type: 'pdf',
      size: 9_437_184,
      url: '',
      ocr: true,
      notes: 'Original registered sale deed. Bought 2022, SRO Kondapur.',
      category: 'ownership',
      createdAt: ts(700),
    },
    {
      id: 'vdr-2',
      name: 'Society Share Certificate',
      type: 'pdf',
      size: 1_048_576,
      url: '',
      ocr: false,
      notes: 'Lakeside Towers Residents Association share certificate. Share no. 14B-102.',
      category: 'ownership',
      createdAt: ts(680),
    },
  ],
  maintenance: [
    {
      id: 'vdr-3',
      name: 'Lease Agreement — Arjun & Priya Sharma',
      type: 'pdf',
      size: 3_145_728,
      url: '',
      ocr: true,
      notes: '11-month lease w.e.f. 01 Sep 2024. Monthly rent ₹24,000. Security deposit ₹72,000.',
      category: 'maintenance',
      createdAt: ts(200),
    },
    {
      id: 'vdr-4',
      name: 'Tenant Police Verification',
      type: 'pdf',
      size: 819_200,
      url: '',
      ocr: false,
      notes: 'Kondapur PS verification for Arjun Sharma (ID: TS-32-2024-00441).',
      category: 'maintenance',
      createdAt: ts(195),
    },
    {
      id: 'vdr-5',
      name: 'Society NOC for Tenancy',
      type: 'pdf',
      size: 524_288,
      url: '',
      ocr: false,
      notes: 'Lakeside Towers HRERA NOC for sub-letting Apt 14B.',
      category: 'maintenance',
      createdAt: ts(198),
    },
  ],
  tax: [
    {
      id: 'vdr-6',
      name: 'Property Tax Paid — FY 2024-25',
      type: 'pdf',
      size: 630_784,
      url: '',
      ocr: true,
      notes: 'Annual property tax receipt from GHMC. ₹18,400 paid on 15 Apr 2024.',
      category: 'tax',
      createdAt: ts(350),
    },
  ],
  manuals: [],
  warranties: [
    {
      id: 'vdr-7',
      name: 'AC & Water Heater Warranty Cards',
      type: 'pdf',
      size: 2_097_152,
      url: '',
      ocr: true,
      notes: 'Warranty cards for LG AC, Daikin AC, Racold heater — all fittings that came with the flat.',
      category: 'warranties',
      createdAt: ts(700),
    },
  ],
  interior: [],
}

// â”€â”€â”€ RENTAL — Snags (AI-flagged from walkthrough analysis) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const DEMO_SNAGS_RENTAL: Snag[] = [
  {
    id: 'sn-rental-1',
    title: 'âš ï¸ AI Flagged: AC Filter Blocked',
    location: 'Master Bedroom',
    category: 'Maintenance',
    urgency: 'medium',
    status: 'open',
    photoUrl: '/demo-assets/snag_ac_dust.png',
    createdAt: ts(2),
    updatedAt: ts(2),
  },
  {
    id: 'sn-rental-2',
    title: 'âš ï¸ AI Flagged: Paint Scuff on Wall',
    location: 'Living Room',
    category: 'Maintenance',
    urgency: 'low',
    status: 'open',
    photoUrl: '/demo-assets/snag_wall_scuff.png',
    createdAt: ts(2),
    updatedAt: ts(2),
  },
  {
    id: 'sn-rental-3',
    title: 'âš ï¸ AI Flagged: Kitchen Cabinet Sag',
    location: 'Kitchen',
    category: 'Carpentry',
    urgency: 'medium',
    status: 'open',
    photoUrl: '/demo-assets/snag_kitchen.png',
    createdAt: ts(2),
    updatedAt: ts(2),
  },
]

// â”€â”€â”€ RENTAL — Timeline Events â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const DEMO_TIMELINE_RENTAL: TimelineEvent[] = [
  {
    id: 'tl-r1',
    date: '2022-09-15',
    category: 'purchase',
    icon: '🏠',
    title: 'Property Purchased',
    detail: 'Apt 14B, Lakeside Towers purchased for ₹68,00,000. Registered at SRO Kondapur. Stamp duty ₹4,08,000.',
  },
  {
    id: 'tl-r2',
    date: '2022-10-01',
    category: 'renovation',
    icon: '🔨',
    title: 'Minor Fixup Works',
    detail: 'Wall painting (2 coats Asian Paints Royale Shyne), kitchen tiles grouting, bathroom fittings replaced. Total ₹85,000.',
    badge: 'Completed',
    badgeColor: 'text-emerald-400',
  },
  {
    id: 'tl-r3',
    date: '2022-11-01',
    category: 'legal',
    icon: '📝',
    title: 'First Tenancy — Ramesh Family',
    detail: '11-month lease at ₹18,500/mo. Two years of trouble-free tenancy.',
    badge: 'Ended Nov 2024',
    badgeColor: 'text-blue-400',
  },
  {
    id: 'tl-r4',
    date: '2024-09-01',
    category: 'legal',
    icon: '📝',
    title: 'Current Tenancy — Arjun & Priya Sharma',
    detail: '11-month lease at ₹24,000/mo. Security deposit ₹72,000. Police verification done. Society NOC obtained.',
    badge: 'Active',
    badgeColor: 'text-emerald-400',
    linkedId: 'vdr-3',
  },
  {
    id: 'tl-r5',
    date: '2024-10-15',
    category: 'service',
    icon: '📹',
    title: 'AI Walkthrough #1 — Q3 2024',
    detail: 'Arjun submitted the first monthly walkthrough video. AI analysis: ✅ Cleanliness good, ✅ No structural modifications, ✅ Fittings intact.',
    badge: 'All Clear',
    badgeColor: 'text-emerald-400',
  },
  {
    id: 'tl-r6',
    date: '2024-11-15',
    category: 'service',
    icon: '📹',
    title: 'AI Walkthrough #2 — Q4 2024',
    detail: 'Monthly walkthrough video analyzed. AI analysis: ✅ No modifications, âš ï¸ AC filter appears dusty, ✅ Kitchen clean.',
    badge: 'Action Needed',
    badgeColor: 'text-amber-400',
  },
  {
    id: 'tl-r7',
    date: '2025-01-15',
    category: 'service',
    icon: '📹',
    title: 'AI Walkthrough #3 — Jan 2025',
    detail: 'AI detected: âš ï¸ AC filter still blocked (not addressed), âš ï¸ Wall paint scuff near sofa, âš ï¸ Kitchen cabinet door sag. Tenant notified.',
    badge: 'Issues Flagged',
    badgeColor: 'text-red-400',
  },
  {
    id: 'tl-r8',
    date: '2025-03-01',
    category: 'document',
    icon: '🧾',
    title: 'Rent Receipt Issued — March 2025',
    detail: '₹24,000 received via UPI. TDS @10% applicable. Receipt #RT-2025-007 generated.',
    badge: 'Received',
    badgeColor: 'text-emerald-400',
  },
]

// â”€â”€â”€ EMPTY SHELL — Vault Docs (purchase + planning stage only) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const DEMO_VAULT_DOCS_EMPTY: Record<string, VaultDoc[]> = {
  ownership: [
    {
      id: 'vde-1',
      name: 'Sale Agreement — Plot 104, Green Meadows',
      type: 'pdf',
      size: 8_388_608,
      url: '',
      ocr: true,
      notes: 'RERA registered sale agreement. RERA No. P02400007891.',
      category: 'ownership',
      createdAt: ts(30),
    },
    {
      id: 'vde-2',
      name: 'Revenue Survey / Khata Extract',
      type: 'pdf',
      size: 1_572_864,
      url: '',
      ocr: true,
      notes: 'Khata extract from GHMC for Plot 104. Khata No. 442/2024.',
      category: 'ownership',
      createdAt: ts(25),
    },
    {
      id: 'vde-3',
      name: 'RERA Allotment Certificate',
      type: 'pdf',
      size: 2_097_152,
      url: '',
      ocr: false,
      notes: 'Green Meadows Phase 3 — RERA Certificate for Plot 104. Developer: Greenland Infra Pvt Ltd.',
      category: 'ownership',
      createdAt: ts(28),
    },
  ],
  interior: [
    {
      id: 'vde-4',
      name: 'Approved Building Plan — GHMC',
      type: 'pdf',
      size: 15_728_640,
      url: '',
      ocr: false,
      notes: 'GHMC-approved 3BHK construction plan. Sanction No. GHMC-2024-BP-77231. Valid 1 year.',
      category: 'interior',
      createdAt: ts(10),
    },
    {
      id: 'vde-5',
      name: 'Architect Quote — Prism Design Studio',
      type: 'pdf',
      size: 3_145_728,
      url: '',
      ocr: false,
      notes: 'Interior design + supervision quote. Total estimate ₹42L for 2400 sqft 3BHK.',
      category: 'interior',
      createdAt: ts(5),
    },
  ],
  maintenance: [],
  tax: [],
  manuals: [],
  warranties: [],
}

// â”€â”€â”€ EMPTY SHELL — Timeline Events â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const DEMO_TIMELINE_EMPTY: TimelineEvent[] = [
  {
    id: 'tl-e1',
    date: '2025-01-15',
    category: 'purchase',
    icon: '🏠',
    title: 'Plot Purchased',
    detail: 'Plot 104, Green Meadows Phase 3 purchased for ₹85,00,000. Registration complete at SRO Shamshabad.',
  },
  {
    id: 'tl-e2',
    date: '2025-01-20',
    category: 'legal',
    icon: '📝',
    title: 'RERA Certificate Received',
    detail: 'RERA allotment certificate obtained. RERA No. P02400007891. Developer: Greenland Infra Pvt Ltd.',
    badge: 'Legal',
    badgeColor: 'text-blue-400',
    linkedId: 'vde-3',
  },
  {
    id: 'tl-e3',
    date: '2025-02-10',
    category: 'document',
    icon: '📐',
    title: 'Building Plan Sanctioned by GHMC',
    detail: 'G+1 3BHK construction plan approved. Sanction No. GHMC-2024-BP-77231. Construction may begin.',
    badge: 'Approved',
    badgeColor: 'text-emerald-400',
    linkedId: 'vde-4',
  },
  {
    id: 'tl-e4',
    date: '2025-03-15',
    category: 'renovation',
    icon: '🏗ï¸',
    title: 'Architect Engaged — Prism Design Studio',
    detail: 'Prism Design Studio engaged for interior design and site supervision. Quote ₹42L accepted. Work starts Q3 2025.',
    badge: 'In Planning',
    badgeColor: 'text-amber-400',
    linkedId: 'vde-5',
  },
]

// â”€â”€â”€ EMPTY SHELL — Room Specs (bare shell only — no finishes yet) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const DEMO_ROOM_SPECS_EMPTY: Record<string, RoomSpec> = {
  'Living Room': {
    area: 350,
    flooring: 'Bare concrete slab — not finished',
    wallFinish: 'Raw brick / block — plastering pending',
    paintColor: 'N/A',
    ceiling: 'Bare RCC slab — no false ceiling',
    furniture: [],
    extras: ['Electrical conduits roughed in', 'Plumbing inlet points marked', 'Window openings complete'],
  },
  'Kitchen': {
    area: 140,
    flooring: 'Bare concrete slab',
    wallFinish: 'Raw brick',
    paintColor: 'N/A',
    ceiling: 'Bare RCC slab',
    furniture: [],
    extras: ['OHT water inlet point', 'Gas point roughed in', 'Drain pipe laid'],
  },
  'Master Bedroom': {
    area: 200,
    flooring: 'Bare concrete slab',
    wallFinish: 'Raw brick',
    paintColor: 'N/A',
    ceiling: 'Bare RCC slab',
    furniture: [],
    extras: ['AC point conduit roughed in', 'Power outlets roughed in'],
  },
}

// â”€â”€â”€ CONSTRUCTION — Vault Docs (builder docs only) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const DEMO_VAULT_DOCS_CONSTRUCTION: Record<string, VaultDoc[]> = {
  ownership: [
    {
      id: 'vdc-1',
      name: 'Builder Allotment Letter — C-801',
      type: 'pdf',
      size: 2_097_152,
      url: '',
      ocr: true,
      notes: 'Allotment letter from Nexus Realty for C-801, Tower C, Floor 8. Price: ₹1.12 Cr.',
      category: 'ownership',
      createdAt: ts(60),
    },
    {
      id: 'vdc-2',
      name: 'Builder-Buyer Agreement',
      type: 'pdf',
      size: 12_582_912,
      url: '',
      ocr: true,
      notes: 'Registered agreement. Possession ETA: Dec 2025. Penalty clause: ₹5/sq.ft/month delay.',
      category: 'ownership',
      createdAt: ts(55),
    },
  ],
  interior: [
    {
      id: 'vdc-3',
      name: 'Architect Floor Plan — 3BHK Type C',
      type: 'pdf',
      size: 8_388_608,
      url: '',
      ocr: false,
      notes: 'Builder-issued fit-out drawings. 1800 sqft. East-facing. 3BHK with attached master bath and 2 common baths.',
      category: 'interior',
      createdAt: ts(50),
    },
  ],
  maintenance: [
    {
      id: 'vdc-4',
      name: 'Construction Payment Schedule',
      type: 'pdf',
      size: 1_048_576,
      url: '',
      ocr: true,
      notes: '6-tranche construction-linked plan. 10% on booking, 10% on foundation, 15% on slab, 15% on brickwork, 25% on fit-out, 25% on possession.',
      category: 'maintenance',
      createdAt: ts(58),
    },
  ],
  tax: [],
  manuals: [],
  warranties: [],
}

// â”€â”€â”€ CONSTRUCTION — Snags (all construction-phase structural defects) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const DEMO_SNAGS_CONSTRUCTION: Snag[] = [
  {
    id: 'sn-c1',
    title: 'Hairline crack in load-bearing column',
    location: 'Living Room — Column C3',
    category: 'Structural',
    urgency: 'high',
    status: 'open',
    photoUrl: '/demo-assets/snag_column_crack.png',
    createdAt: ts(5),
    updatedAt: ts(5),
  },
  {
    id: 'sn-c2',
    title: 'False ceiling joist misaligned',
    location: 'Master Bedroom',
    category: 'False Ceiling',
    urgency: 'high',
    status: 'open',
    photoUrl: '/demo-assets/snag_ceiling.png',
    createdAt: ts(3),
    updatedAt: ts(3),
  },
  {
    id: 'sn-c3',
    title: 'Floor tile lippage exceeds 2mm',
    location: 'Kitchen',
    category: 'Tiling',
    urgency: 'medium',
    status: 'open',
    photoUrl: '/demo-assets/snag_tile_crack.png',
    createdAt: ts(4),
    updatedAt: ts(4),
  },
  {
    id: 'sn-c4',
    title: 'Electrical conduit not flush with wall',
    location: 'Bedroom 2',
    category: 'Electrical',
    urgency: 'medium',
    status: 'in-progress',
    photoUrl: '/demo-assets/snag_electrical.png',
    createdAt: ts(7),
    updatedAt: ts(2),
  },
  {
    id: 'sn-c5',
    title: 'Window frame putty incomplete',
    location: 'Balcony',
    category: 'Windows',
    urgency: 'medium',
    status: 'open',
    photoUrl: '/demo-assets/snag_window_seal.png',
    createdAt: ts(6),
    updatedAt: ts(6),
  },
  {
    id: 'sn-c6',
    title: 'Balcony waterproofing membrane not sealed at drain',
    location: 'Balcony',
    category: 'Waterproofing',
    urgency: 'high',
    status: 'open',
    photoUrl: '/demo-assets/snag_balcony.png',
    createdAt: ts(4),
    updatedAt: ts(4),
  },
]

// â”€â”€â”€ CONSTRUCTION — Timeline Events â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const DEMO_TIMELINE_CONSTRUCTION: TimelineEvent[] = [
  {
    id: 'tl-c1',
    date: '2024-04-10',
    category: 'purchase',
    icon: '🏗ï¸',
    title: 'Unit Booked — C-801 Nexus Towers',
    detail: 'Booking amount ₹5,60,000 (5%) paid. Allotment letter received. RERA No: P02400008231.',
    badge: 'Booked',
    badgeColor: 'text-gold-400',
    linkedId: 'vdc-1',
  },
  {
    id: 'tl-c2',
    date: '2024-05-15',
    category: 'legal',
    icon: '📝',
    title: 'Builder-Buyer Agreement Signed',
    detail: 'Registered agreement executed at SRO Financial District. Tranche linked to construction milestones.',
    badge: 'Legal',
    badgeColor: 'text-blue-400',
    linkedId: 'vdc-2',
  },
  {
    id: 'tl-c3',
    date: '2024-07-01',
    category: 'renovation',
    icon: '🏗ï¸',
    title: 'Foundation Slab Completed',
    detail: 'Milestone 2 achieved. Foundation and podium slab complete. Payment tranche 2 (₹11,20,000) paid.',
    badge: '✅ Done',
    badgeColor: 'text-emerald-400',
  },
  {
    id: 'tl-c4',
    date: '2024-10-20',
    category: 'renovation',
    icon: '🧱',
    title: 'Brickwork — Floors 1-5 Complete',
    detail: 'Milestone 3 complete. Brickwork, plastering, and roughing-in up to Floor 5. Tranche 3 (₹16,80,000) paid.',
    badge: '✅ Done',
    badgeColor: 'text-emerald-400',
  },
  {
    id: 'tl-c5',
    date: '2025-02-10',
    category: 'renovation',
    icon: '🔧',
    title: 'Fit-out Phase Started — Floor 8',
    detail: 'Internal fit-out begun on Floor 8. False ceiling, flooring, electrical roughing, plumbing fit-out underway.',
    badge: 'In Progress',
    badgeColor: 'text-amber-400',
  },
  {
    id: 'tl-c6',
    date: '2025-03-15',
    category: 'snag',
    icon: '🔴',
    title: 'Site Inspection — 6 Snags Logged',
    detail: 'First snagging inspection conducted. Found: column hairline crack (H), false ceiling misalignment (H), tile lippage (M), conduit protrusion (M), window putty (M), balcony waterproofing (H).',
    badge: 'Action Needed',
    badgeColor: 'text-red-400',
  },
]

// â”€â”€â”€ VILLA — G+2 Floor Room Specs (expanded) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const DEMO_ROOM_SPECS_VILLA: Record<string, RoomSpec> = {
  // Ground Floor
  'Living Room': {
    area: 480,
    flooring: 'Italian marble (900x900mm, Statuario Venato)',
    wallFinish: 'Textured wallpaper (Nilaya by Asian Paints) + feature wall slate cladding',
    paintColor: 'Warm Ivory — Asian Paints Royale Shyne #7724',
    ceiling: 'Coffered gypsum ceiling with recessed LED coves, 14 ft',
    furniture: ['L-shaped sectional sofa (Natuzzi, 3+2+2 seater)', 'Teak wood coffee table', 'Samsung 65" QLED wall-mounted', 'Zebrano wood TV unit with media storage'],
    extras: ['Central AC with plenum ducting (Daikin VRV)', 'Home automation panel (Schneider)', 'Floor-to-ceiling glass sliding door to garden'],
  },
  'Kitchen': {
    area: 220,
    flooring: 'Anti-skid ceramic tiles (600x600mm, Dark Slate)',
    wallFinish: 'Full-height subway tile backsplash + SS splash back on hob',
    paintColor: 'N/A — full tile finish',
    ceiling: 'Pop false ceiling with under-cabinet LED strip',
    furniture: ['Modular kitchen — Hettich fittings, Acrylic finish shutters', 'Bosch Series 8 induction hob (built-in)', 'Bosch dishwasher (built-in)', 'Gaggenau oven (built-in)', 'LG refrigerator side-by-side 687L'],
    extras: ['SS utility sink', 'Franke waste disposal', 'Kitchen island with breakfast counter (4 seater)'],
  },
  'Dining Room': {
    area: 180,
    flooring: 'Italian marble (continuation)',
    wallFinish: 'Painted — warm ivory',
    paintColor: 'Warm Ivory — Asian Paints Royale Shyne #7724',
    ceiling: 'Gypsum recessed with pendant chandelier (Flos)',
    furniture: ['8-seater dining table (teak + glass)', 'Upholstered dining chairs (8)'],
    extras: ['Wine rack (36 bottle, built-in)', 'Bar counter with under-cabinet storage'],
  },
  'Guest Bedroom (Grd)': {
    area: 180,
    flooring: 'Engineered wood (8mm Kronotex, Walnut)',
    wallFinish: 'Painted smooth',
    paintColor: 'Soft Sage — Asian Paints Royale #5437',
    ceiling: 'Gypsum border with spotlight track',
    furniture: ['Queen bed (Duroflex)', 'Bedside tables (2)', '4-door wardrobe (Hettich)'],
    extras: ['Attached bathroom with rain shower', 'AC (Daikin 1T)'],
  },
  // First Floor
  'Master Bedroom': {
    area: 320,
    flooring: 'Imported hardwood (Jatoba, Brazilian Cherry)',
    wallFinish: 'Velvet texture wallpaper — feature wall behind bed',
    paintColor: 'Charcoal Whisper — Asian Paints Royale #8812',
    ceiling: 'Cove LED ceiling with dimmable warm whites',
    furniture: ['King bed (Sleep Country, 6x7 ft teak frame)', 'Bedside tables — Italian marble top (2)', '8-door sliding wardrobe (Italian laminates)', 'Dressing table with vanity mirror'],
    extras: ['Walk-in wardrobe (180 sqft, custom)', 'En-suite bathroom with jacuzzi + steam shower', 'AC (Panasonic 1.5T inverter)', 'Balcony access'],
  },
  'Bedroom 2': {
    area: 200,
    flooring: 'Laminate wood (8mm, Light Oak)',
    wallFinish: 'Painted',
    paintColor: 'Sky Mist — Asian Paints Royale #3201',
    ceiling: 'Gypsum flat with recessed LED',
    furniture: ['Queen bed (Springfit)', 'Study desk + ergonomic chair', '4-door wardrobe (Hafele)'],
    extras: ['Attached bathroom', 'AC (LG 1T)'],
  },
  'Bedroom 3': {
    area: 190,
    flooring: 'Laminate wood (8mm, Walnut)',
    wallFinish: 'Painted',
    paintColor: 'Dusty Rose — Asian Paints Royale #4422',
    ceiling: 'Gypsum flat',
    furniture: ["Children's bunk bed (Flexa)", 'Study table (2-seater)', 'Storage wardrobe (Hettich)'],
    extras: ['AC (Daikin 1T)', 'Window seat with storage below'],
  },
  'Family Lounge': {
    area: 240,
    flooring: 'Patterned carpet (wall-to-wall, Axminster)',
    wallFinish: 'Wood panelling on one wall, painted rest',
    paintColor: 'Deep Navy — Asian Paints Royale #9201',
    ceiling: 'Coffered with exposed wood beams',
    furniture: ['3-seater sofa + 2 accent chairs', 'Console table', 'LG OLED 55" TV (second display)'],
    extras: ['Home theatre speaker setup (Bose 5.1)', 'Game console setup (PlayStation 5)', 'Reading nook with built-in shelves'],
  },
  // Second Floor
  'Terrace': {
    area: 800,
    flooring: 'Anti-skid terrace tiles (Matte WoodLook, 800x200mm)',
    wallFinish: 'Parapet wall with stone cladding',
    paintColor: 'N/A — exterior',
    ceiling: 'Open sky — steel pergola structure with shade sails',
    furniture: ['Outdoor L-sofa (teak + waterproof cushions)', 'Dining table + 6 chairs (teak)', 'BBQ grill island (Weber)'],
    extras: ['Landscaped planters', 'Outdoor shower point', 'Water feature (wall-mounted)', 'Utility store room (120 sqft)'],
  },
  'Study': {
    area: 140,
    flooring: 'Engineered wood (Oak)',
    wallFinish: 'Built-in bookshelves on three walls',
    paintColor: 'Forest Green — Asian Paints Royale #6631',
    ceiling: 'Exposed book architecture + spotlight track',
    furniture: ['Executive desk (teak, 8 ft)', 'Ergonomic chair (Herman Miller Aeron)', 'Built-in bookshelves (floor-to-ceiling)'],
    extras: ['AC (Daikin 1T)', 'Dual monitor arm setup', 'Hidden cable management'],
  },
}

// â”€â”€â”€ VILLA — enhanced snags (sn-5 gets window seal photo) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const DEMO_SNAGS_VILLA: Snag[] = [
  ...DEMO_SNAGS.filter(s => s.id !== 'sn-4' && s.id !== 'sn-5'),
  {
    id: 'sn-4',
    title: 'Living room ceiling light flickering',
    location: 'Living Room',
    category: 'Electrical',
    urgency: 'low',
    status: 'fixed',
    photoUrl: '/demo-assets/snag_electrical.png',
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
    photoUrl: '/demo-assets/snag_window_seal.png',
    createdAt: ts(15),
    updatedAt: ts(15),
  },
]

// â”€â”€â”€ MAIN DATA CATALOG â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const DEMO_DATA_CATALOG: Record<string, any> = {
  p_villa: {
    property: p_villa,
    assets: DEMO_WARRANTY_ASSETS,
    snags: DEMO_SNAGS_VILLA,
    vault: DEMO_VAULT_DOCS,
    stats: DEMO_STATS,
    rooms: DEMO_ROOMS,
    roomSpecs: DEMO_ROOM_SPECS_VILLA,
    events: DEMO_EVENTS,
    timeline: DEMO_TIMELINE_EVENTS,
  },
  p_rental: {
    property: p_rental,
    // Rental ONLY tracks fixed fittings: ACs, water heater, bathroom exhaust
    // NOT tracked: tenant's sofa, beds, fridge, TV (those belong to the tenant)
    assets: DEMO_WARRANTY_ASSETS_RENTAL,
    snags: DEMO_SNAGS_RENTAL,
    vault: DEMO_VAULT_DOCS_RENTAL,
    stats: {
      assetCount: DEMO_WARRANTY_ASSETS_RENTAL.length,
      expiringSoonCount: 0,
      openSnagCount: DEMO_SNAGS_RENTAL.filter(s => s.status === 'open').length,
    },
    rooms: DEMO_ROOMS.slice(0, 4),
    roomSpecs: DEMO_ROOM_SPECS,  // furnished 2BHK basics
    events: [
      {
        id: 'ev-rental-1',
        type: 'upload',
        title: 'AI Walkthrough Completed — Jan 2025',
        subtitle: 'Arjun submitted Q1 video. 3 issues flagged by AI.',
        icon: '🤖',
        createdAt: ts(2),
      },
      {
        id: 'ev-rental-2',
        type: 'snag_opened',
        title: 'Snag: AC Filter Blocked',
        subtitle: 'Master Bedroom · AI flagged · Medium urgency',
        icon: 'â„ï¸',
        createdAt: ts(2),
      },
    ],
    timeline: DEMO_TIMELINE_RENTAL,
  },
  p_empty: {
    property: p_empty,
    assets: [],    // Nothing yet — no appliances, no furniture, bare shell
    snags: [],     // No defects yet, construction hasn't started
    vault: DEMO_VAULT_DOCS_EMPTY,
    stats: { assetCount: 0, expiringSoonCount: 0, openSnagCount: 0 },
    rooms: DEMO_ROOMS,   // Show the planned floor plan
    roomSpecs: DEMO_ROOM_SPECS_EMPTY,
    events: [
      {
        id: 'ev-empty-1',
        type: 'vault_upload',
        title: 'GHMC Building Plan Approved',
        subtitle: 'Construction can begin Q3 2025',
        icon: '✅',
        createdAt: ts(10),
      },
      {
        id: 'ev-empty-2',
        type: 'snag_opened',
        title: 'Architect Quote Received',
        subtitle: '₹42L estimate for 3BHK fit-out',
        icon: '📐',
        createdAt: ts(5),
      },
    ],
    timeline: DEMO_TIMELINE_EMPTY,
  },
  p_construction: {
    property: p_construction,
    assets: [],    // No appliances — building under construction, nothing installed yet
    snags: DEMO_SNAGS_CONSTRUCTION,
    vault: DEMO_VAULT_DOCS_CONSTRUCTION,
    stats: {
      assetCount: 0,
      expiringSoonCount: 0,
      openSnagCount: DEMO_SNAGS_CONSTRUCTION.filter(s => s.status === 'open').length,
    },
    rooms: DEMO_ROOMS,
    roomSpecs: {},  // No finishes yet
    events: [
      {
        id: 'ev-const-1',
        type: 'upload',
        title: 'Fit-out Phase Started',
        subtitle: 'Floor 8 brickwork + false ceiling underway',
        icon: '🏗ï¸',
        createdAt: ts(3),
      },
      {
        id: 'ev-const-2',
        type: 'maintenance',
        title: '6 Snags from Inspection',
        subtitle: '3 High urgency items need builder action',
        icon: '🔴',
        createdAt: ts(2),
      },
    ],
    timeline: DEMO_TIMELINE_CONSTRUCTION,
  },
}

export function useDemoDataHook(activePropertyId: string | null) {
  const safeId = activePropertyId || 'p_villa'
  // Fallback to p_villa (the original rich demo) if invalid
  return DEMO_DATA_CATALOG[safeId] || DEMO_DATA_CATALOG.p_villa
}
