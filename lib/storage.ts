import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from './firebase'

function requireStorage() {
  if (!storage) throw new Error('Firebase Storage not initialized')
  return storage
}

/**
 * Uploads a file to the vault category folder and returns the download URL.
 */
export async function uploadVaultFile(
  uid: string,
  category: string,
  file: File
): Promise<{ url: string; size: number; type: 'pdf' | 'image' | 'other' }> {
  const st = requireStorage()
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  const timestamp = Date.now()
  const safeName = file.name.replace(/[^a-z0-9.\-_]/gi, '_')
  const path = `users/${uid}/vault/${category}/${timestamp}_${safeName}`
  const storageRef = ref(st, path)

  await uploadBytes(storageRef, file)
  const url = await getDownloadURL(storageRef)

  const type: 'pdf' | 'image' | 'other' = ['pdf'].includes(ext)
    ? 'pdf'
    : ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'].includes(ext)
    ? 'image'
    : 'other'

  return { url, size: file.size, type }
}

/**
 * Uploads a snag photo and returns the download URL.
 */
export async function uploadSnagPhoto(
  uid: string,
  snagId: string,
  file: File
): Promise<string> {
  const st = requireStorage()
  const timestamp = Date.now()
  const path = `users/${uid}/snags/${snagId}/${timestamp}_photo`
  const storageRef = ref(st, path)
  await uploadBytes(storageRef, file)
  return getDownloadURL(storageRef)
}

/**
 * Uploads a warranty invoice and returns the download URL.
 */
export async function uploadInvoice(
  uid: string,
  assetId: string,
  file: File
): Promise<string> {
  const st = requireStorage()
  const timestamp = Date.now()
  const path = `users/${uid}/invoices/${assetId}/${timestamp}_invoice`
  const storageRef = ref(st, path)
  await uploadBytes(storageRef, file)
  return getDownloadURL(storageRef)
}
