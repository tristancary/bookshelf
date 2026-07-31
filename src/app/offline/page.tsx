export default function OfflinePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <div className="max-w-sm text-center space-y-4">
        <h1 className="text-2xl font-semibold">You&apos;re offline</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Bookshelf needs a connection to load your library. Reconnect and try
          again.
        </p>
      </div>
    </main>
  )
}
