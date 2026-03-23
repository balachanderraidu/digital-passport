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
    photoUrl: '/demo-assets/snag_structural.png',
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
    photoUrl: '/demo-assets/snag_structural.png',
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

// ─── Item Cross-Reference Layer ────────────────────────────────────────────────
// Everything hangs off Room → Spec → Item.
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

  // ── Living Room ──────────────────────────────────────────────────────────────
  '1.5T LG Split AC (window right)': {
    warrantyId: 'wa-1',
    serviceHistory: [
      { date: '2024-03-18', type: 'Installation', tech: 'LG Authorised Service – Hyderabad', contact: '+91 98490 11223', notes: 'Unit installed, tested and commissioned. Gas charged at factory spec.', invoiceRef: 'LG-INST-2024-0012', cost: 0 },
      { date: '2024-09-05', type: 'Annual Service', tech: 'LG Authorised Service – Hyderabad', contact: '+91 98490 11223', notes: 'Indoor/outdoor coil cleaned, drain pipe flushed, gas pressure verified (8.2 bar). Filter washed.', invoiceRef: 'LG-SVC-2024-0891', cost: 850 },
      { date: '2025-03-10', type: 'Annual Service', tech: 'LG Authorised Service – Hyderabad', contact: '+91 98490 11223', notes: 'Full service done — coil cleaned, refrigerant topped up 150g, remote battery replaced. Warranty expires in 15 days; renewal advised.', invoiceRef: 'LG-SVC-2025-0214', cost: 1200 },
    ],
  },
  'Samsung 55″ QLED TV on wall mount': {
    warrantyId: 'wa-2',
    serviceHistory: [
      { date: '2024-08-22', type: 'Installation', tech: 'Samsung SmartCare – Hyderabad', contact: 'smartcare.hyd@samsung.in', notes: 'TV wall-mounted (75° tilt bracket), calibrated for room ambient lighting conditions.', invoiceRef: 'SC-INST-2024-0445', cost: 0 },
    ],
  },

  // ── Kitchen ──────────────────────────────────────────────────────────────────
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

  // ── Master Bedroom ───────────────────────────────────────────────────────────
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

  // ── Bathroom (en-suite + common) ─────────────────────────────────────────────
  'Racold 25L water heater': {
    warrantyId: 'wa-6',
    snagIds: [],
    serviceHistory: [
      { date: '2024-08-30', type: 'Installation', tech: 'Racold Authorised – Hyderabad', contact: '+91 90000 55443', notes: 'Unit wall-mounted above shower point. Pressure relief valve tested (opens at 8 bar). Earthing loop verified with tester.', invoiceRef: 'RAC-INST-2024-0199', cost: 0 },
      { date: '2025-01-10', type: 'Annual Service', tech: 'Racold Authorised – Hyderabad', contact: '+91 90000 55443', notes: 'Magnesium anode rod inspected — 30% consumed, still healthy (replacement advised in ~18 months). Tank flushed of sediment. Thermostat recalibrated to 55°C.', invoiceRef: 'RAC-SVC-2025-0012', cost: 600 },
    ],
  },
  'Dyson V11 Vacuum Cleaner': {
    warrantyId: 'wa-8',
    serviceHistory: [
      { date: '2023-06-15', type: 'Installation', tech: 'Self', notes: 'Unboxed and assembled. All accessories tested: floor head, crevice tool, mini motorized tool.', cost: 0 },
      { date: '2024-06-10', type: 'Cleaning', tech: 'Self', notes: 'HEPA filter washed and dried 24h. Bin emptied and rinsed. Brush bar removed — hair tangled at ends cleared.', cost: 0 },
    ],
  },

  // ── Flooring snag cross-links ────────────────────────────────────────────────
  'Anti-skid vitrified tile (600×600 mm, Terracotta)': {
    snagIds: ['sn-3'],   // Balcony waterproofing peeling near drain
  },
  'Kajaria Porcelain (800×800 mm), Light Beige': {
    snagIds: ['sn-1'],   // Bathroom floor tiles cracked
  },
  'Frameless shower partition (8mm glass)': {
    snagIds: ['sn-5'],   // Bedroom 2 window sealing gap (closest demo snag)
  },

  // ── Vault doc links ───────────────────────────────────────────────────────────
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

