export default function OfflinePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-parchment">
      <div className="max-w-sm text-center space-y-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/icon-192.png"
          alt=""
          className="w-20 h-20 mx-auto rounded-2xl opacity-60"
        />
        <h1 className="text-2xl font-semibold text-indigo">You&apos;re offline</h1>
        <p className="text-sm text-ink-muted">
          Bookshelf needs a connection to load your library. Reconnect and try
          again.
        </p>
      </div>
    </main>
  )
}
