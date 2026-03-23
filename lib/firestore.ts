import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  where,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
  type Firestore,
} from 'firebase/firestore'
import { db } from './firebase'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WarrantyAsset {
  id: string
  name: string
  icon: string
  zone: string
  brand: string
  model: string
  serialNumber: string
  purchaseDate: string        // YYYY-MM-DD
  warrantyExpiry: string      // YYYY-MM-DD
  nextService: string | null  // ISO date string
  invoiceUrl: string | null   // Storage URL
  photoUrl?: string | null  // New Premium Image field
  source: 'manual' | 'gmail_sync'
  createdAt: Timestamp
}

export interface VaultDoc {
  id: string
  name: string
  type: 'pdf' | 'image' | 'other'
  size: number
  url: string
  ocr: boolean
  notes: string
  category: string
  createdAt: Timestamp | null
}

export interface Snag {
  id: string
  title: string
  location: string
  category: string
  urgency: 'low' | 'medium' | 'high'
  status: 'open' | 'in-progress' | 'fixed'
  photoUrl: string | null
  createdAt: Timestamp | null
  updatedAt: Timestamp | null
}

export interface ShareLink {
  id: string
  recipient: string
  scope: string
  token: string
  expiresAt: Timestamp
  passwordProtected: boolean
  watermark: boolean
  views: number
  status: 'active' | 'revoked'
  createdAt: Timestamp | null
}

export interface FloorPlanRoom {
  name: string   // e.g. "Living Room", "Master Bedroom"
  x: number      // left edge as % of floor plan (0–100)
  y: number      // top edge as % of floor plan (0–100)
  w: number      // width as %
  h: number      // height as %
}

/** A single draggable item on the Konva home-plan canvas */
export interface HomePlanItem {
  id: string
  type: string          // 'sofa'|'bed'|'table'|'wardrobe'|'sink'|'hob'|'fridge'|'desk'|'chair'|'tv'|'toilet'
  roomName: string      // which room it belongs to
  x: number             // x on canvas (0–100 relative %)
  y: number             // y on canvas (0–100 relative %)
  w: number             // width %
  h: number             // height %
  rotation: number      // degrees
  color: string         // hex color
  style: 'minimal' | 'modern' | 'classic'
  label?: string        // optional custom label
  vaultItemId?: string  // linked warranty/vault item
}
export interface UnitType {
  id: string
  label: string              // e.g. "3BHK West"
  bedrooms: number
  bathrooms: number
  area: number               // sq ft
  configuration: string      // e.g. "West-facing"
  floorRange: [number, number]
  flatNumberPattern?: string // regex string to match flat numbers
  genericDocs: string[]      // Storage URLs for floor plans etc.
  floorPlanUrl?: string      // Primary floor plan PNG URL (Firebase Storage)
  svgFloorPlan?: string      // AI-generated SVG string (Gemini 2.0 Flash)
  rooms?: FloorPlanRoom[]    // Room centroids for interactive hotspot overlay
}

export interface ProjectListing {
  id: string
  name: string
  city: string
  developer: string
  blocks?: string[]
  totalUnits?: number
  verified: boolean
  searchKeywords: string[]
  createdAt: Timestamp | null
}

export interface Property {
  id: string            // Firestore doc ID (populated when read)
  name: string          // e.g. "Oberoi Residences"
  unit: string          // e.g. "12B, Tower A"
  area: number          // sq ft
  floorPlanType: string // e.g. "3BHK"
  location: string      // e.g. "Worli, Mumbai"
  gmailLinked: boolean
  // Project database linkage (optional — set when user selects from database)
  projectId?: string
  unitTypeId?: string
  unitTypeLabel?: string
  floorPlanUrl?: string     // Firebase Storage URL for the floor plan PNG
  heroImageUrl?: string     // Hero/thumbnail image for the property card
  rooms?: FloorPlanRoom[]   // AI-extracted room bounding boxes
  homePlan?: HomePlanItem[] // User-edited Konva canvas state
  occupancy?: 'residing' | 'rented' | 'empty' | 'renovation'
  createdAt: Timestamp | null
}

// ─── Path Helpers (backward-compat: 'primary' → top-level collections) ────────

function propCol(firestore: Firestore, uid: string, pid: string, col: string) {
  if (pid === 'primary') return collection(firestore, 'users', uid, col)
  return collection(firestore, 'users', uid, 'properties', pid, col)
}

function propDocRef(firestore: Firestore, uid: string, pid: string, col: string, docId: string) {
  if (pid === 'primary') return doc(firestore, 'users', uid, col, docId)
  return doc(firestore, 'users', uid, 'properties', pid, col, docId)
}

function vaultColRef(firestore: Firestore, uid: string, pid: string, cat: string) {
  if (pid === 'primary') return collection(firestore, 'users', uid, 'vault', cat, 'docs')
  return collection(firestore, 'users', uid, 'properties', pid, 'vault', cat, 'docs')
}

