import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  updateDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  where,
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
  data: Omit<ShareLink, 'id' | 'createdAt' | 'views' | 'status' | 'token'>
) {
  const firestore = requireDb()
  const ref = collection(firestore, 'users', uid, 'share_links')
  const token = Array.from(crypto.getRandomValues(new Uint8Array(6)))
    .map((b) => b.toString(36).padStart(2, '0'))
    .join('')
    .toUpperCase()
    .slice(0, 10)
  return addDoc(ref, {
    ...data,
    token,
    views: 0,
    status: 'active',
    createdAt: serverTimestamp(),
  })
}

export async function revokeShareLink(uid: string, linkId: string) {
  const firestore = requireDb()
  await deleteDoc(doc(firestore, 'users', uid, 'share_links', linkId))
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
