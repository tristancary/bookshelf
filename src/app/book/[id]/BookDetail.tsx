'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateBook, deleteBook } from './actions'
import { ShelfSelector } from '@/components/ShelfSelector'

export type Book = {
  id: string
  isbn: string | null
  title: string
  authors: string[]
  categories: string[]
  shelves: string[]
  cover_url: string | null
  published_year: number | null
  publisher: string | null
  page_count: number | null
  description: string | null
  notes: string | null
  created_at: string
}

type Mode = 'view' | 'edit'

const inputCls =
  'mt-1 w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-indigo focus:border-indigo min-h-[44px]'
const primaryCls =
  'rounded-md bg-terracotta hover:bg-terracotta-strong disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 min-h-[44px] inline-flex items-center justify-center transition-colors'
const secondaryCls =
  'rounded-md border border-line bg-white hover:bg-parchment-soft text-ink text-sm font-medium px-5 py-2.5 min-h-[44px] inline-flex items-center justify-center transition-colors'
const dangerCls =
  'rounded-md border border-danger/40 bg-white text-danger hover:bg-danger/10 disabled:opacity-50 text-sm font-medium px-5 py-2.5 min-h-[44px] inline-flex items-center justify-center transition-colors'

export default function BookDetail({
  book,
  existingShelves,
}: {
  book: Book
  existingShelves: string[]
}) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('view')
  const [draft, setDraft] = useState<Book>(book)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const result = await updateBook({
      id: book.id,
      isbn: draft.isbn,
      title: draft.title,
      authors: draft.authors,
      categories: draft.categories,
      shelves: draft.shelves,
      cover_url: draft.cover_url,
      published_year: draft.published_year,
      publisher: draft.publisher,
      page_count: draft.page_count,
      description: draft.description,
      notes: draft.notes,
    })
    setBusy(false)
    if (result?.error) {
      setError(result.error)
      return
    }
    setMode('view')
    router.refresh()
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete "${book.title}"? This cannot be undone.`
    )
    if (!confirmed) return
    setBusy(true)
    setError(null)
    const result = await deleteBook(book.id)
    if (result?.error) {
      setError(result.error)
      setBusy(false)
    }
  }

  if (mode === 'edit') {
    return (
      <form onSubmit={handleSave} className="space-y-5">
        <Field label="Title" required>
          <input
            type="text"
            required
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Authors (comma separated)">
          <input
            type="text"
            value={draft.authors.join(', ')}
            onChange={(e) =>
              setDraft({
                ...draft,
                authors: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
              })
            }
            className={inputCls}
          />
        </Field>

        <div>
          <span className="text-sm font-medium text-ink-soft">Shelves</span>
          <p className="text-xs text-ink-muted mt-0.5 mb-2">
            Tap to add or remove.
          </p>
          <ShelfSelector
            value={draft.shelves}
            onChange={(shelves) => setDraft({ ...draft, shelves })}
            existing={existingShelves}
          />
        </div>

        <Field label="Categories (auto from metadata, comma separated)">
          <input
            type="text"
            value={draft.categories.join(', ')}
            onChange={(e) =>
              setDraft({
                ...draft,
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
              value={draft.published_year ?? ''}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  published_year: e.target.value ? parseInt(e.target.value, 10) : null,
                })
              }
              className={inputCls}
            />
          </Field>
          <Field label="Pages">
            <input
              type="number"
              value={draft.page_count ?? ''}
              onChange={(e) =>
                setDraft({
                  ...draft,
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
            value={draft.publisher ?? ''}
            onChange={(e) => setDraft({ ...draft, publisher: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="ISBN">
          <input
            type="text"
            value={draft.isbn ?? ''}
            onChange={(e) => setDraft({ ...draft, isbn: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Cover URL">
          <input
            type="url"
            value={draft.cover_url ?? ''}
            onChange={(e) => setDraft({ ...draft, cover_url: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Description">
          <textarea
            rows={3}
            value={draft.description ?? ''}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Notes">
          <textarea
            rows={2}
            value={draft.notes ?? ''}
            onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            className={inputCls}
          />
        </Field>

        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <div className="flex gap-2">
          <button type="submit" disabled={busy} className={primaryCls}>
            {busy ? 'Saving...' : 'Save changes'}
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft(book)
              setMode('view')
              setError(null)
            }}
            className={secondaryCls}
          >
            Cancel
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <div className="w-32 sm:w-40 flex-shrink-0 aspect-[2/3] bg-parchment-strong rounded-md overflow-hidden shadow-md">
          {book.cover_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-ink-muted p-2 text-center">
              No cover
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <h2 className="text-xl font-semibold leading-tight text-indigo">{book.title}</h2>
          {book.authors.length ? (
            <p className="text-sm text-ink-soft">{book.authors.join(', ')}</p>
          ) : null}
          {book.shelves.length ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {book.shelves.map((s) => (
                <span
                  key={s}
                  className="text-xs font-medium rounded-full bg-indigo text-parchment px-2.5 py-1"
                >
                  {s}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm border-t border-line pt-4">
        <MetaRow label="Year" value={book.published_year} />
        <MetaRow label="Pages" value={book.page_count} />
        <MetaRow label="Publisher" value={book.publisher} />
        <MetaRow label="ISBN" value={book.isbn} />
      </dl>

      {book.categories.length ? (
        <section className="border-t border-line pt-4">
          <h3 className="text-xs font-medium uppercase tracking-wide text-ink-muted mb-2">
            Categories
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {book.categories.map((c) => (
              <span
                key={c}
                className="text-xs rounded-full border border-line bg-white px-2.5 py-0.5 text-ink-soft"
              >
                {c}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {book.description ? (
        <section className="border-t border-line pt-4">
          <h3 className="text-xs font-medium uppercase tracking-wide text-ink-muted mb-2">
            Description
          </h3>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{book.description}</p>
        </section>
      ) : null}

      {book.notes ? (
        <section className="border-t border-line pt-4">
          <h3 className="text-xs font-medium uppercase tracking-wide text-ink-muted mb-2">
            Notes
          </h3>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{book.notes}</p>
        </section>
      ) : null}

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <div className="flex gap-2 border-t border-line pt-4">
        <button type="button" onClick={() => setMode('edit')} className={primaryCls}>
          Edit
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={busy}
          className={`${dangerCls} ml-auto`}
        >
          {busy ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  )
}

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

function MetaRow({
  label,
  value,
}: {
  label: string
  value: string | number | null
}) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div>
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className="text-sm mt-0.5">{value}</dd>
    </div>
  )
}
