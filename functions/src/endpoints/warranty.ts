
import { onSchedule } from 'firebase-functions/v2/scheduler'
import * as admin from 'firebase-admin'
import { info, warn, error } from 'firebase-functions/logger'
import { db } from '../admin'
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
