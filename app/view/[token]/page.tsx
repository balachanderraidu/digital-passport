// Server wrapper — required by Next.js static export for dynamic [token] route.
// The actual Firestore token lookup is performed client-side after hydration.
// Firebase Hosting rewrites all unknown paths to /index.html, so this page
// is always served as a client-side rendered shell at runtime.

import { ViewPageClient } from './client'

// A placeholder token is required — Next.js 14 static export doesn't accept empty arrays.
// The client component validates the real token from the URL at runtime.
export function generateStaticParams() {
  return [{ token: '_' }]
}

export default function ShareViewPage() {
  return <ViewPageClient />
}
