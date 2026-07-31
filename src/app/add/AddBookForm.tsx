'use client'

import { useState } from 'react'
import Link from 'next/link'
import { saveBook, checkDuplicate, type DuplicateBook } from './actions'
import Scanner from './Scanner'
import { ShelfSelector } from '@/components/ShelfSelector'

type BookMetadata = {
  isbn: string
  title: string
  authors: string[]
  categories: string[]
  cover_url: string | null
  published_year: number | null
  publisher: string | null
  page_count: number | null
  description: string | null
  source: 'openlibrary' | 'google' | 'none'
}

type Mode = 'choose' | 'scan' | 'isbn' | 'edit'

const emptyMeta: BookMetadata = {
  isbn: '',
  title: '',
  authors: [],
  categories: [],
  cover_url: null,
  published_year: null,
  publisher: null,
  page_count: null,
  description: null,
  source: 'none',
}

export default function AddBookForm({
  existingShelves,
}: {
  existingShelves: string[]
}) {
  const [mode, setMode] = useState<Mode>('choose')
  const [isbnInput, setIsbnInput] = useState('')
  const [meta, setMeta] = useState<BookMetadata>(emptyMeta)
  const [shelves, setShelves] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [duplicate, setDuplicate] = useState<DuplicateBook | null>(null)

  async function performLookup(isbn: string) {
    setBusy(true)
    setError(null)
    setInfo(null)
    setDuplicate(null)
    try {
      const clean = isbn.replace(/[-\s]/g, '')

      // Check for duplicate in parallel with lookup
      const [dupResult, lookupRes] = await Promise.all([
        checkDuplicate(clean),
        fetch(`/api/lookup/${clean}`),
      ])

      if (dupResult) setDuplicate(dupResult)

      if (!lookupRes.ok) {
        const data = await lookupRes.json().catch(() => ({}))
        setInfo(
          data.error === 'Book not found'
            ? 'No metadata found. You can still fill it in manually.'
            : (data.error ?? 'Lookup failed')
        )
        setMeta({ ...emptyMeta, isbn: clean })
        setMode('edit')
        return
      }
      const data: BookMetadata = await lookupRes.json()
      setMeta(data)
      setMode('edit')
    } catch {
      setError('Network error during lookup')
      setMeta({ ...emptyMeta, isbn: isbn.replace(/[-\s]/g, '') })
      setMode('edit')
    } finally {
      setBusy(false)
    }
  }

  async function handleLookupSubmit(e: React.FormEvent) {
    e.preventDefault()
    await performLookup(isbnInput)
  }

  async function handleScanDetected(isbn: string) {
    await performLookup(isbn)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const result = await saveBook({
      isbn: meta.isbn,
      title: meta.title,
      authors: meta.authors,
      categories: meta.categories,
      shelves,
      cover_url: meta.cover_url,
      published_year: meta.published_year,
      publisher: meta.publisher,
      page_count: meta.page_count,
      description: meta.description,
      notes,
    })
    if (result?.error) {
      setError(result.error)
      setBusy(false)
    }
  }

  if (mode === 'choose') {
    return (
      <div className="space-y-3">
        <Tile
          onClick={() => setMode('scan')}
          title="Scan barcode"
          subtitle="Point your camera at the back of the book"
        />
        <Tile
          onClick={() => setMode('isbn')}
          title="Type ISBN"
          subtitle="Enter the 10 or 13 digit code by hand"
        />
        <Tile
          onClick={() => {
            setMeta(emptyMeta)
            setShelves([])
            setDuplicate(null)
            setMode('edit')
          }}
          title="Add manually"
          subtitle="No ISBN, no lookup"
        />
      </div>
    )
  }

  if (mode === 'scan') {
    return (
      <div className="space-y-4">
        {busy ? (
          <div className="rounded-md border border-success/30 bg-success/10 p-4 text-sm">
            Looking up book…
          </div>
        ) : (
          <Scanner
            onDetected={handleScanDetected}
            onCancel={() => setMode('choose')}
          />
        )}
      </div>
    )
  }

  if (mode === 'isbn') {
    return (
      <form onSubmit={handleLookupSubmit} className="space-y-4">
        <Field label="ISBN">
          <input
            type="text"
            inputMode="numeric"
            autoFocus
            required
            value={isbnInput}
            onChange={(e) => setIsbnInput(e.target.value)}
            placeholder="9780593135204"
            className={inputCls}
          />
          <span className="mt-1 block text-xs text-ink-muted">
            Hyphens and spaces are fine.
          </span>
        </Field>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <div className="flex gap-2">
          <button type="submit" disabled={busy} className={primaryCls}>
            {busy ? 'Looking up...' : 'Look up'}
          </button>
          <button
            type="button"
            onClick={() => setMode('choose')}
            className={secondaryCls}
          >
            Back
          </button>
        </div>
      </form>
    )
  }

  return (
    <form onSubmit={handleSave} className="space-y-5">
      {duplicate ? (
        <div className="rounded-lg border border-terracotta/40 bg-terracotta/10 p-4 space-y-2">
          <p className="text-sm font-semibold text-terracotta-strong">
            Already in your library
          </p>
          <p className="text-xs text-ink-soft">
            {duplicate.title}
            {duplicate.authors.length ? ` by ${duplicate.authors.join(', ')}` : ''}
            {' '}is already on your shelf.
          </p>
          <div className="flex gap-2 pt-1">
            <Link
              href={`/book/${duplicate.id}`}
              className="rounded-md border border-terracotta/50 bg-white text-terracotta-strong hover:bg-terracotta/10 text-xs font-medium px-3 py-1.5"
            >
              View existing entry
            </Link>
            <span className="text-xs text-ink-muted self-center">
              or continue below to add another copy
            </span>
          </div>
        </div>
      ) : null}

      <div className="flex gap-4">
        <div className="w-24 flex-shrink-0 aspect-[2/3] bg-parchment-strong rounded-md overflow-hidden shadow-sm">
          {meta.cover_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={meta.cover_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-ink-muted">
              No cover
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          {meta.source !== 'none' ? (
            <p className="text-xs text-ink-muted">
              Metadata from{' '}
              {meta.source === 'openlibrary' ? 'Open Library' : 'Google Books'}
            </p>
          ) : null}
          {info ? (
            <p className="text-xs text-terracotta-strong">{info}</p>
          ) : null}
        </div>
      </div>

      <Field label="Title" required>
        <input
          type="text"
          required
          value={meta.title}
          onChange={(e) => setMeta({ ...meta, title: e.target.value })}
          className={inputCls}
        />
      </Field>

      <Field label="Authors (comma separated)">
        <input
          type="text"
          value={meta.authors.join(', ')}
          onChange={(e) =>
            setMeta({
              ...meta,
              authors: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
            })
          }
          className={inputCls}
        />
      </Field>

      <div>
        <span className="text-sm font-medium text-ink-soft">Shelves</span>
        <p className="text-xs text-ink-muted mt-0.5 mb-2">
          Tap to add. Use custom names for readers or topics.
        </p>
        <ShelfSelector
          value={shelves}
          onChange={setShelves}
          existing={existingShelves}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Year">
          <input
            type="number"
            value={meta.published_year ?? ''}
            onChange={(e) =>
              setMeta({
                ...meta,
                published_year: e.target.value ? parseInt(e.target.value, 10) : null,
              })
            }
            className={inputCls}
          />
        </Field>
        <Field label="Pages">
          <input
            type="number"
            value={meta.page_count ?? ''}
            onChange={(e) =>
              setMeta({
                ...meta,
                page_count: e.target.value ? parseInt(e.target.value, 10) : null,
              })
            }
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="Publisher">
        <input
          type="text"
          value={meta.publisher ?? ''}
          onChange={(e) => setMeta({ ...meta, publisher: e.target.value })}
          className={inputCls}
        />
      </Field>

      <Field label="ISBN">
        <input
          type="text"
          value={meta.isbn}
          onChange={(e) => setMeta({ ...meta, isbn: e.target.value })}
          className={inputCls}
        />
      </Field>

      <Field label="Notes">
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={inputCls}
        />
      </Field>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <div className="flex gap-2">
        <button type="submit" disabled={busy} className={primaryCls}>
          {busy ? 'Saving...' : 'Save book'}
        </button>
        <Link href="/" className={secondaryCls}>
          Cancel
        </Link>
      </div>
    </form>
  )
}

const inputCls =
  'mt-1 w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-indigo focus:border-indigo min-h-[44px]'

const primaryCls =
  'rounded-md bg-terracotta hover:bg-terracotta-strong disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 min-h-[44px] inline-flex items-center justify-center transition-colors'

const secondaryCls =
  'rounded-md border border-line bg-white hover:bg-parchment-soft text-ink text-sm font-medium px-5 py-2.5 min-h-[44px] inline-flex items-center justify-center transition-colors'

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink-soft">
        {label}
        {required ? <span className="text-danger ml-0.5">*</span> : null}
      </span>
      {children}
    </label>
  )
}

function Tile({
  onClick,
  title,
  subtitle,
}: {
  onClick?: () => void
  title: string
  subtitle: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-xl border border-line bg-white p-4 min-h-[64px] hover:border-terracotta hover:shadow-sm transition-all"
    >
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="text-xs text-ink-muted mt-1">{subtitle}</p>
    </button>
  )
}
