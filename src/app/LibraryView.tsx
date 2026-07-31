'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

export type BookRow = {
  id: string
  title: string
  authors: string[] | null
  cover_url: string | null
  shelves: string[] | null
}

export default function LibraryView({
  books,
  allShelves,
  activeShelf,
}: {
  books: BookRow[]
  allShelves: string[]
  activeShelf: string | null
}) {
  const [query, setQuery] = useState('')

  const shelfFiltered = useMemo(() => {
    if (!activeShelf) return books
    return books.filter((b) => (b.shelves ?? []).includes(activeShelf))
  }, [books, activeShelf])

  const visibleBooks = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return shelfFiltered
    return shelfFiltered.filter((b) => {
      if (b.title.toLowerCase().includes(q)) return true
      if ((b.authors ?? []).some((a) => a.toLowerCase().includes(q))) return true
      if ((b.shelves ?? []).some((s) => s.toLowerCase().includes(q))) return true
      return false
    })
  }, [shelfFiltered, query])

  const totalCount = books.length

  return (
    <div className="space-y-5">
      <div className="relative">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search title, author, or shelf"
          className="w-full rounded-md border border-line bg-white pl-10 pr-10 py-2.5 text-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-indigo focus:border-indigo"
          aria-label="Search library"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        {query ? (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-ink-muted hover:text-ink hover:bg-parchment-soft"
            aria-label="Clear search"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        ) : null}
      </div>

      {allShelves.length > 0 ? (
        <nav
          className="flex gap-1.5 overflow-x-auto -mx-4 px-4 pb-1"
          aria-label="Filter by shelf"
        >
          <FilterChip href="/" active={!activeShelf} label={`All (${totalCount})`} />
          {allShelves.map((s) => {
            const count = books.filter((b) => (b.shelves ?? []).includes(s)).length
            return (
              <FilterChip
                key={s}
                href={`/?shelf=${encodeURIComponent(s)}`}
                active={activeShelf === s}
                label={`${s} (${count})`}
              />
            )
          })}
        </nav>
      ) : null}

      {totalCount === 0 ? (
        <section className="rounded-xl border border-dashed border-line bg-parchment-soft p-10 text-center space-y-4">
          <p className="text-ink-soft">Your library is empty.</p>
          <Link
            href="/add"
            className="inline-block rounded-md bg-terracotta hover:bg-terracotta-strong text-white text-sm font-medium px-5 py-2.5 min-h-[44px]"
          >
            Add your first book
          </Link>
        </section>
      ) : visibleBooks.length === 0 ? (
        <section className="rounded-xl border border-dashed border-line bg-parchment-soft p-10 text-center space-y-3">
          <p className="text-ink-soft">
            {query
              ? `Nothing matches "${query}"${activeShelf ? ` on the ${activeShelf} shelf` : ''}.`
              : `No books on the ${activeShelf} shelf yet.`}
          </p>
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-sm text-indigo underline underline-offset-2"
            >
              Clear search
            </button>
          ) : (
            <Link
              href="/"
              className="text-sm text-indigo underline underline-offset-2"
            >
              Show all books
            </Link>
          )}
        </section>
      ) : (
        <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-6">
          {visibleBooks.map((book) => (
            <Link key={book.id} href={`/book/${book.id}`} className="group block">
              <div className="aspect-[2/3] bg-parchment-strong rounded-md overflow-hidden shadow-sm transition-all group-hover:shadow-md group-hover:-translate-y-0.5">
                {book.cover_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={book.cover_url}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-ink-muted p-2 text-center">
                    No cover
                  </div>
                )}
              </div>
              <div className="mt-2">
                <p className="text-sm font-medium leading-tight line-clamp-2 group-hover:text-indigo transition-colors">
                  {book.title}
                </p>
                <p className="text-xs text-ink-muted line-clamp-1 mt-0.5">
                  {(book.authors ?? []).join(', ')}
                </p>
              </div>
            </Link>
          ))}
        </section>
      )}
    </div>
  )
}

function FilterChip({
  href,
  active,
  label,
}: {
  href: string
  active: boolean
  label: string
}) {
  return (
    <Link
      href={href}
      className={`shrink-0 text-xs font-medium rounded-full px-3.5 py-1.5 border transition-colors min-h-[32px] inline-flex items-center ${
        active
          ? 'bg-indigo text-parchment border-indigo'
          : 'bg-white text-ink-soft border-line hover:border-indigo'
      }`}
    >
      {label}
    </Link>
  )
}
