/**
 * Gemini Flash OCR helper
 * Extracts procurement metadata from a base64-encoded PDF or image attachment.
 * Returns structured JSON with confidence score.
 */

import { GoogleGenerativeAI, Part } from '@google/generative-ai'

export interface ExtractedReceipt {
  vendor_name: string
  product_name: string
  model_number: string
  serial_number: string
  purchase_date: string          // YYYY-MM-DD
  warranty_period_months: number
  price: number
  currency: string
  confidence: number             // 0.0 – 1.0
}

const EXTRACTION_PROMPT = `You are a document parser for a home management system.
Analyze the provided receipt/invoice image or PDF and extract the following fields.
Respond ONLY with valid JSON — no markdown fences, no extra text.

Required JSON structure:
{
  "vendor_name": "string (seller company name)",
  "product_name": "string (product/appliance name)",
  "model_number": "string (model number if visible, else empty string)",
  "serial_number": "string (serial/SKU if visible, else empty string)",
  "purchase_date": "YYYY-MM-DD format (estimate month/day if only year visible)",
  "warranty_period_months": number (12 if 1 year, 24 if 2 years, etc; 0 if not stated),
  "price": number (numeric value only, no symbols),
  "currency": "string (INR, USD, etc)",
  "confidence": number between 0.0 and 1.0 (your confidence in the extraction accuracy)
}

If a field cannot be determined, use an empty string for strings or 0 for numbers.
Set confidence below 0.6 if the document is unclear, not a receipt, or key fields are missing.`

export async function extractReceiptData(
  base64Data: string,
  mimeType: string,
  apiKey: string
): Promise<ExtractedReceipt | null> {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const imagePart: Part = {
    inlineData: {
      data: base64Data,
      mimeType: mimeType as 'image/jpeg' | 'image/png' | 'application/pdf',
    },
  }

  try {
    const result = await model.generateContent([EXTRACTION_PROMPT, imagePart])
    const text = result.response.text().trim()

    // Strip markdown fences if model adds them despite instructions
    const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()
    const parsed = JSON.parse(cleaned) as ExtractedReceipt
    return parsed
  } catch (err) {
    console.error('[Gemini OCR] Failed to parse response:', err)
    return null
  }
}
