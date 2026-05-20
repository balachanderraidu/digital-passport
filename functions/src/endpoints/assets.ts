
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { info, warn, error } from 'firebase-functions/logger'
import { db } from '../admin'

import { embedText, assetToEmbedText } from '../embeddings'
// --- 7. indexUserAssets ------------------------------------------------------
//
// Batch-embeds all warranty_assets (or vault_items) for a user that don't yet
// have an embedding vector. Run once after syncGmailReceipts, or on-demand.
// Input: { scope: 'assets' | 'vault' }

type IndexScope = 'assets' | 'vault'

export const indexUserAssets = onCall(
  { timeoutSeconds: 300, memory: '512MiB' },
  async (request): Promise<{ indexed: number; skipped: number }> => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Must be signed in.')

    const uid = request.auth.uid
    const scope = (request.data as { scope?: IndexScope }).scope ?? 'assets'
    const collectionName = scope === 'vault' ? 'vault_items' : 'warranty_assets'
    const collectionPath = `users/${uid}/properties/primary/${collectionName}`

    const geminiKey = process.env.GEMINI_API_KEY ?? ''
    if (!geminiKey) throw new HttpsError('failed-precondition', 'Gemini API key not configured.')

    // Fetch docs without embeddings
    const snap = await db.collection(collectionPath).get()
    const unindexed = snap.docs.filter((d) => !d.data().embedding)

    console.log(
      `[indexUserAssets] uid=${uid} scope=${scope} ` +
      `total=${snap.size} to_index=${unindexed.length}`
    )

    let indexed = 0
    let skipped = 0

    // Process in batches of 5 to avoid rate limits
    const BATCH = 5
    for (let i = 0; i < unindexed.length; i += BATCH) {
      const chunk = unindexed.slice(i, i + BATCH)
      await Promise.all(
        chunk.map(async (doc) => {
          const asset = doc.data()
          const text = assetToEmbedText(asset)
          if (!text.trim()) {
            skipped++
            return
          }
          try {
            const embedding = await embedText(text, geminiKey)
            await doc.ref.update({ embedding })
            indexed++
          } catch (err) {
            console.warn(`[indexUserAssets] Failed to embed doc ${doc.id}:`, err)
            skipped++
          }
        })
      )
    }

    console.log(`[indexUserAssets] Done: indexed=${indexed} skipped=${skipped}`)
    return { indexed, skipped }
  }
)
