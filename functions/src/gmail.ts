/**
 * Gmail API helpers
 * - Build OAuth client
 * - Generate auth URL
 * - Fetch purchase/receipt emails from the last 2 years
 * - Download attachments as base64
 */

import { google, Auth } from 'googleapis'

export const GMAIL_SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']

// Gmail search query — targets invoices, receipts, warranties (in English + Hindi)
const RECEIPT_QUERY = [
  'invoice OR receipt OR warranty OR "order confirmation" OR shipment',
  'newer_than:2y',
  'has:attachment',
].join(' ')

export function buildOAuthClient(
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Auth.OAuth2Client {
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri)
}

export function getAuthUrl(oauth2Client: Auth.OAuth2Client): string {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: GMAIL_SCOPES,
    prompt: 'consent', // force refresh token on every grant
  })
}

export async function exchangeCodeForTokens(
  oauth2Client: Auth.OAuth2Client,
  code: string
) {
  const { tokens } = await oauth2Client.getToken(code)
  oauth2Client.setCredentials(tokens)
  return tokens
}

export interface GmailAttachment {
  messageId: string
  attachmentId: string
  filename: string
  mimeType: string
  size: number
  subject: string
  date: string  // ISO string
}

/**
 * Fetches list of messages matching receipt query, limited to `maxMessages`.
 * Returns attachment metadata (not the data itself — fetched lazily).
 */
export async function listReceiptAttachments(
  oauth2Client: Auth.OAuth2Client,
  maxMessages = 50
): Promise<GmailAttachment[]> {
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client })
  const results: GmailAttachment[] = []

  let pageToken: string | undefined
  let fetched = 0

  do {
    const listRes = await gmail.users.messages.list({
      userId: 'me',
      q: RECEIPT_QUERY,
      maxResults: Math.min(maxMessages - fetched, 25),
      pageToken,
    })

    const messages = listRes.data.messages ?? []
    pageToken = listRes.data.nextPageToken ?? undefined

    for (const msg of messages) {
      if (!msg.id || fetched >= maxMessages) break

      const detail = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'metadata',
        metadataHeaders: ['Subject', 'Date'],
      })

      const headers = detail.data.payload?.headers ?? []
      const getHeader = (name: string) =>
        headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? ''

      const subject = getHeader('Subject')
      const date = getHeader('Date')

      const parts = detail.data.payload?.parts ?? []
      for (const part of parts) {
        if (
          part.filename &&
          part.body?.attachmentId &&
          (part.mimeType?.startsWith('image/') || part.mimeType === 'application/pdf')
        ) {
          results.push({
            messageId: msg.id,
            attachmentId: part.body.attachmentId,
            filename: part.filename,
            mimeType: part.mimeType,
            size: part.body.size ?? 0,
            subject,
            date,
          })
        }
      }
      fetched++
    }
  } while (pageToken && fetched < maxMessages)

  return results
}

/**
 * Downloads a specific attachment and returns it as a base64 string.
 */
export async function downloadAttachment(
  oauth2Client: Auth.OAuth2Client,
  messageId: string,
  attachmentId: string
): Promise<string> {
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client })
  const res = await gmail.users.messages.attachments.get({
    userId: 'me',
    messageId,
    id: attachmentId,
  })
  // Gmail returns URL-safe base64; convert to standard base64
  return (res.data.data ?? '').replace(/-/g, '+').replace(/_/g, '/')
}
