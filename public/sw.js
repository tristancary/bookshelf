// Bookshelf service worker: minimal caching + offline fallback

const CACHE_VERSION = 'bookshelf-v1'
const OFFLINE_URL = '/offline'

const PRECACHE = [
  OFFLINE_URL,
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/apple-touch-icon.png',
  '/favicon.ico',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)

  // Never intercept auth, API, or Supabase traffic
  if (
    url.pathname.startsWith('/auth/') ||
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('supabase')
  ) {
    return
  }

  // Static assets: cache-first
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/favicon.ico' ||
    url.pathname === '/apple-touch-icon.png' ||
    url.pathname === '/manifest.webmanifest'
  ) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ??
          fetch(req).then((res) => {
            const clone = res.clone()
            caches.open(CACHE_VERSION).then((c) => c.put(req, clone))
            return res
          })
      )
    )
    return
  }

  // HTML navigation: network-first, fall back to offline page
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() =>
        caches.match(OFFLINE_URL).then((res) => res ?? new Response('Offline'))
      )
    )
    return
  }
})
