'use client'

import { useEffect, useRef, useState } from 'react'

type ScannerProps = {
  onDetected: (isbn: string) => void
  onCancel: () => void
}

export default function Scanner({ onDetected, onCancel }: ScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const stopRef = useRef<() => void>(() => {})
  const detectedRef = useRef(false)

  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState(false)
  const [torchOn, setTorchOn] = useState(false)
  const [torchSupported, setTorchSupported] = useState(false)
  const [engine, setEngine] = useState<'native' | 'zxing' | null>(null)

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

        // Check for torch support (Android Chrome mostly)
        const track = stream.getVideoTracks()[0]
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const caps = (track.getCapabilities?.() ?? {}) as any
        if (caps.torch) setTorchSupported(true)

        // Prefer native BarcodeDetector; fall back to ZXing
        const native = await tryNativeDetector()
        if (native) {
          setEngine('native')
          stopRef.current = startNativeLoop(video, native, handleDetection)
        } else {
          setEngine('zxing')
          stopRef.current = await startZXingLoop(video, handleDetection)
        }
      } catch (e) {
        if (!cancelled) setError(mapError(e))
      }
    }

    function handleDetection(raw: string) {
      if (detectedRef.current) return
      const clean = raw.replace(/[^\d]/g, '')
      // Only accept ISBN-13 barcodes (start with 978 or 979)
      if (!/^97[89]\d{10}$/.test(clean)) return

      detectedRef.current = true
      setFlash(true)

      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(60)
      }

      // Brief visual confirmation before handing off
      setTimeout(() => onDetected(clean), 250)
    }

    start()

    return () => {
      cancelled = true
      stopRef.current()
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      // some devices lie about torch support
    }
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border border-red-500/30 bg-red-500/10 p-4 text-sm">
          {error}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="rounded-md border border-neutral-300 dark:border-neutral-700 text-sm px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-900"
          >
            Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-[3/4] bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          playsInline
          muted
          className="w-full h-full object-cover"
        />

        {/* Scan-zone overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className={`w-[80%] aspect-[2.2/1] rounded-lg border-4 transition-all ${
              flash
                ? 'border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.7)]'
                : 'border-emerald-400/80'
            }`}
          />
        </div>

        {/* Engine indicator (tiny debug affordance) */}
        {engine ? (
          <div className="absolute top-2 right-2 text-[10px] text-white/60 bg-black/40 px-1.5 py-0.5 rounded">
            {engine === 'native' ? 'Native' : 'ZXing'}
          </div>
        ) : null}
      </div>

      <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
        Point at the barcode on the back of the book
      </p>

      <div className="flex gap-2">
        {torchSupported ? (
          <button
            type="button"
            onClick={toggleTorch}
            className="rounded-md border border-neutral-300 dark:border-neutral-700 text-sm px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-900"
          >
            {torchOn ? 'Torch off' : 'Torch on'}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-neutral-300 dark:border-neutral-700 text-sm px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-900 ml-auto"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

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
      // per-frame errors are fine, skip
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