// ─── Warranty Assets ──────────────────────────────────────────────────────────


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
    icon: '☕',
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
    icon: '❄️',
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
    photoUrl: '/demo-assets/snag_paint.png',
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
    photoUrl: '/demo-assets/snag_paint.png',
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

// ─── Property Timeline ─────────────────────────────────────────────────────────
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
  // ── 2023 ──────────────────────────────────────────────────────────────────
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

  // ── 2024 ──────────────────────────────────────────────────────────────────
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
    icon: '❄️',
    title: 'LG AC 1.5T Installed',
    detail: 'LG RS-Q19JNXE installed in living room by LG Authorised Service, Hyderabad. Invoice #LG-INST-2024-0012.',
    linkedId: 'wa-1',
  },
  {
    id: 'tl-6',
    date: '2024-08-22',
    category: 'installation',
    icon: '📺',
    title: 'Samsung 55″ QLED Mounted',
    detail: 'TV wall-mounted (75° tilt bracket) by Samsung SmartCare. Invoice #SC-INST-2024-0445.',
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
    icon: '🛏️',
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
    icon: '🍽️',
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
    icon: '❄️',
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

  // ── 2025 ──────────────────────────────────────────────────────────────────
  {
    id: 'tl-17',
    date: '2025-01-10',
    category: 'service',
    icon: '🔧',
    title: 'Racold Heater — Annual Service',
    detail: 'Anode rod 30% consumed, tank flushed, thermostat at 55°C. Invoice #RAC-SVC-2025-0012. ₹600.',
    linkedId: 'wa-6',
  },
  {
    id: 'tl-18',
    date: '2025-02-18',
    category: 'warranty',
    icon: '🛡️',
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
    badge: '⚠️ Expiring Soon',
    badgeColor: 'text-amber-400',
    linkedId: 'wa-1',
  },
  {
    id: 'tl-22',
    date: '2025-03-21',
    category: 'warranty',
    icon: '⚠️',
    title: 'LG AC Warranty — Expiring in 15 Days',
    detail: 'Warranty for LG RS-Q19JNXE expires soon. Consider AMC renewal with LG Authorised, Hyderabad (+91 98490 11223).',
    badge: 'Action Needed',
    badgeColor: 'text-amber-400',
    linkedId: 'wa-1',
  },
]

// ─── DEEP DEMO MULTI-PROPERTY ARCHITECTURE ──────────────────────────────────────

export const p_villa: Property = {
  id: 'p_villa',
  name: 'Premium Villa (Self-Occupied)',
  unit: 'Villa 42, Cloud 9',
  area: 4500,
  floorPlanType: '5BHK Triplex',
  location: 'Gachibowli, Hyderabad',
  gmailLinked: true,
  projectId: 'demo-project',
  unitTypeId: '5bhk-villa',
  unitTypeLabel: 'Luxury Triplex',
  occupancy: 'residing',
  floorPlanUrl: '/demo-assets/floor_plan.png',
  createdAt: ts(90),
}

export const p_rental: Property = {
  id: 'p_rental',
  name: 'Rental Apartment (Tenant)',
  unit: 'Apt 14B, Lakeside Towers',
  area: 1250,
  floorPlanType: '2BHK',
  location: 'Kondapur, Hyderabad',
  gmailLinked: false,
  projectId: 'demo-project',
  unitTypeId: '2bhk-west',
  unitTypeLabel: '2BHK West',
  occupancy: 'rented',
  floorPlanUrl: '/demo-assets/floor_plan.png',
  createdAt: ts(120),
}

export const p_empty: Property = {
  id: 'p_empty',
  name: 'Empty Bare Shell',
  unit: 'Plot 104, Green Meadows',
  area: 2400,
  floorPlanType: 'Plot',
  location: 'Outskirts, Hyderabad',
  gmailLinked: false,
  projectId: 'demo-project',
  unitTypeId: 'demo-empty',
  unitTypeLabel: 'Bare Shell',
  occupancy: 'empty',
  floorPlanUrl: '/demo-assets/floor_plan.png',
  createdAt: ts(5),
}

