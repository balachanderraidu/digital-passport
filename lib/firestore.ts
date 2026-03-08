import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  deleteDoc,
  updateDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  where,
  limit,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
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
  purchaseDate: string        // ISO date string
  warrantyExpiry: string      // ISO date string
  nextService: string | null  // ISO date string
  invoiceUrl: string | null   // Storage URL
  createdAt: Timestamp | null
}

export interface VaultDoc {
  id: string
  name: string
  type: 'pdf' | 'image' | 'other'
  size: number
  url: string                 // Storage download URL
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function requireDb() {
  if (!db) throw new Error('Firestore not initialized')
  return db
}

// ─── Warranty Assets ──────────────────────────────────────────────────────────

export function subscribeWarrantyAssets(
  uid: string,
  callback: (assets: WarrantyAsset[]) => void
): Unsubscribe {
  const firestore = requireDb()
  const ref = collection(firestore, 'users', uid, 'warranty_assets')
  const q = query(ref, orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snap) => {
    const assets = snap.docs.map((d) => ({ id: d.id, ...d.data() } as WarrantyAsset))
    callback(assets)
  })
}

export async function addWarrantyAsset(
  uid: string,
  data: Omit<WarrantyAsset, 'id' | 'createdAt'>
) {
  const firestore = requireDb()
  const ref = collection(firestore, 'users', uid, 'warranty_assets')
  return addDoc(ref, { ...data, createdAt: serverTimestamp() })
}

export async function deleteWarrantyAsset(uid: string, assetId: string) {
  const firestore = requireDb()
  await deleteDoc(doc(firestore, 'users', uid, 'warranty_assets', assetId))
}

// ─── Vault Docs ───────────────────────────────────────────────────────────────

export const VAULT_CATEGORIES = ['ownership', 'maintenance', 'interior', 'tax', 'manuals', 'warranties'] as const
export type VaultCategory = typeof VAULT_CATEGORIES[number]

export function subscribeVaultDocs(
  uid: string,
  category: string,
  callback: (docs: VaultDoc[]) => void
): Unsubscribe {
  const firestore = requireDb()
  const ref = collection(firestore, 'users', uid, 'vault', category, 'docs')
  const q = query(ref, orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snap) => {
    const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as VaultDoc))
    callback(docs)
  })
}

/**
 * Subscribes to all 6 vault categories simultaneously.
 * Calls back with a map of { [category]: VaultDoc[] } on any change.
 */
export function subscribeAllVaultCategories(
  uid: string,
  callback: (data: Record<string, VaultDoc[]>) => void
): Unsubscribe {
  const firestore = requireDb()
  const state: Record<string, VaultDoc[]> = {}
  const unsubs: Unsubscribe[] = []

  for (const cat of VAULT_CATEGORIES) {
    const ref = collection(firestore, 'users', uid, 'vault', cat, 'docs')
    const q = query(ref, orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      state[cat] = snap.docs.map((d) => ({ id: d.id, ...d.data() } as VaultDoc))
      callback({ ...state })
    })
    unsubs.push(unsub)
  }

  return () => unsubs.forEach((u) => u())
}

export async function addVaultDoc(
  uid: string,
  category: string,
  data: Omit<VaultDoc, 'id' | 'createdAt'>
) {
  const firestore = requireDb()
  const ref = collection(firestore, 'users', uid, 'vault', category, 'docs')
  return addDoc(ref, { ...data, createdAt: serverTimestamp() })
}

export async function deleteVaultDoc(uid: string, category: string, docId: string) {
  const firestore = requireDb()
  await deleteDoc(doc(firestore, 'users', uid, 'vault', category, 'docs', docId))
}

// ─── Snags ────────────────────────────────────────────────────────────────────

export function subscribeSnags(
  uid: string,
  callback: (snags: Snag[]) => void
): Unsubscribe {
  const firestore = requireDb()
  const ref = collection(firestore, 'users', uid, 'snags')
  const q = query(ref, orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snap) => {
    const snags = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Snag))
    callback(snags)
  })
}

export async function addSnag(
  uid: string,
  data: Omit<Snag, 'id' | 'createdAt' | 'updatedAt'>
) {
  const firestore = requireDb()
  const ref = collection(firestore, 'users', uid, 'snags')
  return addDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function updateSnagStatus(
  uid: string,
  snagId: string,
  status: Snag['status']
) {
  const firestore = requireDb()
  await updateDoc(doc(firestore, 'users', uid, 'snags', snagId), {
    status,
    updatedAt: serverTimestamp(),
  })
}

// ─── Share Links ──────────────────────────────────────────────────────────────

export function subscribeShareLinks(
  uid: string,
  callback: (links: ShareLink[]) => void
): Unsubscribe {
  const firestore = requireDb()
  const ref = collection(firestore, 'users', uid, 'share_links')
  const q = query(ref, orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snap) => {
    const links = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ShareLink))
    callback(links)
  })
}

