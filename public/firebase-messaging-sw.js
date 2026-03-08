// Firebase Messaging Service Worker
// Config is injected at build time by the CI/CD pipeline

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js')

// ──────────────────────────────────────────────────────────────────────────────
// CONFIG PLACEHOLDERS — replaced by generate-sw.js at build time
// ──────────────────────────────────────────────────────────────────────────────
firebase.initializeApp({
  apiKey:            '__NEXT_PUBLIC_FIREBASE_API_KEY__',
  authDomain:        '__NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN__',
  projectId:         '__NEXT_PUBLIC_FIREBASE_PROJECT_ID__',
  storageBucket:     '__NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET__',
  messagingSenderId: '__NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID__',
  appId:             '__NEXT_PUBLIC_FIREBASE_APP_ID__',
})

const messaging = firebase.messaging()

// Background message handler
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification ?? {}
  self.registration.showNotification(title ?? 'Digital Passport', {
    body: body ?? '',
    icon: icon ?? '/icon-192.png',
    badge: '/icon-192.png',
    tag: payload.data?.tag ?? 'dp-notification',
    data: payload.data,
  })
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus()
        }
      }
      return clients.openWindow(url)
    })
  )
})
