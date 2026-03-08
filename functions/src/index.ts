/**
 * Digital Passport — Firebase Cloud Functions (v5 API)
 *
 * Exports three HTTPS callable functions:
 *  1. initGmailAuth     — returns Google OAuth URL for the user to redirect to
 *  2. gmailOAuthCallback — exchanges OAuth code for tokens, stores securely
 *  3. syncGmailReceipts  — runs the Gmail→Gemini OCR extraction pipeline
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