export const p_construction: Property = {
  id: 'p_construction',
  name: 'Active Construction Site',
  unit: 'Tower 3, Floor 8',
  area: 1800,
  floorPlanType: '3BHK',
  location: 'Financial District',
  gmailLinked: false,
  projectId: 'demo-project',
  unitTypeId: 'demo-active',
  unitTypeLabel: 'Under Construction',
  occupancy: 'renovation',
  floorPlanUrl: '/demo-assets/floor_plan.png',
  createdAt: ts(1),
}

export const DEMO_PROPERTIES = [p_villa, p_rental, p_empty, p_construction]

export const DEMO_DATA_CATALOG: Record<string, any> = {
  p_villa: {
    property: p_villa,
    assets: DEMO_WARRANTY_ASSETS,
    snags: DEMO_SNAGS,
    vault: DEMO_VAULT_DOCS,
    stats: DEMO_STATS,
    rooms: DEMO_ROOMS,
    roomsSpecs: DEMO_ROOM_SPECS,
    events: DEMO_EVENTS,
  },
  p_rental: {
    property: p_rental,
    // Rental only has fixed items, no TVs/Gaming consoles.
    assets: DEMO_WARRANTY_ASSETS.filter(a => ['Kitchen', 'Utility', 'General'].includes(a.zone)),
    snags: [
      {
        id: 'sn-rental-1',
        title: '[AI Flagged] AC Dust Filter block',
        location: 'Master Bedroom',
        category: 'Maintenance',
        urgency: 'medium',
        status: 'open',
        photoUrl: 'https://images.unsplash.com/photo-1598928506311-c55dd1b6e159?auto=format&fit=crop&q=80&w=800',
        createdAt: ts(0),
        updatedAt: ts(0),
      },
      {
        id: 'sn-rental-2',
        title: '[AI Flagged] Minor wall scuff',
        location: 'Living Room',
        category: 'Maintenance',
        urgency: 'low',
        status: 'open',
        photoUrl: null,
        createdAt: ts(0),
        updatedAt: ts(0),
      }
    ],
    vault: {},
    stats: { assetCount: 6, expiringSoonCount: 0, openSnagCount: 2 },
    rooms: DEMO_ROOMS.slice(0, 3),
    roomsSpecs: {},
    events: [
      {
        id: 'ev-rental-1',
        type: 'upload',
        title: 'Monthly Walkthrough Video Submitted',
        detail: 'Tenant successfully uploaded the Q3 walkthrough video. AI Analysis is complete.',
        badge: 'Inspected',
        badgeColor: 'text-blue-400',
        linkedId: null,
      }
    ],
  },
  p_empty: {
    property: p_empty,
    assets: [],
    snags: [],
    vault: {},
    stats: { assetCount: 0, expiringSoonCount: 0, openSnagCount: 0 },
    rooms: [],
    roomsSpecs: {},
    events: [],
  },
  p_construction: {
    property: p_construction,
    assets: [],
    snags: DEMO_SNAGS_ACTIVE,
    vault: {},
    stats: { assetCount: 0, expiringSoonCount: 0, openSnagCount: 5 },
    rooms: DEMO_ROOMS,
    roomsSpecs: {}, // No final finishes yet
    events: [
      {
        id: 'ev-const-1',
        type: 'upload',
        title: 'Site Progress: Foundation',
        detail: 'The project team uploaded the latest drone footage of the site. Foundation and core pouring initialized.',
        badge: 'On Track',
        badgeColor: 'text-green-400',
        linkedId: null,
      },
      {
        id: 'ev-const-2',
        type: 'maintenance',
        title: 'Payment Milestone #2 Approaching',
        detail: '15% payment due upon completion of the Podium Slab. Expected next week.',
        badge: 'Action Needed',
        badgeColor: 'text-amber-400',
        linkedId: null,
      }
    ],
  }
}

export function useDemoDataHook(activePropertyId: string | null) {
  const safeId = activePropertyId || 'p_villa'
  // Fallback to p_villa (the original rich demo) if invalid 
  return DEMO_DATA_CATALOG[safeId] || DEMO_DATA_CATALOG.p_villa
}
