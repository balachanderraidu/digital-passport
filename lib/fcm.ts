/**
 * FCM (Firebase Cloud Messaging) utilities
 * - Requests notification permission
 * - Registers FCM token and saves to Firestore
 * - Cleans up stale tokens
 */

import { getMessaging, getToken, type Messaging } from 'firebase/messaging'
import { getApp } from 'firebase/app'
import { saveUserProfile } from '@/lib/firestore'

let messaging: Messaging | null = null

function getMessagingInstance(): Messaging | null {
  if (typeof window === 'undefined') return null
  if (messaging) return messaging
  try {
    messaging = getMessaging(getApp())
    return messaging
  } catch {
    return null
  }
}

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ?? ''

/**
 * Request notification permission and register an FCM token.
 * Saves the token to the user's Firestore profile.
 * Call this after the user is authenticated.
 */
export async function registerFCMToken(uid: string): Promise<string | null> {
  if (typeof window === 'undefined') return null
  if (!('Notification' in window)) return null

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return null

    const msg = getMessagingInstance()
    if (!msg) return null

    const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
    const token = await getToken(msg, { vapidKey: VAPID_KEY, serviceWorkerRegistration: swReg })

    if (token) {
      await saveUserProfile(uid, { fcmToken: token } as Parameters<typeof saveUserProfile>[1])
    }

    return token ?? null
  } catch (err) {
    console.warn('[FCM] Token registration failed:', err)
    return null
  }
}

/**
 * Clear the FCM token on sign-out.
 */
export async function clearFCMToken(uid: string): Promise<void> {
  try {
    await saveUserProfile(uid, { fcmToken: null } as Parameters<typeof saveUserProfile>[1])
  } catch {
    // best effort
  }
}