function vaultDocRefFn(firestore: Firestore, uid: string, pid: string, cat: string, docId: string) {
  if (pid === 'primary') return doc(firestore, 'users', uid, 'vault', cat, 'docs', docId)
  return doc(firestore, 'users', uid, 'properties', pid, 'vault', cat, 'docs', docId)
}

function requireDb(): Firestore {
  if (!db) throw new Error('Firestore not initialized')
  return db
}

// ─── Warranty Assets ──────────────────────────────────────────────────────────

export function subscribeWarrantyAssets(
  uid: string,
  callback: (assets: WarrantyAsset[]) => void,
  pid: string = 'primary'
): Unsubscribe {
  const firestore = requireDb()
  const q = query(propCol(firestore, uid, pid, 'warranty_assets'), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as WarrantyAsset))))
}

export async function addWarrantyAsset(
  uid: string,
  data: Omit<WarrantyAsset, 'id' | 'createdAt'>,
  pid: string = 'primary'
) {
  const firestore = requireDb()
  return addDoc(propCol(firestore, uid, pid, 'warranty_assets'), { ...data, createdAt: serverTimestamp() })
}

export async function deleteWarrantyAsset(uid: string, assetId: string, pid: string = 'primary') {
  const firestore = requireDb()
  await deleteDoc(propDocRef(firestore, uid, pid, 'warranty_assets', assetId))
}

// ─── Vault Docs ───────────────────────────────────────────────────────────────

export const VAULT_CATEGORIES = ['ownership', 'maintenance', 'interior', 'tax', 'manuals', 'warranties'] as const
export type VaultCategory = typeof VAULT_CATEGORIES[number]

export function subscribeVaultDocs(
  uid: string,
  category: string,
  callback: (docs: VaultDoc[]) => void,
  pid: string = 'primary'
): Unsubscribe {
  const firestore = requireDb()
  const q = query(vaultColRef(firestore, uid, pid, category), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as VaultDoc))))
}

export function subscribeAllVaultCategories(
  uid: string,
  callback: (data: Record<string, VaultDoc[]>) => void,
  pid: string = 'primary'
): Unsubscribe {
  const firestore = requireDb()
  const state: Record<string, VaultDoc[]> = {}
  const unsubs: Unsubscribe[] = []
  for (const cat of VAULT_CATEGORIES) {
    const q = query(vaultColRef(firestore, uid, pid, cat), orderBy('createdAt', 'desc'))
    unsubs.push(onSnapshot(q, (snap) => {
      state[cat] = snap.docs.map((d) => ({ id: d.id, ...d.data() } as VaultDoc))
      callback({ ...state })
    }))
  }
  return () => unsubs.forEach((u) => u())
}

export async function addVaultDoc(
  uid: string,
  category: string,
  data: Omit<VaultDoc, 'id' | 'createdAt'>,
  pid: string = 'primary'
) {
  const firestore = requireDb()
  return addDoc(vaultColRef(firestore, uid, pid, category), { ...data, createdAt: serverTimestamp() })
}

export async function deleteVaultDoc(uid: string, category: string, docId: string, pid: string = 'primary') {
  const firestore = requireDb()
  await deleteDoc(vaultDocRefFn(firestore, uid, pid, category, docId))
}

// ─── Snags ────────────────────────────────────────────────────────────────────

export function subscribeSnags(
  uid: string,
  callback: (snags: Snag[]) => void,
  pid: string = 'primary'
): Unsubscribe {
  const firestore = requireDb()
  const q = query(propCol(firestore, uid, pid, 'snags'), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Snag))))
}

export async function addSnag(
  uid: string,
  data: Omit<Snag, 'id' | 'createdAt' | 'updatedAt'>,
  pid: string = 'primary'
) {
  const firestore = requireDb()
  return addDoc(propCol(firestore, uid, pid, 'snags'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function updateSnagStatus(uid: string, snagId: string, status: Snag['status'], pid: string = 'primary') {
  const firestore = requireDb()
  await updateDoc(propDocRef(firestore, uid, pid, 'snags', snagId), { status, updatedAt: serverTimestamp() })
}

export async function updateSnagPhotoUrl(uid: string, snagId: string, photoUrl: string, pid: string = 'primary') {
  const firestore = requireDb()
  await updateDoc(propDocRef(firestore, uid, pid, 'snags', snagId), { photoUrl, updatedAt: serverTimestamp() })
}

// ─── Share Links ──────────────────────────────────────────────────────────────

export function subscribeShareLinks(
  uid: string,
  callback: (links: ShareLink[]) => void,
  pid: string = 'primary'
): Unsubscribe {
  const firestore = requireDb()
  const q = query(propCol(firestore, uid, pid, 'share_links'), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ShareLink))))
}

