import * as admin from 'firebase-admin'

const isFirebaseEnv = !!process.env.K_SERVICE
if (isFirebaseEnv && !admin.apps.length) {
  admin.initializeApp()
}

export const db = isFirebaseEnv ? admin.firestore() : (null as unknown as admin.firestore.Firestore)
