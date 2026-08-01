'use client'

import { useState } from 'react'

type CoverResult = {
  url: string
  title: string
  authors: string[]
}

export function CoverSearch({
  initialQuery,
  onSelect,
  onClose,
}: {
  initialQuery: string
  onSelect: (url: string) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<CoverResult[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setBusy(true)
    setError(null)
    setHasSearched(true)
    try {
      const res = await fetch(
        `/api/cover-search?q=${encodeURIComponent(query)}`
      )
      if (!res.ok) {
        setError('Search failed')
        return
      }
      const data = await res.json()
      setResults(data.results ?? [])
    } catch {
      setError('Network error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-lg border border-line bg-parchment-soft p-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-ink-soft">Find cover online</p>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-ink-muted hover:text-ink"
        >
          Close
        </button>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Title, author, or both"
          className="flex-1 rounded-md border border-line bg-white px-3 py-2 text-sm min-h-[40px] focus:outline-none focus:ring-2 focus:ring-indigo focus:border-indigo"
        />
        <button
          type="submit"
          disabled={busy || !query.trim()}
          className="rounded-md bg-indigo hover:bg-indigo-strong disabled:opacity-50 text-parchment text-sm font-medium px-3 py-2 min-h-[40px]"
        >
          {busy ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error ? <p className="text-xs text-danger">{error}</p> : null}

      {hasSearched && !busy && results.length === 0 ? (
        <p className="text-xs text-ink-muted text-center py-4">
          No covers found. Try a different query.
        </p>
      ) : null}

      {results.length > 0 ? (
        <>
          <p className="text-xs text-ink-muted">Tap a cover to use it:</p>
          <div className="grid grid-cols-4 gap-2">
            {results.map((r, i) => (
              <button
                key={`${r.url}-${i}`}
                type="button"
                onClick={() => onSelect(r.url)}
                title={`${r.title}${r.authors.length ? ' — ' + r.authors.join(', ') : ''}`}
                className="aspect-[2/3] bg-parchment-strong rounded overflow-hidden border border-line hover:border-indigo hover:shadow-md transition-all"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={r.url}
                  alt={r.title}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}
