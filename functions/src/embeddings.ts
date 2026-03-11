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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EmbedPart =
  | { type: 'text'; text: string }
  | { type: 'pdf';  base64: string }
  | { type: 'image'; base64: string; mimeType: string }

// ---------------------------------------------------------------------------
// Core embed helper — single part
// ---------------------------------------------------------------------------

async function embedPart(part: EmbedPart, apiKey: string): Promise<number[]> {
  const ai = new GoogleGenAI({ apiKey })

  let contents: object

  if (part.type === 'text') {
    contents = { parts: [{ text: part.text }] }
  } else if (part.type === 'pdf') {
    contents = {
      parts: [
        {
          inlineData: {
            data: part.base64,
            mimeType: 'application/pdf',
          },
        },
      ],
    }
  } else {
    // image
    contents = {
      parts: [
        {
          inlineData: {
            data: part.base64,
            mimeType: part.mimeType,
          },
        },
      ],
    }
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
 */
export async function embedPdf(base64Pdf: string, apiKey: string): Promise<number[]> {
  return embedPart({ type: 'pdf', base64: base64Pdf }, apiKey)
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
