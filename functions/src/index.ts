/**
 * Digital Passport — Firebase Cloud Functions
 *
 * Exports three HTTPS callable functions:
 *  1. initGmailAuth     — returns Google OAuth URL for the user to redirect to
 *  2. gmailOAuthCallback — exchanges OAuth code for tokens, stores securely
 *  3. syncGmailReceipts  — runs the Gmail→Gemini OCR extraction pipeline
 */

import * as functions from 'firebase-functions'
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
  const cfg = functions.config()
  return {
    clientId:     cfg.google?.oauth_client_id     ?? process.env.GOOGLE_OAUTH_CLIENT_ID ?? '',
    clientSecret: cfg.google?.oauth_client_secret ?? process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? '',
    redirectUri:  cfg.google?.oauth_redirect_uri  ?? process.env.GOOGLE_OAUTH_REDIRECT_URI ?? '',
    geminiKey:    cfg.google?.gemini_api_key      ?? process.env.GEMINI_API_KEY ?? '',
  }
}

// ─── 1. initGmailAuth ────────────────────────────────────────────────────────

/**
 * Called by: POST /initGmailAuth
 * Auth: Firebase ID token required (the user must be logged in)
 * Returns: { authUrl: string } — redirect the user here for Google consent
 */
export const initGmailAuth = functions.https.onCall(
  async (data: unknown, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be signed in.')
    }

    const { clientId, clientSecret, redirectUri } = getOAuthConfig()
    if (!clientId || !clientSecret || !redirectUri) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Gmail OAuth credentials not configured. Set firebase functions:config.'
      )
    }

    const oauth2Client = buildOAuthClient(clientId, clientSecret, redirectUri)
    const authUrl = getAuthUrl(oauth2Client)

    // Store the UID in Firestore so the callback can associate the token
    await db.doc(`users/${context.auth.uid}/integrations/gmail`).set(
      { oauthInitiated: Timestamp.now() },
      { merge: true }
    )

    return { authUrl }
  }
)

// ─── 2. gmailOAuthCallback ───────────────────────────────────────────────────

/**
 * Called by: POST /gmailOAuthCallback { code: string }
 * Auth: Firebase ID token required
 * Exchanges the OAuth code for tokens and stores refresh_token in Firestore.
 */
export const gmailOAuthCallback = functions.https.onCall(
  async (data: { code: string }, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be signed in.')
    }
    if (!data?.code) {
      throw new functions.https.HttpsError('invalid-argument', 'OAuth code is required.')
    }

    const { clientId, clientSecret, redirectUri } = getOAuthConfig()
    const oauth2Client = buildOAuthClient(clientId, clientSecret, redirectUri)

    try {
      const tokens = await exchangeCodeForTokens(oauth2Client, data.code)

      // Store only the refresh token (access tokens are short-lived, regenerated on demand)
      await db.doc(`users/${context.auth.uid}/integrations/gmail`).set({
        linked: true,
        linkedAt: Timestamp.now(),
        refreshToken: tokens.refresh_token ?? null,
        // Do NOT store access token — it's ephemeral
      }, { merge: true })

      return { success: true }
    } catch (err) {
      console.error('[gmailOAuthCallback] Token exchange failed:', err)
      throw new functions.https.HttpsError('internal', 'Failed to exchange OAuth code.')
    }
  }
)

// ─── 3. syncGmailReceipts ────────────────────────────────────────────────────

interface SyncResult {
  processed: number
  matched: number       // confidence >= 0.8 → written to warranty_assets
  pending: number       // confidence < 0.8 → written to pending_assets
  skipped: number       // download/parse failed
}

/**
 * Called by: POST /syncGmailReceipts
 * Auth: Firebase ID token required
 * Runs the full Gmail→Gemini OCR pipeline for the authenticated user.
 */
export const syncGmailReceipts = functions.runWith({
  timeoutSeconds: 300,  // up to 5 min for large mailboxes
  memory: '512MB',
}).https.onCall(async (data: unknown, context): Promise<SyncResult> => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be signed in.')
  }

  const uid = context.auth.uid
  const { clientId, clientSecret, redirectUri, geminiKey } = getOAuthConfig()

  if (!geminiKey) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Gemini API key not configured.'
    )
  }

  // Load stored refresh token
  const integrationDoc = await db.doc(`users/${uid}/integrations/gmail`).get()
  const refreshToken: string | null = integrationDoc.data()?.refreshToken ?? null

  if (!refreshToken) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Gmail not linked. Run initGmailAuth first.'
    )
  }

  // Build authenticated Gmail client
  const oauth2Client = buildOAuthClient(clientId, clientSecret, redirectUri)
  oauth2Client.setCredentials({ refresh_token: refreshToken })

  const result: SyncResult = { processed: 0, matched: 0, pending: 0, skipped: 0 }

  try {
    // Step 1: List attachments from receipt-like emails
    const attachments = await listReceiptAttachments(oauth2Client, 60)
    console.log(`[syncGmailReceipts] Found ${attachments.length} attachments for ${uid}`)

    for (const att of attachments) {
      result.processed++

      try {
        // Step 2: Download attachment as base64
        const base64 = await downloadAttachment(oauth2Client, att.messageId, att.attachmentId)

        // Step 3: Run Gemini Flash OCR
        const extracted = await extractReceiptData(base64, att.mimeType, geminiKey)

        if (!extracted) {
          result.skipped++
          continue
        }

        // Step 4: Compute warranty expiry date from purchase_date + warranty_period_months
        let warrantyExpiry = ''
        if (extracted.purchase_date && extracted.warranty_period_months > 0) {
          const purchaseDate = new Date(extracted.purchase_date)
          purchaseDate.setMonth(purchaseDate.getMonth() + extracted.warranty_period_months)
          warrantyExpiry = purchaseDate.toISOString().split('T')[0]
        }

        const assetPayload = {
          name:             extracted.product_name || att.filename,
          brand:            extracted.vendor_name,
          model:            extracted.model_number,
          serialNumber:     extracted.serial_number,
          purchaseDate:     extracted.purchase_date,
          warrantyExpiry,
          price:            extracted.price,
          currency:         extracted.currency,
          source:           'gmail_sync',
          gmailMessageId:   att.messageId,
          gmailSubject:     att.subject,
          extractionConfidence: extracted.confidence,
          icon:             '📄',
          zone:             'Unassigned',
          createdAt:        FieldValue.serverTimestamp(),
        }

        // Step 5: Route to matched vs pending based on confidence
        if (extracted.confidence >= 0.8) {
          await db.collection(`users/${uid}/warranty_assets`).add(assetPayload)
          result.matched++
        } else {
          await db.collection(`users/${uid}/pending_assets`).add(assetPayload)
          result.pending++
        }
      } catch (attErr) {
        console.warn(`[syncGmailReceipts] Attachment processing failed (${att.filename}):`, attErr)
        result.skipped++
      }
    }

    // Log event
    await db.collection(`users/${uid}/events`).add({
      type:      'gmail_sync',
      title:     `Gmail sync complete`,
      subtitle:  `${result.matched} assets added, ${result.pending} need review`,
      icon:      '📬',
      createdAt: FieldValue.serverTimestamp(),
    })

    console.log(`[syncGmailReceipts] Done for ${uid}:`, result)
    return result
  } catch (err) {
    console.error('[syncGmailReceipts] Pipeline error:', err)
    throw new functions.https.HttpsError('internal', 'Pipeline failed. Check logs.')
  }
})
