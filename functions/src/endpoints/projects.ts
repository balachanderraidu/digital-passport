
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { info, warn, error } from 'firebase-functions/logger'
import { db } from '../admin'

import * as admin from 'firebase-admin'
// --- 5. processBrochure ------------------------------------------------------
//
// User uploads a PDF brochure to Storage -> calls this function.
// Pass 1: Gemini extracts unit types + identifies floor plan page numbers.
// Pass 2: mupdf (WASM, via mupdf-render.js helper) renders those pages to PNGs.
// Results go to /pendingProjects for admin review - NOT directly to /projects.
// Admin then calls approveProject to promote the data.

interface PendingUnitType {
  label: string
  bedrooms: number
  bathrooms: number
  area: number
  carpetArea: number
  superBuiltUpArea: number
  configuration: string
  floorRange: [number, number]
  flatNumberPattern: string
  floorPlanUrl: string
  genericDocs: string[]
  svgFloorPlan: string
  rooms: Array<{ name: string; x: number; y: number; w: number; h: number }>
}

function makeBrochureKeywords(name: string, developer: string, city: string): string[] {
  const words = `${name} ${developer} ${city}`.toLowerCase().split(/\s+/)
  const keywords = new Set<string>()
  for (const word of words) {
    for (let i = 2; i <= word.length; i++) keywords.add(word.slice(0, i))
    keywords.add(word)
  }
  return Array.from(keywords).filter((k) => k.length >= 2)
}

async function callGeminiForBrochure(base64Pdf: string, geminiKey: string): Promise<string> {
  // gemini-flash-latest — verified to work with this API key
  const url =
    `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${geminiKey}`

  const prompt = `You are a real estate data extractor. Analyse this residential brochure PDF carefully.

Return ONLY raw JSON (no markdown) with this structure:
{
  "projectName": "string",
  "developer": "string",
  "city": "string",
  "towers": ["Tower 1", "Tower 2"],
  "unitTypes": [
    {
      "label": "3BHK East",
      "bedrooms": 3,
      "bathrooms": 3,
      "carpetArea": 0,
      "superBuiltUpArea": 2595,
      "configuration": "East-facing",
      "floorRange": [3, 36],
      "flatNumberPattern": "",
      "floorPlanPage": 16,
      "rooms": [
        { "name": "Living Room",    "x": 5,  "y": 5,  "w": 40, "h": 35 },
        { "name": "Kitchen",        "x": 50, "y": 5,  "w": 25, "h": 20 },
        { "name": "Master Bedroom", "x": 5,  "y": 45, "w": 35, "h": 40 },
        { "name": "Bathroom",       "x": 45, "y": 55, "w": 15, "h": 20 }
      ]
    }
  ]
}

Rules:
- List EACH distinct unit type separately (east/west are separate).
- towers: list ALL tower or block names exactly as shown. Use [] if none mentioned.
- carpetArea: RERA carpet area in sq ft. 0 if not found.
- superBuiltUpArea: total/super built-up area in sq ft. 0 if not found.
- floorPlanPage: 1-indexed page number for THIS unit type floor plan. 0 if not found.
- floorRange: [minFloor, maxFloor]. Use [2, 36] if unknown.
- rooms: for EACH unit type, find its floor plan and estimate each room's bounding box.
  x/y/w/h are percentages (0-100) of the floor plan image area.
  Include: Living Room, Kitchen, Master Bedroom, Bedroom 2, Bedroom 3, Bathroom, Balcony, Study, Dining Room (only rooms present).
  Approximate is fine — user can adjust in the editor.
- Return ONLY valid JSON.`

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(120_000), // 120s — large PDF needs time
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt },
            { inlineData: { mimeType: 'application/pdf', data: base64Pdf } },
          ],
        },
      ],
      generationConfig: { temperature: 0.1 },
    }),
  })

  if (!resp.ok) {
    const errBody = await resp.text().catch(() => '')
    throw new Error(`Gemini error: ${resp.status} ${errBody.slice(0, 200)}`)
  }

  const json = await resp.json() as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  }
  return json.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}'
}

