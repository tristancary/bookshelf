'use client'

import { useState } from 'react'
import Link from 'next/link'
import { saveBook } from './actions'

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

type Mode = 'choose' | 'isbn' | 'edit'

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

export default function AddBookForm() {
  const [mode, setMode] = useState<Mode>('choose')
  const [isbnInput, setIsbnInput] = useState('')
  const [meta, setMeta] = useState<BookMetadata>(emptyMeta)
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      const clean = isbnInput.replace(/[-\s]/g, '')
      const res = await fetch(`/api/lookup/${clean}`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setInfo(
          data.error === 'Book not found'
            ? 'No metadata found. You can still fill it in manually.'
            : (data.error ?? 'Lookup failed')
        )
        setMeta({ ...emptyMeta, isbn: clean })
        setMode('edit')
        return
      }
      const data: BookMetadata = await res.json()
      setMeta(data)
      setMode('edit')
    } catch {
      setError('Network error during lookup')
    } finally {
      setBusy(false)
    }
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
    // On success, saveBook redirects to /
  }

  if (mode === 'choose') {
    return (
      <div className="space-y-3">
        <Tile
          disabled
          title="Scan barcode"
          subtitle="Point your camera at the back of the book"
          badge="Coming next"
        />
        <Tile
          onClick={() => setMode('isbn')}
          title="Type ISBN"
          subtitle="Enter the 10 or 13 digit code by hand"
        />
        <Tile
          onClick={() => {
            setMeta(emptyMeta)
            setMode('edit')
          }}
          title="Add manually"
          subtitle="No ISBN, no lookup"
        />
      </div>
    )
  }

  if (mode === 'isbn') {
    return (
      <form onSubmit={handleLookup} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium">ISBN</span>
          <input
            type="text"
            inputMode="numeric"
            autoFocus
            required
            value={isbnInput}
            onChange={(e) => setIsbnInput(e.target.value)}
            placeholder="9780593135204"
            className="mt-1 w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <span className="mt-1 block text-xs text-neutral-500 dark:text-neutral-400">
            Hyphens and spaces are fine.
          </span>
        </label>
        {error ? <p className="text-sm text-red-500">{error}</p> : null}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2"
          >
            {busy ? 'Looking up...' : 'Look up'}
          </button>
          <button
            type="button"
            onClick={() => setMode('choose')}
            className="rounded-md border border-neutral-300 dark:border-neutral-700 text-sm px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-900"
          >
            Back
          </button>
        </div>
      </form>
    )
  }

  // mode === 'edit'
  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="flex gap-4">
        <div className="w-24 flex-shrink-0 aspect-[2/3] bg-neutral-100 dark:bg-neutral-900 rounded-md overflow-hidden">
          {meta.cover_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={meta.cover_url}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400">
              No cover
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          {meta.source !== 'none' ? (
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Metadata from {meta.source === 'openlibrary' ? 'Open Library' : 'Google Books'}
            </p>
          ) : null}
          {info ? (
            <p className="text-xs text-amber-600 dark:text-amber-500">{info}</p>
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

      <Field label="Categories (comma separated)">
        <input
          type="text"
          value={meta.categories.join(', ')}
          onChange={(e) =>
            setMeta({
              ...meta,
              categories: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
            })
          }
          className={inputCls}
        />
      </Field>

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

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2"
        >
          {busy ? 'Saving...' : 'Save book'}
        </button>
        <Link
          href="/"
          className="rounded-md border border-neutral-300 dark:border-neutral-700 text-sm px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-900"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}

const inputCls =
  'mt-1 w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500'

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
      <span className="text-sm font-medium">
        {label}
        {required ? <span className="text-red-500 ml-0.5">*</span> : null}
      </span>
      {children}
    </label>
  )
}

function Tile({
  onClick,
  title,
  subtitle,
  disabled,
  badge,
}: {
  onClick?: () => void
  title: string
  subtitle: string
  disabled?: boolean
  badge?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left rounded-lg border p-4 transition-colors ${
        disabled
          ? 'border-neutral-200 dark:border-neutral-800 opacity-60 cursor-not-allowed'
          : 'border-neutral-300 dark:border-neutral-700 hover:border-emerald-500 hover:bg-emerald-500/5'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {subtitle}
          </p>
        </div>
        {badge ? (
          <span className="text-xs rounded-full border border-neutral-300 dark:border-neutral-700 px-2 py-0.5 text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
            {badge}
          </span>
        ) : null}
      </div>
    </button>
  )
}
