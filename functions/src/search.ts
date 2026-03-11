/**
 * Semantic Search Cloud Function
 *
 * Embeds a user query with Gemini Embedding 2 and ranks Firestore documents
 * by cosine similarity against their stored embedding vectors.
 *
 * Callable: semanticSearch({ query, scope, limit? })
 *  - scope: 'assets'   → users/{uid}/properties/primary/warranty_assets
 *  - scope: 'vault'    → users/{uid}/properties/primary/vault_items
 *  - scope: 'projects' → /projects  (global community database)
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import { embedText, cosineSimilarity } from './embeddings'

const db = admin.firestore()

interface SearchRequest {
  query: string
  scope: 'assets' | 'vault' | 'projects'
  limit?: number
}

interface SearchResult {
  id: string
  score: number
  data: Record<string, unknown>
}

function getCollectionPath(uid: string, scope: SearchRequest['scope']): string {
  switch (scope) {
    case 'assets':
      return `users/${uid}/properties/primary/warranty_assets`
    case 'vault':
      return `users/${uid}/properties/primary/vault_items`
    case 'projects':
      return 'projects'
  }
}

export const semanticSearch = onCall(
  { timeoutSeconds: 60, memory: '512MiB' },
  async (request): Promise<{ results: SearchResult[] }> => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be signed in.')
    }

    const data = request.data as Partial<SearchRequest>

    if (!data.query || typeof data.query !== 'string' || data.query.trim().length === 0) {
      throw new HttpsError('invalid-argument', 'query is required.')
    }

    const scope = data.scope ?? 'assets'
    const topK = Math.min(data.limit ?? 10, 50) // cap at 50
    const uid = request.auth.uid

    const geminiKey = process.env.GEMINI_API_KEY ?? ''
    if (!geminiKey) {
      throw new HttpsError('failed-precondition', 'Gemini API key not configured.')
    }

    // 1. Embed the query
    let queryVector: number[]
    try {
      queryVector = await embedText(data.query.trim(), geminiKey)
    } catch (err) {
      console.error('[semanticSearch] Failed to embed query:', err)
      throw new HttpsError('internal', 'Failed to embed query.')
    }

    // 2. Fetch all docs that have an embedding field
    const collectionPath = getCollectionPath(uid, scope)
    const snap = await db
      .collection(collectionPath)
      .where('embedding', '!=', null)
      .get()

    if (snap.empty) {
      console.log(`[semanticSearch] No indexed documents in ${collectionPath}`)
      return { results: [] }
    }

    // 3. Score each document
    const scored: SearchResult[] = []
    for (const doc of snap.docs) {
      const docData = doc.data()
      const embedding = docData.embedding as number[] | undefined

      if (!embedding || !Array.isArray(embedding) || embedding.length === 0) continue

      try {
        const score = cosineSimilarity(queryVector, embedding)
        const { embedding: _omit, ...rest } = docData  // strip embedding from result
        scored.push({ id: doc.id, score, data: rest })
      } catch {
        // Vector dimension mismatch — skip this doc
        console.warn(`[semanticSearch] Skipping doc ${doc.id}: dimension mismatch`)
      }
    }

    // 4. Sort descending by score and return top-K
    scored.sort((a, b) => b.score - a.score)
    const results = scored.slice(0, topK)

    console.log(
      `[semanticSearch] query="${data.query}" scope=${scope} ` +
      `candidates=${snap.size} returned=${results.length} ` +
      `topScore=${results[0]?.score?.toFixed(4) ?? 'n/a'}`
    )

    return { results }
  }
)
