/**
 * Digital Passport — Firebase Cloud Functions (v5 API)
 *
 * Exports HTTPS callable functions:
 *  1. initGmailAuth     — returns Google OAuth URL for the user to redirect to
 *  2. gmailOAuthCallback — exchanges OAuth code for tokens, stores securely
 *  3. syncGmailReceipts  — runs the Gmail→Gemini OCR extraction pipeline
 *  4. processBrochure    — extracts unit types from a PDF brochure via Gemini
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

// ─── Config helpers ─────────────────────────────────────────────────────────

function getOAuthConfig() {
  return {
    clientId:     process.env.GOOGLE_OAUTH_CLIENT_ID     ?? '',
    clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? '',
    redirectUri:  process.env.GOOGLE_OAUTH_REDIRECT_URI  ?? '',
    geminiKey:    process.env.GEMINI_API_KEY             ?? '',
  }
}

// ─── 1. initGmailAuth ────────────────────────────────────────────────────────

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

// ─── 2. gmailOAuthCallback ───────────────────────────────────────────────────

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

// ─── 3. syncGmailReceipts ────────────────────────────────────────────────────

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
            await db.collection(`users/${uid}/warranty_assets`).add(assetPayload)
            result.matched++
          } else {
            await db.collection(`users/${uid}/pending_assets`).add(assetPayload)
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

// ─── 4. checkWarrantyExpiry (Scheduled daily) ─────────────────────────────────
// Scans all users' warranty_assets for items expiring in exactly 7 days and
// sends an FCM push notification to their enrolled device.

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

    // Iterate all user documents to find enrolled FCM tokens
    const usersSnap = await db.collection('users').get()
    let notified = 0

    for (const userDoc of usersSnap.docs) {
      const uid = userDoc.id
      const userData = userDoc.data()
      const fcmToken: string | null = userData?.fcmToken ?? null

      if (!fcmToken) continue

      // Check this user's warranty assets expiring in 7 days
      const assetsSnap = await db
        .collection(`users/${uid}/warranty_assets`)
        .where('warrantyExpiry', '>=', in7DaysStart.toISOString().split('T')[0])
        .where('warrantyExpiry', '<=', in7DaysEnd.toISOString().split('T')[0])
        .get()

      for (const assetDoc of assetsSnap.docs) {
        const asset = assetDoc.data()
        try {
          await messaging.send({
            token: fcmToken,
            notification: {
              title: '⚠️ Warranty Expiring Soon',
              body: `${asset.name || 'An asset'} warranty expires in 7 days.`,
            },
            data: {
              tag: 'warranty-expiry',
              url: '/warranty',
              assetId: assetDoc.id,
            },
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

// ─── 5. processBrochure ──────────────────────────────────────────────────────
//
// Callable: accepts a storagePath to a PDF uploaded by the user.
// Gemini reads the PDF and extracts project + unit type data.
// If the project doesn't exist yet, it is created in /projects with verified=false.
// Returns { projectId, projectName, unitTypes[] } to the client.

interface BrochureUnitType {
  id: string
  label: string
  bedrooms: number
  bathrooms: number
  area: number
  configuration: string
  floorRange: [number, number]
  flatNumberPattern: string
  genericDocs: string[]
}

interface BrochureResult {
  projectId: string
  projectName: string
  unitTypes: BrochureUnitType[]
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

export const processBrochure = onCall(
  { timeoutSeconds: 120, memory: '1GiB' },
  async (request): Promise<BrochureResult> => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be signed in.')
    }

    const data = request.data as { storagePath?: string; uid?: string }
    if (!data?.storagePath) {
      throw new HttpsError('invalid-argument', 'storagePath is required.')
    }

    const geminiKey = process.env.GEMINI_API_KEY ?? ''
    if (!geminiKey) {
      throw new HttpsError('failed-precondition', 'Gemini API key not configured.')
    }

    try {
      // 1. Download PDF from Firebase Storage
      const bucket = admin.storage().bucket()
      const fileRef = bucket.file(data.storagePath)
      const [fileBuffer] = await fileRef.download()
      const base64Pdf = fileBuffer.toString('base64')

      // 2. Call Gemini to extract project + unit types
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`
      const prompt = `You are a real estate data extractor. Analyze this residential project brochure and extract structured data.

Return a JSON object (no markdown, just raw JSON) with this exact structure:
{
  "projectName": "Full project name",
  "developer": "Developer/builder name",
  "city": "City name",
  "unitTypes": [
    {
      "label": "3BHK East",
      "bedrooms": 3,
      "bathrooms": 3,
      "area": 1850,
      "configuration": "East-facing",
      "floorRange": [3, 45],
      "flatNumberPattern": ""
    }
  ]
}

Rules:
- Extract ALL unit types/configurations available in the project
- For area, use carpet area in sq ft if available, else super built-up
- If there are east/west configurations, list them separately
- If no floor range is mentioned, use [2, 30] as default
- flatNumberPattern should be empty string unless you can clearly infer it from flat number examples in the brochure
- Return only valid JSON, nothing else`

      const geminiResponse = await fetch(geminiUrl, {
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
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        }),
      })

      if (!geminiResponse.ok) {
        throw new Error(`Gemini API error: ${geminiResponse.status}`)
      }

      const geminiData = await geminiResponse.json() as {
        candidates?: { content?: { parts?: { text?: string }[] } }[]
      }
      const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}'
      const extracted = JSON.parse(rawText) as {
        projectName?: string
        developer?: string
        city?: string
        unitTypes?: Array<{
          label?: string
          bedrooms?: number
          bathrooms?: number
          area?: number
          configuration?: string
          floorRange?: [number, number]
          flatNumberPattern?: string
        }>
      }

      const projectName = extracted.projectName ?? 'Unknown Project'
      const developer = extracted.developer ?? ''
      const city = extracted.city ?? ''
      const rawUnitTypes = extracted.unitTypes ?? []

      // 3. Check if project already exists (by name search)
      const existingQuery = await db
        .collection('projects')
        .where('name', '==', projectName)
        .limit(1)
        .get()

      let projectId: string

      if (!existingQuery.empty) {
        projectId = existingQuery.docs[0].id
        console.log(`[processBrochure] Project already exists: ${projectId}`)
      } else {
        // Create new project entry
        const projectRef = await db.collection('projects').add({
          name: projectName,
          developer,
          city,
          verified: false,
          searchKeywords: makeBrochureKeywords(projectName, developer, city),
          createdAt: FieldValue.serverTimestamp(),
          createdBy: request.auth.uid,
        })
        projectId = projectRef.id
        console.log(`[processBrochure] Created new project: ${projectId} (${projectName})`)
      }

      // 4. Create/update unit types
      const unitTypes: BrochureUnitType[] = []
      for (const ut of rawUnitTypes) {
        const label = ut.label ?? 'Unknown'
        const typeId = label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        const typeData: Omit<BrochureUnitType, 'id'> = {
          label,
          bedrooms: ut.bedrooms ?? 0,
          bathrooms: ut.bathrooms ?? 0,
          area: ut.area ?? 0,
          configuration: ut.configuration ?? '',
          floorRange: ut.floorRange ?? [2, 30],
          flatNumberPattern: ut.flatNumberPattern ?? '',
          genericDocs: [],
        }
        await db
          .collection('projects')
          .doc(projectId)
          .collection('unitTypes')
          .doc(typeId)
          .set(typeData, { merge: true })
        unitTypes.push({ id: typeId, ...typeData })
      }

      return { projectId, projectName, unitTypes }
    } catch (err) {
      console.error('[processBrochure] Error:', err)
      throw new HttpsError('internal', 'Failed to process brochure. Please try again.')
    }
  }
)

