/**
 * Digital Passport - Firebase Cloud Functions (v5 API)
 *
 * Exports:
 *  1. initGmailAuth      - returns Google OAuth URL
 *  2. gmailOAuthCallback - exchanges OAuth code for tokens
 *  3. syncGmailReceipts  - Gmail+Gemini OCR extraction pipeline
 *  4. checkWarrantyExpiry - scheduled daily warranty alerts
 *  5. processBrochure    - PDF brochure -> pending unit types review queue
 *  6. approveProject     - admin: promote pendingProject to /projects
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import * as admin from 'firebase-admin'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import {
  buildOAuthClient,
  getAuthUrl,
  exchangeCodeForTokens,
  listReceiptAttachments,
  downloadAttachment,
} from './gmail'
import { extractReceiptData } from './gemini'

admin.initializeApp()
const db = admin.firestore()

// --- Config helpers ----------------------------------------------------------

function getOAuthConfig() {
  return {
    clientId:     process.env.GOOGLE_OAUTH_CLIENT_ID     ?? '',
    clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? '',
    redirectUri:  process.env.GOOGLE_OAUTH_REDIRECT_URI  ?? '',
    geminiKey:    process.env.GEMINI_API_KEY             ?? '',
  }
}

// --- 1. initGmailAuth --------------------------------------------------------

export const initGmailAuth = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be signed in.')
  }

  const { clientId, clientSecret, redirectUri } = getOAuthConfig()
  if (!clientId || !clientSecret || !redirectUri) {
    throw new HttpsError(
      'failed-precondition',
      'Gmail OAuth credentials not configured.'
    )
  }

  const oauth2Client = buildOAuthClient(clientId, clientSecret, redirectUri)
  const authUrl = getAuthUrl(oauth2Client)

  await db.doc(`users/${request.auth.uid}/integrations/gmail`).set(
    { oauthInitiated: Timestamp.now() },
    { merge: true }
  )

  return { authUrl }
})

// --- 2. gmailOAuthCallback ---------------------------------------------------

export const gmailOAuthCallback = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be signed in.')
  }

  const data = request.data as { code?: string }
  if (!data?.code) {
    throw new HttpsError('invalid-argument', 'OAuth code is required.')
  }

  const { clientId, clientSecret, redirectUri } = getOAuthConfig()
  const oauth2Client = buildOAuthClient(clientId, clientSecret, redirectUri)

  try {
    const tokens = await exchangeCodeForTokens(oauth2Client, data.code)
    await db.doc(`users/${request.auth.uid}/integrations/gmail`).set({
      linked: true,
      linkedAt: Timestamp.now(),
      refreshToken: tokens.refresh_token ?? null,
    }, { merge: true })
    return { success: true }
  } catch (err) {
    console.error('[gmailOAuthCallback] Token exchange failed:', err)
    throw new HttpsError('internal', 'Failed to exchange OAuth code.')
  }
})

// --- 3. syncGmailReceipts ----------------------------------------------------

interface SyncResult {
  processed: number
  matched: number
  pending: number
  skipped: number
}

export const syncGmailReceipts = onCall(
  { timeoutSeconds: 300, memory: '512MiB' },
  async (request): Promise<SyncResult> => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be signed in.')
    }

    const uid = request.auth.uid
    const { clientId, clientSecret, redirectUri, geminiKey } = getOAuthConfig()

    if (!geminiKey) {
      throw new HttpsError('failed-precondition', 'Gemini API key not configured.')
    }

    const integrationDoc = await db.doc(`users/${uid}/integrations/gmail`).get()
    const refreshToken: string | null = integrationDoc.data()?.refreshToken ?? null

    if (!refreshToken) {
      throw new HttpsError('failed-precondition', 'Gmail not linked. Run initGmailAuth first.')
    }

    const oauth2Client = buildOAuthClient(clientId, clientSecret, redirectUri)
    oauth2Client.setCredentials({ refresh_token: refreshToken })

    const result: SyncResult = { processed: 0, matched: 0, pending: 0, skipped: 0 }

    try {
      const attachments = await listReceiptAttachments(oauth2Client, 60)
      console.log(`[syncGmailReceipts] Found ${attachments.length} attachments for ${uid}`)

      for (const att of attachments) {
        result.processed++
        try {
          const base64 = await downloadAttachment(oauth2Client, att.messageId, att.attachmentId)
          const extracted = await extractReceiptData(base64, att.mimeType, geminiKey)

          if (!extracted) { result.skipped++; continue }

          let warrantyExpiry = ''
          if (extracted.purchase_date && extracted.warranty_period_months > 0) {
            const d = new Date(extracted.purchase_date)
            d.setMonth(d.getMonth() + extracted.warranty_period_months)
            warrantyExpiry = d.toISOString().split('T')[0]
          }

          const assetPayload = {
            name:                  extracted.product_name || att.filename,
            brand:                 extracted.vendor_name,
            model:                 extracted.model_number,
            serialNumber:          extracted.serial_number,
            purchaseDate:          extracted.purchase_date,
            warrantyExpiry,
            price:                 extracted.price,
            currency:              extracted.currency,
            source:                'gmail_sync',
            gmailMessageId:        att.messageId,
            gmailSubject:          att.subject,
            extractionConfidence:  extracted.confidence,
            icon:                  '📄',
            zone:                  'Unassigned',
            createdAt:             FieldValue.serverTimestamp(),
          }

          if (extracted.confidence >= 0.8) {
            // Write to the primary property's warranty_assets sub-collection (multi-property aware)
            await db.collection(`users/${uid}/properties/primary/warranty_assets`).add(assetPayload)
            result.matched++
          } else {
            await db.collection(`users/${uid}/properties/primary/pending_assets`).add(assetPayload)
            result.pending++
          }
        } catch (attErr) {
          console.warn(`[syncGmailReceipts] Attachment failed (${att.filename}):`, attErr)
          result.skipped++
        }
      }

      await db.collection(`users/${uid}/events`).add({
        type:      'gmail_sync',
        title:     'Gmail sync complete',
        subtitle:  `${result.matched} assets added, ${result.pending} need review`,
        icon:      '📬',
        createdAt: FieldValue.serverTimestamp(),
      })

      return result
    } catch (err) {
      console.error('[syncGmailReceipts] Pipeline error:', err)
      throw new HttpsError('internal', 'Pipeline failed. Check logs.')
    }
  }
)

// --- 4. checkWarrantyExpiry (Scheduled daily) --------------------------------

export const checkWarrantyExpiry = onSchedule(
  { schedule: 'every 24 hours', timeZone: 'Asia/Kolkata', memory: '256MiB' },
  async () => {
    const now = new Date()
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const in7DaysStart = new Date(in7Days)
    in7DaysStart.setHours(0, 0, 0, 0)
    const in7DaysEnd = new Date(in7Days)
    in7DaysEnd.setHours(23, 59, 59, 999)

    const messaging = admin.messaging()
    const usersSnap = await db.collection('users').get()
    let notified = 0

    for (const userDoc of usersSnap.docs) {
      const uid = userDoc.id
      const userData = userDoc.data()
      const fcmToken: string | null = userData?.fcmToken ?? null
      if (!fcmToken) continue

      const assetsSnap = await db
        .collection(`users/${uid}/properties/primary/warranty_assets`)
        .where('warrantyExpiry', '>=', in7DaysStart.toISOString().split('T')[0])
        .where('warrantyExpiry', '<=', in7DaysEnd.toISOString().split('T')[0])
        .get()

      for (const assetDoc of assetsSnap.docs) {
        const asset = assetDoc.data()
        try {
          await messaging.send({
            token: fcmToken,
            notification: {
              title: 'Warranty Expiring Soon',
              body: `${asset.name || 'An asset'} warranty expires in 7 days.`,
            },
            data: { tag: 'warranty-expiry', url: '/warranty', assetId: assetDoc.id },
            webpush: {
              notification: {
                icon: 'https://digitalpassport.peroneira.com/icon-192.png',
                badge: 'https://digitalpassport.peroneira.com/icon-192.png',
              },
            },
          })
          notified++
        } catch (sendErr) {
          console.warn(`[checkWarrantyExpiry] FCM send failed for uid=${uid}:`, sendErr)
        }
      }
    }

    console.log(`[checkWarrantyExpiry] Sent ${notified} warranty expiry notifications.`)
  }
)

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
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`
  const prompt = `You are a real estate data extractor. Analyse this residential brochure PDF carefully.

Return ONLY raw JSON (no markdown) with this structure:
{
  "projectName": "string",
  "developer": "string",
  "city": "string",
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
      "floorPlanPage": 16
    }
  ]
}

Rules:
- List EACH distinct unit type separately (east/west are separate).
- carpetArea: RERA carpet area in sq ft. 0 if not found.
- superBuiltUpArea: total/super built-up area in sq ft. 0 if not found.
- floorPlanPage: 1-indexed page number for THIS unit type floor plan. 0 if not found.
- floorRange: [minFloor, maxFloor]. Use [2, 36] if unknown.
- Return ONLY valid JSON.`

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt },
            { inlineData: { mimeType: 'application/pdf', data: base64Pdf } },
          ],
        },
      ],
      generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
    }),
  })
  if (!resp.ok) throw new Error(`Gemini error: ${resp.status}`)
  const json = await resp.json() as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  }
  return json.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}'
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
        }>
      }

      const projectName = extracted.projectName ?? 'Unknown Project'
      const developer = extracted.developer ?? ''
      const city = extracted.city ?? ''
      const rawUnitTypes = extracted.unitTypes ?? []
      console.log(`[processBrochure] Extracted ${rawUnitTypes.length} unit types for "${projectName}"`)

      // 3. mupdf (via JS helper): render unique floor plan pages to PNG
      const { renderPdfPageToPng } = require('./mupdf-render') as {
        renderPdfPageToPng: (buf: Buffer, idx: number, dpi: number) => Promise<Buffer>
      }
      const uniquePages = [
        ...new Set(rawUnitTypes.map((ut) => ut.floorPlanPage ?? 0).filter((p) => p > 0)),
      ]
      const pageToUrl = new Map<number, string>()
      const ts = Date.now()

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

      // 4. Build unit type list
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
        }
      })

      // 5. Write to /pendingProjects - NOT /projects
      const pendingRef = await db.collection('pendingProjects').add({
        projectName,
        developer,
        city,
        submittedBy: uid,
        status: 'pending',
        storagePath: data.storagePath,
        unitTypes,
        submittedAt: FieldValue.serverTimestamp(),
      })

      console.log(`[processBrochure] Created pendingProject: ${pendingRef.id}`)
      return {
        pendingProjectId: pendingRef.id,
        projectName,
        unitTypesCount: unitTypes.length,
      }
    } catch (err) {
      console.error('[processBrochure] Error:', err)
      throw new HttpsError('internal', 'Failed to process brochure. Please try again.')
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