// ---------------------------------------------------------------------------
// generateFloorPlanSvg — Gemini 2.0 Flash converts a floor plan PNG → SVG
// ---------------------------------------------------------------------------

interface FloorRoom { name: string; cx: number; cy: number }
interface FloorPlanData { svg: string; rooms: FloorRoom[] }

async function generateFloorPlanSvg(
  pngBase64: string,
  geminiKey: string
): Promise<FloorPlanData> {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiKey}`

  const prompt = `You are a floor plan SVG generator. Analyze this residential floor plan image.

Return ONLY raw JSON (no markdown) with exactly this structure:
{
  "svg": "<svg viewBox=\\"0 0 400 300\\" xmlns=\\"http://www.w3.org/2000/svg\\">...</svg>",
  "rooms": [{"name": "Living Room", "cx": 30, "cy": 45}]
}

SVG rules:
- viewBox MUST be "0 0 400 300"
- Draw each room as a <rect> with rx="4" fill="rgba(255,255,255,0.05)" stroke="rgba(255,215,0,0.25)" stroke-width="1.5"
- Add a <text> label centred in each room: font-size="9" fill="rgba(255,255,255,0.45)" text-anchor="middle" dominant-baseline="middle"
- Include walls as strokes only — no fills that obscure other elements
- Keep the total SVG under 2800 characters
- Only include: living area, kitchen, master bedroom, secondary bedrooms, bathroom(s), balcony, dining, study

