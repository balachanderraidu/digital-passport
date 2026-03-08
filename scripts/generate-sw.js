#!/usr/bin/env node
/**
 * generate-sw.js — injects Firebase env vars into the FCM service worker
 * Run as part of the Next.js build process (see package.json postbuild script).
 */

const fs = require('fs')
const path = require('path')

const swTemplate = path.join(__dirname, '../public/firebase-messaging-sw.js')
const swOut = path.join(__dirname, '../out/firebase-messaging-sw.js') // static export output

const replacements = {
  '__NEXT_PUBLIC_FIREBASE_API_KEY__':            process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
  '__NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN__':        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  '__NEXT_PUBLIC_FIREBASE_PROJECT_ID__':         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  '__NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET__':     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  '__NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID__':process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  '__NEXT_PUBLIC_FIREBASE_APP_ID__':             process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
}

let content = fs.readFileSync(swTemplate, 'utf-8')
for (const [placeholder, value] of Object.entries(replacements)) {
  content = content.replaceAll(placeholder, value)
}

// Write to both public/ (dev) and out/ (prod static export)
fs.writeFileSync(swTemplate, content, 'utf-8')
if (fs.existsSync(path.dirname(swOut))) {
  fs.writeFileSync(swOut, content, 'utf-8')
}

console.log('[generate-sw] ✅ firebase-messaging-sw.js config injected')