export async function createShareLink(
  uid: string,
  data: Omit<ShareLink, 'id' | 'createdAt' | 'views' | 'status' | 'token'> & { categories?: string[] },
  pid: string = 'primary'
): Promise<{ ref: Awaited<ReturnType<typeof addDoc>>; token: string }> {
  const firestore = requireDb()
  const token = Array.from(crypto.getRandomValues(new Uint8Array(6)))
    .map((b) => b.toString(36).padStart(2, '0'))
    .join('')
    .toUpperCase()
    .slice(0, 10)
  const docRef = await addDoc(propCol(firestore, uid, pid, 'share_links'), {
    ...data,
    token,
    views: 0,
    status: 'active',
    createdAt: serverTimestamp(),
  })
  await setDoc(doc(firestore, 'share_tokens', token), {
    uid,
    pid,
    linkId: docRef.id,
    expiresAt: data.expiresAt,
    status: 'active',
    recipient: data.recipient,
    scope: data.scope,
    categories: (data as { categories?: string[] }).categories ?? [],
    passwordProtected: data.passwordProtected,
    watermark: data.watermark,
  })
  return { ref: docRef, token }
}

export async function revokeShareLink(uid: string, linkId: string, pid: string = 'primary') {
  const firestore = requireDb()
  // Read the link first to get the token, so we can also invalidate the top-level share_tokens entry
  const linkSnap = await getDoc(propDocRef(firestore, uid, pid, 'share_links', linkId))
  if (linkSnap.exists()) {
    const token = linkSnap.data()?.token as string | undefined
    if (token) {
      // Delete the top-level lookup so /view/[token] immediately returns 404 / expired
      await deleteDoc(doc(firestore, 'share_tokens', token))
    }
  }
  await deleteDoc(propDocRef(firestore, uid, pid, 'share_links', linkId))
}

// ─── Properties ───────────────────────────────────────────────────────────────

/** Create / update the 'primary' property (used by onboarding for first setup) */
export async function createProperty(uid: string, data: Omit<Property, 'id' | 'createdAt'>) {
  const firestore = requireDb()
  await setDoc(doc(firestore, 'users', uid, 'properties', 'primary'), {
    ...data,
    createdAt: serverTimestamp(),
  })
}

/** Create an additional property with an auto-generated ID. Returns the new property ID. */
export async function createNewProperty(uid: string, data: Omit<Property, 'id' | 'createdAt'>): Promise<string> {
  const firestore = requireDb()
  const docRef = await addDoc(collection(firestore, 'users', uid, 'properties'), {
    ...data,
    createdAt: serverTimestamp(),
  })
  return docRef.id
}

export async function getProperty(uid: string, pid: string = 'primary'): Promise<Property | null> {
  const firestore = requireDb()
  const snap = await getDoc(doc(firestore, 'users', uid, 'properties', pid))
  return snap.exists() ? { id: snap.id, ...(snap.data() as Omit<Property, 'id'>) } : null
}

export function subscribeProperty(
  uid: string,
  callback: (property: Property | null) => void,
  pid: string = 'primary'
): Unsubscribe {
  const firestore = requireDb()
  return onSnapshot(doc(firestore, 'users', uid, 'properties', pid), (snap) => {
    callback(snap.exists() ? { id: snap.id, ...(snap.data() as Omit<Property, 'id'>) } : null)
  })
}

export function subscribeAllProperties(uid: string, callback: (properties: Property[]) => void): Unsubscribe {
  const firestore = requireDb()
  const q = query(collection(firestore, 'users', uid, 'properties'), orderBy('createdAt', 'asc'))
  return onSnapshot(q, (snap) =>
    callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Property, 'id'>) })))
  )
}

export async function updateProperty(uid: string, pid: string, data: Partial<Omit<Property, 'id' | 'createdAt'>>) {
  const firestore = requireDb()
  await updateDoc(doc(firestore, 'users', uid, 'properties', pid), data)
}

export async function setActiveProperty(uid: string, propertyId: string) {
  const firestore = requireDb()
  await setDoc(doc(firestore, 'users', uid), { activePropertyId: propertyId }, { merge: true })
}

// ─── Projects (Community Database) ───────────────────────────────────────────

/** Search projects by keyword (case-insensitive prefix match via searchKeywords array) */
export async function searchProjects(queryText: string): Promise<ProjectListing[]> {
  const firestore = requireDb()
  const term = queryText.toLowerCase().trim()
  if (!term) return []
  const q = query(
    collection(firestore, 'projects'),
    where('searchKeywords', 'array-contains', term),
    limit(10)
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ProjectListing, 'id'>) }))
}

/** Fetch all unit types for a project */
export async function getProjectUnitTypes(projectId: string): Promise<UnitType[]> {
  const firestore = requireDb()
  const snap = await getDocs(collection(firestore, 'projects', projectId, 'unitTypes'))
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<UnitType, 'id'>) }))
}