rooms rules:
- cx and cy are the room's center as a percentage (0-100) relative to the 400×300 viewBox
- Allowed names (use exactly): Living Room, Kitchen, Master Bedroom, Bedroom 2, Bedroom 3, Bathroom, Balcony, Study, Dining Room`

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(45_000), // 45s — needs more tokens now
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: prompt },
          { inlineData: { mimeType: 'image/png', data: pngBase64 } },
        ],
      }],
      generationConfig: {
        temperature: 0.1,
        // No responseMimeType — JSON mode was truncating SVG strings at ~70 chars
        maxOutputTokens: 4096,
      },
    }),
  })

  if (!resp.ok) throw new Error(`[generateFloorPlanSvg] Gemini error: ${resp.status}`)

  const json = await resp.json() as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  }
  const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

  // Extract JSON from free-text response (model may wrap in ```json ... ```)
  const jsonMatch = rawText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('[generateFloorPlanSvg] No JSON block found in response')
  const data = JSON.parse(jsonMatch[0]) as FloorPlanData

  if (!data.svg || !Array.isArray(data.rooms)) {
    throw new Error('[generateFloorPlanSvg] Invalid response structure')
  }
  return data
}

export const processBrochure = onCall(
  { timeoutSeconds: 300, memory: '2GiB' },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Must be signed in.')

    const data = request.data as { storagePath?: string }
    if (!data?.storagePath) throw new HttpsError('invalid-argument', 'storagePath is required.')

    const geminiKey = process.env.GEMINI_API_KEY ?? ''
    if (!geminiKey) throw new HttpsError('failed-precondition', 'Gemini API key not configured.')

    try {
      const bucket = admin.storage().bucket()
      const uid = request.auth.uid

      // 1. Download PDF
      const [pdfBuffer] = await bucket.file(data.storagePath).download()
      const base64Pdf = pdfBuffer.toString('base64')
      console.log(`[processBrochure] PDF: ${pdfBuffer.length} bytes, uid: ${uid}`)

      // 2. Gemini: extract unit types + floor plan page numbers
      const rawJson = await callGeminiForBrochure(base64Pdf, geminiKey)
      const extracted = JSON.parse(rawJson) as {
        projectName?: string
        developer?: string
        city?: string
        towers?: string[]
        unitTypes?: Array<{
          label?: string
          bedrooms?: number
          bathrooms?: number
          carpetArea?: number
          superBuiltUpArea?: number
          configuration?: string
          floorRange?: [number, number]
          flatNumberPattern?: string
          floorPlanPage?: number
          rooms?: Array<{ name: string; x: number; y: number; w: number; h: number }>
        }>
      }

      const projectName = extracted.projectName ?? 'Unknown Project'
      const developer = extracted.developer ?? ''
      const city = extracted.city ?? ''
      const rawUnitTypes = extracted.unitTypes ?? []
      console.log(`[processBrochure] Extracted ${rawUnitTypes.length} unit types for "${projectName}"`)

      // 3. mupdf: render unique floor plan pages to PNG (non-fatal)
      const uniquePages = [
        ...new Set(rawUnitTypes.map((ut) => ut.floorPlanPage ?? 0).filter((p) => p > 0)),
      ]
      const pageToUrl = new Map<number, string>()
      const ts = Date.now()

      try {
        const { renderPdfPageToPng } = require('./mupdf-render') as {
          renderPdfPageToPng: (buf: Buffer, idx: number, dpi: number) => Promise<Buffer>
        }

        for (const pageNum of uniquePages) {
          console.log(`[processBrochure] Rendering page ${pageNum} with mupdf...`)
          try {
            const png = await renderPdfPageToPng(pdfBuffer, pageNum - 1, 100)
            const imgPath = `pending/${uid}/${ts}/floorplan-page${pageNum}.png`
            const imgFile = bucket.file(imgPath)
            await imgFile.save(png, { metadata: { contentType: 'image/png' } })
            await imgFile.makePublic()
            const url = `https://storage.googleapis.com/${bucket.name}/${imgPath}`
            pageToUrl.set(pageNum, url)
            console.log(`[processBrochure] Uploaded page ${pageNum}: ${Math.round(png.length / 1024)}KB`)
          } catch (renderErr) {
            console.warn(`[processBrochure] Render failed for page ${pageNum}:`, renderErr)
          }
        }
      } catch (mupdfErr) {
        console.warn('[processBrochure] mupdf unavailable, skipping floor plan rendering:', mupdfErr)
      }

      // 4. Build unit type list with rooms from Gemini extraction
      const unitTypes: PendingUnitType[] = rawUnitTypes.map((ut) => {
        const carpetArea = ut.carpetArea ?? 0
        const sbuArea = ut.superBuiltUpArea ?? 0
        const pageNum = ut.floorPlanPage ?? 0
        const floorPlanUrl = pageNum > 0 ? (pageToUrl.get(pageNum) ?? '') : ''
        return {
          label: ut.label ?? 'Unknown',
          bedrooms: ut.bedrooms ?? 0,
          bathrooms: ut.bathrooms ?? 0,
          area: carpetArea > 0 ? carpetArea : sbuArea,
          carpetArea,
          superBuiltUpArea: sbuArea,
          configuration: ut.configuration ?? '',
          floorRange: ut.floorRange ?? [2, 30],
          flatNumberPattern: ut.flatNumberPattern ?? '',
          floorPlanUrl,
          genericDocs: floorPlanUrl ? [floorPlanUrl] : [],
          svgFloorPlan: '',
          rooms: (ut.rooms ?? []).map((r) => ({ name: r.name, x: r.x, y: r.y, w: r.w, h: r.h })),
        }
      })

      // Step 5: PDF embedding DISABLED — was crashing via unhandled AbortSignal rejection.
      // Re-enable once brochure processing is confirmed stable.
      const brochureEmbedding: number[] = []

      // 6. Write to /pendingProjects - NOT /projects
      const pendingRef = await db.collection('pendingProjects').add({
        projectName,
        developer,
        city,
        submittedBy: uid,
        status: 'pending',
        storagePath: data.storagePath,
        unitTypes,
        ...(brochureEmbedding.length > 0 ? { embedding: brochureEmbedding } : {}),
        submittedAt: FieldValue.serverTimestamp(),
      })

      const towers = extracted.towers ?? []

      console.log(`[processBrochure] Created pendingProject: ${pendingRef.id}`)
      return {
        projectId: pendingRef.id,
        projectName,
        towers,
        unitTypes,
        embeddingDim: brochureEmbedding.length,
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[processBrochure] Error:', msg)
      throw new HttpsError('internal', `Failed to process brochure: ${msg.slice(0, 200)}`)
    }
  }
)
// --- 6. approveProject (Admin) -----------------------------------------------
//
// Promotes a /pendingProjects document to /projects.
// If verified=true, the project shows the VERIFIED badge in the search UI.
// If the project already exists, unit types are merged in.
// Call: { pendingProjectId: string, verified?: boolean, reject?: boolean }

