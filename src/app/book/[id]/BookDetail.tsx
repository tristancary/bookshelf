'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { updateBook, deleteBook } from './actions'
import {
  upsertReadingLog,
  deleteReadingLog,
  type LogStatus,
} from './reading-actions'
import { ShelfSelector } from '@/components/ShelfSelector'
import { CoverSearch } from '@/components/CoverSearch'

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

export type Reader = { id: string; name: string }

export type LogEntry = {
  id: string
  reader_id: string
  status: LogStatus
  started_at: string | null
  finished_at: string | null
  rating: number | null
  notes: string | null
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

const STATUS_LABELS: Record<LogStatus, string> = {
  want_to_read: 'Wants to read',
  reading: 'Reading',
  finished: 'Finished',
  dnf: 'Did not finish',
}

export default function BookDetail({
  book,
  existingShelves,
  readers,
  log,
}: {
  book: Book
  existingShelves: string[]
  readers: Reader[]
  log: LogEntry[]
}) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('view')
  const [draft, setDraft] = useState<Book>(book)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCoverSearch, setShowCoverSearch] = useState(false)

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
    setShowCoverSearch(false)
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
    const coverQuery = [draft.title, draft.authors[0]].filter(Boolean).join(' ')
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
          <p className="text-xs text-ink-muted mt-0.5 mb-2">Tap to add or remove.</p>
          <ShelfSelector
            value={draft.shelves}
            onChange={(shelves) => setDraft({ ...draft, shelves })}
            existing={existingShelves}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-ink-soft">Cover</span>
            {!showCoverSearch ? (
              <button
                type="button"
                onClick={() => setShowCoverSearch(true)}
                className="text-xs text-indigo hover:underline"
              >
                Find cover online
              </button>
            ) : null}
          </div>
          <div className="flex gap-3">
            <div className="w-20 flex-shrink-0 aspect-[2/3] bg-parchment-strong rounded overflow-hidden border border-line">
              {draft.cover_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={draft.cover_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] text-ink-muted p-2 text-center">
                  No cover
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <input
                type="url"
                placeholder="https://..."
                value={draft.cover_url ?? ''}
                onChange={(e) => setDraft({ ...draft, cover_url: e.target.value })}
                className={inputCls}
              />
              <p className="text-xs text-ink-muted mt-1">
                Direct image URL, or use Find cover online above.
              </p>
            </div>
          </div>
          {showCoverSearch ? (
            <div className="mt-3">
              <CoverSearch
                initialQuery={coverQuery}
                onSelect={(url) => {
                  setDraft({ ...draft, cover_url: url })
                  setShowCoverSearch(false)
                }}
                onClose={() => setShowCoverSearch(false)}
              />
            </div>
          ) : null}
        </div>

        <Field label="Description">
          <textarea
            rows={4}
            value={draft.description ?? ''}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            className={inputCls}
          />
        </Field>

        <Field label="Categories (auto from metadata)">
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
              setShowCoverSearch(false)
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

      {book.description ? (
        <section className="border-t border-line pt-4">
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-ink-soft">
            {book.description}
          </p>
        </section>
      ) : null}

      <ReadingLogSection
        bookId={book.id}
        readers={readers}
        log={log}
      />

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

function ReadingLogSection({
  bookId,
  readers,
  log,
}: {
  bookId: string
  readers: Reader[]
  log: LogEntry[]
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const readerById = new Map(readers.map((r) => [r.id, r]))
  const loggedReaderIds = new Set(log.map((l) => l.reader_id))
  const untrackedReaders = readers.filter((r) => !loggedReaderIds.has(r.id))

  async function handleQuickAdd(readerId: string, status: LogStatus) {
    setBusy(true)
    setError(null)
    const today = status === 'finished' ? new Date().toISOString().slice(0, 10) : null
    const started = status === 'reading' ? new Date().toISOString().slice(0, 10) : null

    const result = await upsertReadingLog({
      book_id: bookId,
      reader_id: readerId,
      status,
      started_at: started,
      finished_at: today,
    })
    setBusy(false)
    if (result?.error) {
      setError(result.error)
      return
    }
    router.refresh()
  }

  if (readers.length === 0) {
    return (
      <section className="border border-dashed border-line rounded-lg p-4 space-y-2">
        <h3 className="text-xs font-medium uppercase tracking-wide text-ink-muted">
          Reading log
        </h3>
        <p className="text-sm text-ink-soft">
          Add household readers first, then track who&apos;s read this book.
        </p>
        <Link
          href="/readers"
          className="inline-block text-sm text-indigo underline underline-offset-2"
        >
          Manage readers →
        </Link>
      </section>
    )
  }

  return (
    <section className="border-t border-line pt-4 space-y-3">
      <div className="flex items-baseline justify-between">
        <h3 className="text-xs font-medium uppercase tracking-wide text-ink-muted">
          Reading log
        </h3>
        <Link href="/readers" className="text-xs text-ink-muted hover:text-indigo">
          Manage readers
        </Link>
      </div>

      {log.length > 0 ? (
        <ul className="space-y-2">
          {log.map((entry) => {
            const reader = readerById.get(entry.reader_id)
            if (!reader) return null
            return (
              <LogEntryRow
                key={entry.id}
                bookId={bookId}
                entry={entry}
                readerName={reader.name}
                onChanged={() => router.refresh()}
              />
            )
          })}
        </ul>
      ) : null}

      {untrackedReaders.length > 0 ? (
        <div className="rounded-lg border border-line bg-parchment-soft p-3 space-y-2">
          <p className="text-xs text-ink-muted">Add to log:</p>
          {untrackedReaders.map((r) => (
            <div key={r.id} className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium min-w-[80px]">{r.name}</span>
              <button
                type="button"
                onClick={() => handleQuickAdd(r.id, 'want_to_read')}
                disabled={busy}
                className="text-xs rounded-full border border-line bg-white px-2.5 py-1 hover:border-indigo disabled:opacity-50"
              >
                Wants to read
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(r.id, 'reading')}
                disabled={busy}
                className="text-xs rounded-full border border-line bg-white px-2.5 py-1 hover:border-indigo disabled:opacity-50"
              >
                Reading
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(r.id, 'finished')}
                disabled={busy}
                className="text-xs rounded-full border border-terracotta/40 bg-white text-terracotta-strong px-2.5 py-1 hover:bg-terracotta/10 disabled:opacity-50"
              >
                Finished
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </section>
  )
}

function LogEntryRow({
  bookId,
  entry,
  readerName,
  onChanged,
}: {
  bookId: string
  entry: LogEntry
  readerName: string
  onChanged: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<LogEntry>(entry)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    setBusy(true)
    setError(null)
    const result = await upsertReadingLog({
      book_id: bookId,
      reader_id: entry.reader_id,
      status: draft.status,
      started_at: draft.started_at,
      finished_at: draft.finished_at,
      rating: draft.rating,
      notes: draft.notes,
    })
    setBusy(false)
    if (result?.error) {
      setError(result.error)
      return
    }
    setEditing(false)
    onChanged()
  }

  async function remove() {
    if (!window.confirm(`Remove ${readerName}'s log entry?`)) return
    setBusy(true)
    setError(null)
    const result = await deleteReadingLog(entry.id, bookId, entry.reader_id)
    setBusy(false)
    if (result?.error) {
      setError(result.error)
      return
    }
    onChanged()
  }

  if (!editing) {
    return (
      <li className="rounded-lg border border-line bg-white p-3 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-medium">{readerName}</span>
            <StatusPill status={entry.status} />
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs text-ink-muted hover:text-indigo shrink-0"
          >
            Edit
          </button>
        </div>
        <p className="text-xs text-ink-muted">
          {entry.status === 'finished' && entry.finished_at
            ? `Finished ${new Date(entry.finished_at).toLocaleDateString()}`
            : entry.status === 'reading' && entry.started_at
              ? `Started ${new Date(entry.started_at).toLocaleDateString()}`
              : STATUS_LABELS[entry.status]}
          {entry.rating ? ` · ${'★'.repeat(entry.rating)}${'☆'.repeat(5 - entry.rating)}` : ''}
        </p>
        {entry.notes ? (
          <p className="text-xs text-ink-soft mt-1">{entry.notes}</p>
        ) : null}
      </li>
    )
  }

  return (
    <li className="rounded-lg border border-indigo bg-white p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{readerName}</span>
        <button
          type="button"
          onClick={remove}
          disabled={busy}
          className="text-xs text-danger hover:underline disabled:opacity-50"
        >
          Delete entry
        </button>
      </div>

      <Field label="Status">
        <select
          value={draft.status}
          onChange={(e) => setDraft({ ...draft, status: e.target.value as LogStatus })}
          className={inputCls}
        >
          <option value="want_to_read">Wants to read</option>
          <option value="reading">Reading</option>
          <option value="finished">Finished</option>
          <option value="dnf">Did not finish</option>
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Started">
          <input
            type="date"
            value={draft.started_at ?? ''}
            onChange={(e) => setDraft({ ...draft, started_at: e.target.value || null })}
            className={inputCls}
          />
        </Field>
        <Field label="Finished">
          <input
            type="date"
            value={draft.finished_at ?? ''}
            onChange={(e) => setDraft({ ...draft, finished_at: e.target.value || null })}
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="Rating (1-5)">
        <input
          type="number"
          min={1}
          max={5}
          value={draft.rating ?? ''}
          onChange={(e) =>
            setDraft({
              ...draft,
              rating: e.target.value ? parseInt(e.target.value, 10) : null,
            })
          }
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
        <button type="button" onClick={save} disabled={busy} className={primaryCls}>
          {busy ? 'Saving...' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => {
            setDraft(entry)
            setEditing(false)
          }}
          className={secondaryCls}
        >
          Cancel
        </button>
      </div>
    </li>
  )
}

function StatusPill({ status }: { status: LogStatus }) {
  const cls: Record<LogStatus, string> = {
    want_to_read: 'bg-parchment-strong text-ink-soft border-line',
    reading: 'bg-indigo text-parchment border-indigo',
    finished: 'bg-success/20 text-success border-success/40',
    dnf: 'bg-parchment-strong text-ink-muted border-line',
  }
  return (
    <span className={`text-xs font-medium rounded-full px-2 py-0.5 border ${cls[status]}`}>
      {STATUS_LABELS[status]}
    </span>
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