/** Fetch a single project listing */
export async function getProject(projectId: string): Promise<ProjectListing | null> {
  const firestore = requireDb()
  const snap = await getDoc(doc(firestore, 'projects', projectId))
  return snap.exists() ? { id: snap.id, ...(snap.data() as Omit<ProjectListing, 'id'>) } : null
}

/** Attempt to resolve a flat number to a unit type using flatNumberPattern regex */
export function matchUnitTypeByFlat(flatNumber: string, unitTypes: UnitType[]): UnitType | null {
  for (const ut of unitTypes) {
    if (!ut.flatNumberPattern) continue
    try {
      if (new RegExp(ut.flatNumberPattern, 'i').test(flatNumber)) return ut
    } catch {
      // invalid regex in data — skip
    }
  }
  return null
}

// ─── App Events (Timeline) ────────────────────────────────────────────────────

export interface AppEvent {
  id: string
  type: 'vault_upload' | 'asset_added' | 'snag_opened' | 'snag_fixed' | 'link_created'
  title: string
  subtitle: string
  icon: string
  createdAt: Timestamp | null
}

export async function addEvent(uid: string, data: Omit<AppEvent, 'id' | 'createdAt'>, pid: string = 'primary') {
  const firestore = requireDb()
  return addDoc(propCol(firestore, uid, pid, 'events'), { ...data, createdAt: serverTimestamp() })
}

export function subscribeEvents(uid: string, callback: (events: AppEvent[]) => void, pid: string = 'primary'): Unsubscribe {
  const firestore = requireDb()
  const q = query(propCol(firestore, uid, pid, 'events'), orderBy('createdAt', 'desc'), limit(10))
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AppEvent))))
}

// ─── Share Tokens (top-level lookup for public /view route) ───────────────────

export interface ShareTokenLookup {
  uid: string
  pid?: string
  linkId: string
  expiresAt: Timestamp
  status: 'active' | 'revoked'
  recipient: string
  scope: string
  categories: string[]
  passwordProtected: boolean
  watermark: boolean
}

export async function getShareLinkByToken(token: string): Promise<ShareTokenLookup | null> {
  const firestore = requireDb()
  const snap = await getDoc(doc(firestore, 'share_tokens', token))
  return snap.exists() ? (snap.data() as ShareTokenLookup) : null
}

// ─── Dashboard Live Stats ─────────────────────────────────────────────────────

export interface DashboardStats {
  assetCount: number
  expiringSoonCount: number
  openSnagCount: number
}

export function subscribeDashboardStats(
  uid: string,
  callback: (stats: DashboardStats) => void,
  pid: string = 'primary'
): Unsubscribe {
  const firestore = requireDb()
  let warrantyAssets: WarrantyAsset[] = []
  let snags: Snag[] = []

  function emit() {
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const expiringSoon = warrantyAssets.filter((a) => {
      if (!a.warrantyExpiry) return false
      const exp = new Date(a.warrantyExpiry)
      return exp > now && exp <= thirtyDaysFromNow
    }).length
    callback({
      assetCount: warrantyAssets.length,
      expiringSoonCount: expiringSoon,
      openSnagCount: snags.filter((s) => s.status === 'open').length,
    })
  }

  const u1 = onSnapshot(propCol(firestore, uid, pid, 'warranty_assets'), (snap) => {
    warrantyAssets = snap.docs.map((d) => ({ id: d.id, ...d.data() } as WarrantyAsset))
    emit()
  })
  const u2 = onSnapshot(propCol(firestore, uid, pid, 'snags'), (snap) => {
    snags = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Snag))
    emit()
  })
  return () => { u1(); u2() }
}

// ─── User Profile ─────────────────────────────────────────────────────────────

export interface UserProfile {
  email: string | null
  phone: string | null
  emailVerified: boolean
  phoneVerified: boolean
  displayName: string | null
  photoURL: string | null
  profileCompletionSkipped: boolean
  notificationsEnabled: boolean
  areaUnit: 'sq ft' | 'm²'
  fcmToken: string | null
  activePropertyId: string | null
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const firestore = requireDb()
  const snap = await getDoc(doc(firestore, 'users', uid))
  return snap.exists() ? (snap.data() as UserProfile) : null
}

export function subscribeUserProfile(uid: string, callback: (profile: UserProfile | null) => void): Unsubscribe {
  const firestore = requireDb()
  return onSnapshot(doc(firestore, 'users', uid), (snap) => {
    callback(snap.exists() ? (snap.data() as UserProfile) : null)
  })
}

export async function saveUserProfile(uid: string, data: Partial<UserProfile>) {
  const firestore = requireDb()
  await setDoc(doc(firestore, 'users', uid), data, { merge: true })
}
