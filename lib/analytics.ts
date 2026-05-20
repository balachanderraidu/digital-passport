/**
 * lib/analytics.ts
 * SSR-safe Firebase Analytics wrapper.
 *
 * All functions are no-ops on the server (Next.js SSR / build).
 * Analytics only initializes in the browser when measurementId is set.
 */

import type { Analytics } from 'firebase/analytics'

let analyticsInstance: Analytics | null = null

async function getAnalytics(): Promise<Analytics | null> {
  if (typeof window === 'undefined') return null // SSR guard
  if (analyticsInstance) return analyticsInstance

  try {
    const { getAnalytics: _getAnalytics, isSupported } = await import('firebase/analytics')
    const app = (await import('@/lib/firebase')).default
    if (!app) return null
    const supported = await isSupported()
    if (!supported) return null
    analyticsInstance = _getAnalytics(app)
    return analyticsInstance
  } catch {
    return null // Fail silently
  }
}

// ─── Typed Events ──────────────────────────────────────────────────────────────

/** Log a generic custom event */
export async function logEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>
) {
  const analytics = await getAnalytics()
  if (!analytics) return
  const { logEvent: _logEvent } = await import('firebase/analytics')
  _logEvent(analytics, eventName, params)
}

/** Log a page view (call on route changes) */
export async function logPageView(pagePath: string, pageTitle?: string) {
  await logEvent('page_view', {
    page_path: pagePath,
    page_title: pageTitle ?? document.title,
    page_location: window.location.href,
  })
}

/** Log when someone visits via ?ref=demo (or any ?ref= tag) */
export async function logDemoVisit(ref: string) {
  await logEvent('demo_visit', {
    ref_tag: ref,
    page_path: window.location.pathname,
    timestamp_ms: Date.now(),
  })
}

/** Log when a user signs in */
export async function logSignIn(method: 'google' | 'phone') {
  await logEvent('login', { method })
}

/** Log when a user completes onboarding */
export async function logOnboardingComplete(propertyType: string) {
  await logEvent('onboarding_complete', { property_type: propertyType })
}

/** Log when a document is uploaded to the Vault */
export async function logVaultUpload(category: string) {
  await logEvent('vault_upload', { category })
}

/** Log when a share link is created */
export async function logShareLinkCreated(scope: string) {
  await logEvent('share_link_created', { scope })
}