export const approveProject = onCall(
  { timeoutSeconds: 60 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Must be signed in.')

    const ADMIN_UIDS = (process.env.ADMIN_UIDS ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    if (ADMIN_UIDS.length > 0 && !ADMIN_UIDS.includes(request.auth.uid)) {
      throw new HttpsError('permission-denied', 'Admin access required.')
    }

    const data = request.data as {
      pendingProjectId?: string
      verified?: boolean
      reject?: boolean
    }
    if (!data?.pendingProjectId) {
      throw new HttpsError('invalid-argument', 'pendingProjectId is required.')
    }

    const pendingRef = db.collection('pendingProjects').doc(data.pendingProjectId)
    const pendingSnap = await pendingRef.get()
    if (!pendingSnap.exists) throw new HttpsError('not-found', 'Pending project not found.')

    const pending = pendingSnap.data() as {
      projectName: string
      developer: string
      city: string
      submittedBy: string
      unitTypes: PendingUnitType[]
    }

    if (data.reject) {
      await pendingRef.update({
        status: 'rejected',
        reviewedAt: FieldValue.serverTimestamp(),
        reviewedBy: request.auth.uid,
      })
      return { status: 'rejected' }
    }

    // Find or create project
    const existing = await db
      .collection('projects')
      .where('name', '==', pending.projectName)
      .limit(1)
      .get()

    let projectId: string
    if (!existing.empty) {
      projectId = existing.docs[0].id
      console.log(`[approveProject] Merging into existing project: ${projectId}`)
      // Update verified if requested
      if (data.verified) {
        await db.collection('projects').doc(projectId).update({ verified: true })
      }
    } else {
      const pendingData = pendingSnap.data() as typeof pending & { embedding?: number[] }
      const projectRef = await db.collection('projects').add({
        name: pending.projectName,
        developer: pending.developer,
        city: pending.city,
        verified: data.verified ?? false,
        searchKeywords: makeBrochureKeywords(
          pending.projectName,
          pending.developer,
          pending.city
        ),
        ...(pendingData.embedding ? { embedding: pendingData.embedding } : {}),
        createdAt: FieldValue.serverTimestamp(),
        createdBy: pending.submittedBy,
      })
      projectId = projectRef.id
      console.log(`[approveProject] Created project: ${projectId}`)
    }

    // Copy unit types
    for (const ut of pending.unitTypes) {
      const typeId = ut.label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      await db
        .collection('projects')
        .doc(projectId)
        .collection('unitTypes')
        .doc(typeId)
        .set(ut, { merge: true })
    }

    // Mark pending as approved
    await pendingRef.update({
      status: 'approved',
      approvedProjectId: projectId,
      reviewedAt: FieldValue.serverTimestamp(),
      reviewedBy: request.auth.uid,
    })

    console.log(`[approveProject] Approved: ${data.pendingProjectId} -> ${projectId}`)
    return { status: 'approved', projectId }
  }
)
