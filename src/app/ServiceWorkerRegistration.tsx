'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    const register = async () => {
      try {
        await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      } catch (err) {
        console.error('SW registration failed', err)
      }
    }
    register()
  }, [])

  return null
}
