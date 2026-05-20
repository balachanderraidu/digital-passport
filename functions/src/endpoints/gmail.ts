
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { info, warn, error } from 'firebase-functions/logger'
import { db } from '../admin'

import { buildOAuthClient, getAuthUrl, exchangeCodeForTokens, listReceiptAttachments, downloadAttachment } from '../gmail'
import { extractReceiptData } from '../gemini'
import { embedText, assetToEmbedText } from '../embeddings'
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

      await Promise.all(
        attachments.map(async (att) => {
          result.processed++
          try {
            const base64 = await downloadAttachment(oauth2Client, att.messageId, att.attachmentId)
            const extracted = await extractReceiptData(base64, att.mimeType, geminiKey)

            if (!extracted) {
              result.skipped++
              return
            }

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
              const assetRef = await db.collection(`users/${uid}/properties/primary/warranty_assets`).add(assetPayload)
              result.matched++
              // Auto-embed for semantic search (non-fatal)
              try {
                const embedText_ = assetToEmbedText(assetPayload)
                if (embedText_) {
                  const embedding = await embedText(embedText_, geminiKey)
                  await assetRef.update({ embedding })
                }
              } catch (embedErr) {
                console.warn(`[syncGmailReceipts] Embedding failed for ${assetRef.id}:`, embedErr)
              }
            } else {
              await db.collection(`users/${uid}/properties/primary/pending_assets`).add(assetPayload)
              result.pending++
            }
          } catch (attErr) {
            console.warn(`[syncGmailReceipts] Attachment failed (${att.filename}):`, attErr)
            result.skipped++
          }
        })
      )

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
