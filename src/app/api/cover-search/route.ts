import { NextResponse } from 'next/server'

export type CoverResult = {
  url: string
  title: string
  authors: string[]
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()

  if (!q) {
    return NextResponse.json({ error: 'Query required' }, { status: 400 })
  }

  try {
    // Open Library search API. Returns docs with cover_i for cover lookup.
    const res = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=20&fields=title,author_name,cover_i,edition_count`,
      { next: { revalidate: 60 * 60 } }
    )
    if (!res.ok) {
      return NextResponse.json({ results: [] })
    }

    const data = await res.json()
    const docs = (data.docs ?? []) as Array<{
      title?: string
      author_name?: string[]
      cover_i?: number
    }>

    const seen = new Set<number>()
    const results: CoverResult[] = []

    for (const doc of docs) {
      if (!doc.cover_i) continue
      if (seen.has(doc.cover_i)) continue
      seen.add(doc.cover_i)
      results.push({
        url: `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`,
        title: doc.title ?? 'Untitled',
        authors: doc.author_name ?? [],
      })
      if (results.length >= 12) break
    }

    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ results: [] })
  }
}
