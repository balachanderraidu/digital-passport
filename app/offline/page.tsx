import Link from 'next/link'

export default function OfflinePage() {
  return (
    <div className="min-h-dvh bg-vault-bg flex flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-vault-accent/10 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-vault-accent"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 3l18 18M10.584 10.587a2 2 0 002.828 2.83M6.111 6.11a5.5 5.5 0 007.773 7.773M4.39 4.39A9.5 9.5 0 0015.61 15.61M1.5 1.5l21 21"
          />
        </svg>
      </div>
      <div>
        <h1 className="text-2xl font-semibold text-vault-text mb-2">You&apos;re Offline</h1>
        <p className="text-vault-text-muted text-sm max-w-xs">
          No internet connection. Previously cached pages are still accessible.
        </p>
      </div>
      <Link
        href="/"
        className="px-6 py-2.5 rounded-lg bg-vault-accent text-black text-sm font-medium hover:bg-vault-accent/90 transition-colors"
      >
        Try Again
      </Link>
    </div>
  )
}
