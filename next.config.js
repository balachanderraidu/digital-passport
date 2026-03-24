/** @type {import('next').NextConfig} */
const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  workboxOptions: {
    disableDevLogs: true,
    // Do NOT let the service worker intercept the video (it's too large to cache in SW)
    runtimeCaching: [
      {
        urlPattern: /\/explainer\.mp4$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'video-cache',
          expiration: { maxEntries: 1, maxAgeSeconds: 60 * 60 * 24 * 30 }, // 30 days
          rangeRequests: true, // Support byte-range requests (required for video seeking)
        },
      },
    ],
  },
})

const nextConfig = {
  output: 'export',
  trailingSlash: true,
  reactStrictMode: true,
  images: {
    domains: ['firebasestorage.googleapis.com', 'lh3.googleusercontent.com'],
    unoptimized: true,
  },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  // Add Cache-Control header for the video so browsers cache it aggressively after first load
  // Note: headers() only works with a server, not with `output: export`.
  // The Firebase hosting rewrite in firebase.json handles this instead.
}

module.exports = withPWA(nextConfig)
