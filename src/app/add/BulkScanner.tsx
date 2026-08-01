'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { bulkScanBook, undoBulkAdd, type BulkScanResult } from './bulk-actions'

type SessionItem = BulkScanResult & { key: number }

type ScannerProps = {
  onDone: (session: SessionItem[]) => void
  onCancel: () => void
}

export default function BulkScanner({ onDone, onCancel }: ScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const stopLoopRef = useRef<() => void>(() => {})
  const recentIsbnsRef = useRef<Map<string, number>>(new Map())
  const processingRef = useRef(false)

  const [session, setSession] = useState<SessionItem[]>([])
  const [lastResult, setLastResult] = useState<SessionItem | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [torchOn, setTorchOn] = useState(false)
  const [torchSupported, setTorchSupported] = useState(false)
  const [engine, setEngine] = useState<'native' | 'zxing' | null>(null)

  const handleDetection = useCallback(async (raw: string) => {
    const clean = raw.replace(/[^\d]/g, '')
    if (!/^97[89]\d{10}$/.test(clean)) return

    // Debounce: ignore the same ISBN if we saw it in the last 4 seconds
    const now = Date.now()
    const lastSeen = recentIsbnsRef.current.get(clean)
    if (lastSeen && now - lastSeen < 4000) return
    recentIsbnsRef.current.set(clean, now)

    // Serialize: never process two at once
    if (processingRef.current) return
    processingRef.current = true

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(40)
    }

    setBusy(true)
    setError(null)

    try {
      const result = await bulkScanBook(clean)
      const item: SessionItem = { ...result, key: now }
      setSession((prev) => [item, ...prev])
      setLastResult(item)
    } catch (e) {
      const item: SessionItem = {
        status: 'error',
        isbn: clean,
        message: e instanceof Error ? e.message : 'Unknown error',
        key: now,
      }
      setSession((prev) => [item, ...prev])
      setLastResult(item)
    } finally {
      processingRef.current = false
      setBusy(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        })

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }

        streamRef.current = stream

        const video = videoRef.current
        if (!video) return
        video.srcObject = stream
        await video.play()

        const track = stream.getVideoTracks()[0]
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const caps = (track.getCapabilities?.() ?? {}) as any
        if (caps.torch) setTorchSupported(true)

        const native = await tryNativeDetector()
        if (native) {
          setEngine('native')
          stopLoopRef.current = startNativeLoop(video, native, handleDetection)
        } else {
          setEngine('zxing')
          stopLoopRef.current = await startZXingLoop(video, handleDetection)
        }
      } catch (e) {
        if (!cancelled) setError(mapError(e))
      }
    }

    start()

    return () => {
      cancelled = true
      stopLoopRef.current()
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [handleDetection])

  async function toggleTorch() {
    const track = streamRef.current?.getVideoTracks()[0]
    if (!track) return
    try {
      await track.applyConstraints({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        advanced: [{ torch: !torchOn } as any],
      })
      setTorchOn(!torchOn)
    } catch {
      // some devices lie
    }
  }

  async function handleUndo() {
    if (!lastResult || lastResult.status !== 'added') return
    setBusy(true)
    const result = await undoBulkAdd(lastResult.book_id)
    setBusy(false)
    if (result?.error) {
      setError(result.error)
      return
    }
    // Remove from session, forget the isbn so it can be rescanned
    setSession((prev) => prev.filter((s) => s.key !== lastResult.key))
    recentIsbnsRef.current.delete(lastResult.isbn)
    setLastResult(null)
  }

  const addedCount = session.filter((s) => s.status === 'added').length
  const dupCount = session.filter((s) => s.status === 'duplicate').length
  const missCount = session.filter(
    (s) => s.status === 'not_found' || s.status === 'error'
  ).length

  if (error) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border border-danger/30 bg-danger/10 p-4 text-sm">
          {error}
        </div>
        <button onClick={onCancel} className={secondaryCls}>
          Back
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-3 text-xs">
          <Stat label="Added" value={addedCount} tone="success" />
          <Stat label="Dupes" value={dupCount} />
          <Stat label="Missed" value={missCount} tone="danger" />
        </div>
        {engine ? (
          <span className="text-[10px] text-ink-muted">{engine}</span>
        ) : null}
      </div>

      <div className="relative aspect-[3/4] bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className={`w-[80%] aspect-[2.2/1] rounded-lg border-4 transition-all ${
              lastResult?.status === 'added'
                ? 'border-success shadow-[0_0_20px_rgba(52,211,153,0.7)]'
                : lastResult?.status === 'duplicate'
                  ? 'border-terracotta shadow-[0_0_20px_rgba(226,132,94,0.5)]'
                  : lastResult?.status === 'not_found' || lastResult?.status === 'error'
                    ? 'border-danger'
                    : 'border-parchment/80'
            }`}
          />
        </div>
        {busy ? (
          <div className="absolute top-2 left-2 text-[10px] text-parchment bg-black/40 px-2 py-1 rounded">
            Looking up…
          </div>
        ) : null}
      </div>

      <p className="text-xs text-ink-muted text-center">
        Keep scanning. Books save automatically.
      </p>

      {lastResult ? <LastResultCard result={lastResult} onUndo={handleUndo} busy={busy} /> : null}

      <div className="flex gap-2">
        {torchSupported ? (
          <button type="button" onClick={toggleTorch} className={secondaryCls}>
            {torchOn ? 'Torch off' : 'Torch on'}
          </button>
        ) : null}
        <button type="button" onClick={onCancel} className={secondaryCls}>
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onDone(session)}
          className={`${primaryCls} ml-auto`}
        >
          Done ({session.length})
        </button>
      </div>
    </div>
  )
}

function LastResultCard({
  result,
  onUndo,
  busy,
}: {
  result: SessionItem
  onUndo: () => void
  busy: boolean
}) {
  if (result.status === 'added') {
    return (
      <div className="rounded-lg border border-success/40 bg-success/10 p-3 flex items-center gap-3">
        {result.cover_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={result.cover_url}
            alt=""
            className="w-10 aspect-[2/3] object-cover rounded"
          />
        ) : null}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-success">Added</p>
          <p className="text-sm font-medium truncate">{result.title}</p>
          <p className="text-xs text-ink-muted truncate">
            {result.authors.join(', ')}
          </p>
        </div>
        <button
          type="button"
          onClick={onUndo}
          disabled={busy}
          className="text-xs rounded-md border border-line bg-white px-2.5 py-1.5 hover:bg-parchment-soft disabled:opacity-50"
        >
          Undo
        </button>
      </div>
    )
  }
  if (result.status === 'duplicate') {
    return (
      <div className="rounded-lg border border-terracotta/40 bg-terracotta/10 p-3 flex items-center gap-3">
        {result.cover_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={result.cover_url}
            alt=""
            className="w-10 aspect-[2/3] object-cover rounded"
          />
        ) : null}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-terracotta-strong">Already in library</p>
          <p className="text-sm font-medium truncate">{result.title}</p>
        </div>
      </div>
    )
  }
  if (result.status === 'not_found') {
    return (
      <div className="rounded-lg border border-danger/40 bg-danger/10 p-3">
        <p className="text-xs font-medium text-danger">Not found</p>
        <p className="text-sm">ISBN {result.isbn} — add manually later</p>
      </div>
    )
  }
  return (
    <div className="rounded-lg border border-danger/40 bg-danger/10 p-3">
      <p className="text-xs font-medium text-danger">Error</p>
      <p className="text-sm">
        ISBN {result.isbn}: {result.message}
      </p>
    </div>
  )
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone?: 'success' | 'danger'
}) {
  const cls =
    tone === 'success'
      ? 'text-success'
      : tone === 'danger'
        ? 'text-danger'
        : 'text-ink-soft'
  return (
    <div className="flex items-baseline gap-1">
      <span className={`font-semibold ${cls}`}>{value}</span>
      <span className="text-ink-muted">{label}</span>
    </div>
  )
}

const primaryCls =
  'rounded-md bg-terracotta hover:bg-terracotta-strong disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 min-h-[44px] inline-flex items-center justify-center transition-colors'

const secondaryCls =
  'rounded-md border border-line bg-white hover:bg-parchment-soft text-ink text-sm font-medium px-5 py-2.5 min-h-[44px] inline-flex items-center justify-center transition-colors'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function tryNativeDetector(): Promise<any | null> {
  if (typeof window === 'undefined') return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const BD = (window as any).BarcodeDetector
  if (!BD) return null
  try {
    const formats: string[] = await BD.getSupportedFormats()
    if (!formats.includes('ean_13')) return null
    return new BD({ formats: ['ean_13'] })
  } catch {
    return null
  }
}

function startNativeLoop(
  video: HTMLVideoElement,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  detector: any,
  onFound: (code: string) => void
): () => void {
  let raf = 0
  let stopped = false

  const loop = async () => {
    if (stopped) return
    try {
      const codes = await detector.detect(video)
      if (codes.length > 0) onFound(codes[0].rawValue)
    } catch {
      // per-frame errors are fine
    }
    raf = requestAnimationFrame(loop)
  }
  loop()

  return () => {
    stopped = true
    cancelAnimationFrame(raf)
  }
}

async function startZXingLoop(
  video: HTMLVideoElement,
  onFound: (code: string) => void
): Promise<() => void> {
  const { BrowserMultiFormatReader } = await import('@zxing/browser')
  const reader = new BrowserMultiFormatReader()

  const controls = await reader.decodeFromVideoElement(video, (result) => {
    if (result) onFound(result.getText())
  })

  return () => {
    try {
      controls.stop()
    } catch {
      // ignore
    }
  }
}

function mapError(e: unknown): string {
  if (e instanceof Error) {
    if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
      return 'Camera permission denied. Enable it in your browser settings and try again.'
    }
    if (e.name === 'NotFoundError') return 'No camera found on this device.'
    if (e.name === 'NotReadableError') return 'Camera is in use by another app.'
    if (e.name === 'SecurityError') {
      return 'Camera requires HTTPS. Open the site over https:// and retry.'
    }
    return `Camera error: ${e.message}`
  }
  return 'Camera error: unknown'
}