export async function createShareLink(
  uid: string,
  data: Omit<ShareLink, 'id' | 'createdAt' | 'views' | 'status' | 'token'> & { categories?: string[] }
) {
  const firestore = requireDb()
  const ref = collection(firestore, 'users', uid, 'share_links')
  const token = Array.from(crypto.getRandomValues(new Uint8Array(6)))
    .map((b) => b.toString(36).padStart(2, '0'))
    .join('')
    .toUpperCase()
    .slice(0, 10)
  const docRef = await addDoc(ref, {
    ...data,
    token,
    views: 0,
    status: 'active',
    createdAt: serverTimestamp(),
  })
  // Mirror to top-level share_tokens for anonymous /view/[token] lookups
  await setDoc(doc(firestore, 'share_tokens', token), {
    uid,
    linkId: docRef.id,
    expiresAt: data.expiresAt,
    status: 'active',
    recipient: data.recipient,
    scope: data.scope,
    categories: (data as { categories?: string[] }).categories ?? [],
    passwordProtected: data.passwordProtected,
    watermark: data.watermark,
  })
  return docRef
}

export async function revokeShareLink(uid: string, linkId: string) {
  const firestore = requireDb()
  await deleteDoc(doc(firestore, 'users', uid, 'share_links', linkId))
}

// ─── Property ─────────────────────────────────────────────────────────────────

export interface Property {
  name: string          // e.g. "Oberoi Residences"
  unit: string          // e.g. "12B, Tower A"
  area: number          // sq ft
  floorPlanType: string // e.g. "3BHK"
  location: string      // e.g. "Worli, Mumbai"
  gmailLinked: boolean
  createdAt: Timestamp | null
}

export async function createProperty(
  uid: string,
  data: Omit<Property, 'createdAt'>
) {
  const firestore = requireDb()
  await setDoc(doc(firestore, 'users', uid, 'properties', 'primary'), {
    ...data,
    createdAt: serverTimestamp(),
  })
}

export async function getProperty(uid: string): Promise<Property | null> {
  const firestore = requireDb()
  const snap = await getDoc(doc(firestore, 'users', uid, 'properties', 'primary'))
  return snap.exists() ? (snap.data() as Property) : null
}

export function subscribeProperty(
  uid: string,
  callback: (property: Property | null) => void
): Unsubscribe {
  const firestore = requireDb()
  return onSnapshot(doc(firestore, 'users', uid, 'properties', 'primary'), (snap) => {
    callback(snap.exists() ? (snap.data() as Property) : null)
  })
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

export async function addEvent(
  uid: string,
  data: Omit<AppEvent, 'id' | 'createdAt'>
) {
  const firestore = requireDb()
  const ref = collection(firestore, 'users', uid, 'events')
  return addDoc(ref, { ...data, createdAt: serverTimestamp() })
}

export function subscribeEvents(
  uid: string,
  callback: (events: AppEvent[]) => void
): Unsubscribe {
  const firestore = requireDb()
  const ref = collection(firestore, 'users', uid, 'events')
  const q = query(ref, orderBy('createdAt', 'desc'), limit(10))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AppEvent)))
  })
}

// ─── Share Tokens (top-level lookup for public /view route) ───────────────────

export interface ShareTokenLookup {
  uid: string
  linkId: string
  expiresAt: Timestamp
  status: 'active' | 'revoked'
  recipient: string
  scope: string
  categories: string[]
  passwordProtected: boolean
  watermark: boolean
}

export async function getShareLinkByToken(
  token: string
): Promise<ShareTokenLookup | null> {
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
  callback: (stats: DashboardStats) => void
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

  const unsubWarranty = onSnapshot(
    collection(firestore, 'users', uid, 'warranty_assets'),
    (snap) => {
      warrantyAssets = snap.docs.map((d) => ({ id: d.id, ...d.data() } as WarrantyAsset))
      emit()
    }
  )

  const unsubSnags = onSnapshot(
    collection(firestore, 'users', uid, 'snags'),
    (snap) => {
      snags = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Snag))
      emit()
    }
  )

  return () => {
    unsubWarranty()
    unsubSnags()
  }
}

// ─── User Profile ──────────────────────────────────────────────────────────────

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
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const firestore = requireDb()
  const snap = await getDoc(doc(firestore, 'users', uid))
  return snap.exists() ? (snap.data() as UserProfile) : null
}

export async function saveUserProfile(uid: string, data: Partial<UserProfile>) {
  const firestore = requireDb()
  await setDoc(doc(firestore, 'users', uid), data, { merge: true })
}

export function subscribeUserProfile(
  uid: string,
  callback: (profile: UserProfile | null) => void
): Unsubscribe {
  const firestore = requireDb()
  return onSnapshot(doc(firestore, 'users', uid), (snap) => {
    callback(snap.exists() ? (snap.data() as UserProfile) : null)
  })
}
