import { NextResponse } from 'next/server'
import { suggestShelves } from '@/lib/shelfSuggest'

export type BookMetadata = {
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
  suggested_shelves: string[]
  suggestion_source: 'rules' | 'llm' | 'none'
}

function normalizeIsbn(isbn: string): string {
  return isbn.replace(/[-\s]/g, '').trim()
}

function extractYear(dateStr: string | undefined | null): number | null {
  if (!dateStr) return null
  const m = dateStr.match(/\d{4}/)
  return m ? parseInt(m[0], 10) : null
}

type PartialMetadata = Omit<BookMetadata, 'suggested_shelves' | 'suggestion_source'>

async function fromOpenLibrary(isbn: string): Promise<PartialMetadata | null> {
  try {
    const res = await fetch(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`,
      { next: { revalidate: 60 * 60 * 24 } }
    )
    if (!res.ok) return null
    const data = await res.json()
    const book = data[`ISBN:${isbn}`]
    if (!book) return null

    const cover =
      book.cover?.large ??
      book.cover?.medium ??
      book.cover?.small ??
      `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`

    return {
      isbn,
      title: book.title ?? '',
      authors: (book.authors ?? []).map((a: { name: string }) => a.name),
      categories: (book.subjects ?? [])
        .map((s: { name: string }) => s.name)
        .slice(0, 10),
      cover_url: cover,
      published_year: extractYear(book.publish_date),
      publisher: book.publishers?.[0]?.name ?? null,
      page_count: book.number_of_pages ?? null,
      description: null, // OL's data endpoint doesn't include descriptions
      source: 'openlibrary',
    }
  } catch {
    return null
  }
}

async function fromGoogleBooks(isbn: string): Promise<PartialMetadata | null> {
  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`,
      { next: { revalidate: 60 * 60 * 24 } }
    )
    if (!res.ok) return null
    const data = await res.json()
    const item = data.items?.[0]
    if (!item) return null
    const v = item.volumeInfo ?? {}

    let cover: string | null =
      v.imageLinks?.thumbnail ?? v.imageLinks?.smallThumbnail ?? null
    if (cover && cover.startsWith('http://')) {
      cover = cover.replace('http://', 'https://')
    }

    return {
      isbn,
      title: v.title ?? '',
      authors: v.authors ?? [],
      categories: (v.categories ?? []).slice(0, 10),
      cover_url: cover,
      published_year: extractYear(v.publishedDate),
      publisher: v.publisher ?? null,
      page_count: v.pageCount ?? null,
      description: v.description ?? null,
      source: 'google',
    }
  } catch {
    return null
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ isbn: string }> }
) {
  const { isbn: rawIsbn } = await params
  const isbn = normalizeIsbn(rawIsbn)

  if (!/^\d{10}(\d{3})?$/.test(isbn)) {
    return NextResponse.json(
      { error: 'Invalid ISBN format' },
      { status: 400 }
    )
  }

  // Fetch both in parallel so we can enrich missing fields from either source
  const [olResult, gbResult] = await Promise.all([
    fromOpenLibrary(isbn).catch(() => null),
    fromGoogleBooks(isbn).catch(() => null),
  ])

  const primary = olResult ?? gbResult
  if (!primary) {
    return NextResponse.json(
      { error: 'Book not found', isbn },
      { status: 404 }
    )
  }

  // Cross-enrich: fill missing description and cover from the other source
  const secondary = primary === olResult ? gbResult : olResult
  const merged: PartialMetadata = {
    ...primary,
    description: primary.description || secondary?.description || null,
    cover_url: primary.cover_url || secondary?.cover_url || null,
    // Merge categories from both, dedupe
    categories: Array.from(
      new Set([...(primary.categories ?? []), ...(secondary?.categories ?? [])])
    ).slice(0, 10),
  }

  const suggestion = await suggestShelves({
    title: merged.title,
    authors: merged.authors,
    categories: merged.categories,
    description: merged.description,
  })

  const result: BookMetadata = {
    ...merged,
    suggested_shelves: suggestion.shelves,
    suggestion_source: suggestion.source,
  }

  return NextResponse.json(result)
}
