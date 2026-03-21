/**
 * Gemini Embedding 2 helper
 *
 * Uses the @google/genai SDK with gemini-embedding-2-preview to produce
 * multimodal embeddings (text, PDF, image) in a shared vector space.
 *
 * Exports:
 *  embedText(text, apiKey)               → number[]
 *  embedPdf(base64Pdf, apiKey)           → number[]
 *  embedMultimodal(parts, apiKey)        → number[][]  (one vector per part)
 *  cosineSimilarity(a, b)               → number  (−1 to 1)
 */

import { GoogleGenAI } from '@google/genai'

const MODEL = 'gemini-embedding-2-preview'

// PDF size limit: ~8MB base64 ≈ 6MB binary, safely within the 8192 token limit
const PDF_SIZE_LIMIT_BYTES = 8 * 1024 * 1024

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EmbedPart =
  | { type: 'text'; text: string }
  | { type: 'pdf';  base64: string; fallbackText?: string }
  | { type: 'image'; base64: string; mimeType: string }

// ---------------------------------------------------------------------------
// Core embed helper — single part
// ---------------------------------------------------------------------------

async function embedPart(part: EmbedPart, apiKey: string): Promise<number[]> {
  const ai = new GoogleGenAI({ apiKey })

  // For oversized PDFs, fall back to text embedding to avoid token-limit errors
  if (part.type === 'pdf' && Buffer.byteLength(part.base64, 'base64') > PDF_SIZE_LIMIT_BYTES) {
    const fallback = part.fallbackText?.trim()
    if (fallback) {
      console.warn('[embeddings] PDF too large, falling back to text embedding')
      return embedPart({ type: 'text', text: fallback }, apiKey)
    }
    throw new Error('[embeddings] PDF exceeds size limit and no fallback text provided')
  }

  // Build the contents array — must be a flat array of Part objects
  let contents: object[]

  if (part.type === 'text') {
    contents = [{ text: part.text }]
  } else if (part.type === 'pdf') {
    contents = [
      {
        inlineData: {
          data: part.base64,
          mimeType: 'application/pdf',
        },
      },
    ]
  } else {
    // image
    contents = [
      {
        inlineData: {
          data: part.base64,
          mimeType: part.mimeType,
        },
      },
    ]
  }

  const result = await ai.models.embedContent({
    model: MODEL,
    contents: contents as Parameters<typeof ai.models.embedContent>[0]['contents'],
  })

  const embedding = result.embeddings?.[0]?.values
  if (!embedding || embedding.length === 0) {
    throw new Error(`[embeddings] Empty embedding returned for part type=${part.type}`)
  }
  return embedding
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Embed a plain text string.
 */
export async function embedText(text: string, apiKey: string): Promise<number[]> {
  return embedPart({ type: 'text', text }, apiKey)
}

/**
 * Embed a base64-encoded PDF document.
 * The model ingests the whole PDF natively (text + layout + images).
 * If the PDF is too large, falls back to embedding fallbackText if provided.
 */
export async function embedPdf(
  base64Pdf: string,
  apiKey: string,
  fallbackText?: string
): Promise<number[]> {
  return embedPart({ type: 'pdf', base64: base64Pdf, fallbackText }, apiKey)
}

/**
 * Embed multiple parts independently.
 * Returns one embedding vector per input part (in the same order).
 */
export async function embedMultimodal(
  parts: EmbedPart[],
  apiKey: string
): Promise<number[][]> {
  return Promise.all(parts.map((p) => embedPart(p, apiKey)))
}

// ---------------------------------------------------------------------------
// Math utility
// ---------------------------------------------------------------------------

/**
 * Cosine similarity between two equal-length vectors.
 * Returns a value in [−1, 1]. Higher = more similar.
 * Returns 0 if either vector has zero magnitude.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`[cosineSimilarity] Vector length mismatch: ${a.length} vs ${b.length}`)
  }
  let dot = 0
  let magA = 0
  let magB = 0
  for (let i = 0; i < a.length; i++) {
    dot  += a[i] * b[i]
    magA += a[i] * a[i]
    magB += b[i] * b[i]
  }
  const denominator = Math.sqrt(magA) * Math.sqrt(magB)
  if (denominator === 0) return 0
  return dot / denominator
}

/**
 * Build a human-readable summary string from a Firestore asset document
 * for use as the text to embed when indexing warranty assets / vault items.
 */
export function assetToEmbedText(asset: {
  name?: string
  brand?: string
  model?: string
  serialNumber?: string
  zone?: string
  category?: string
}): string {
  return [
    asset.name,
    asset.brand,
    asset.model,
    asset.serialNumber,
    asset.zone,
    asset.category,
  ]
    .filter(Boolean)
    .join(' ')
}
