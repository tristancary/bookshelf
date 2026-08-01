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
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=12`,
      { next: { revalidate: 60 * 60 } }
    )
    if (!res.ok) {
      return NextResponse.json({ results: [] })
    }

    const data = await res.json()
    const items = (data.items ?? []) as Array<{
      volumeInfo?: {
        title?: string
        authors?: string[]
        imageLinks?: { thumbnail?: string; smallThumbnail?: string }
      }
    }>

    const results: CoverResult[] = items
      .map((item) => {
        const v = item.volumeInfo ?? {}
        let url = v.imageLinks?.thumbnail ?? v.imageLinks?.smallThumbnail ?? null
        if (!url) return null
        if (url.startsWith('http://')) url = url.replace('http://', 'https://')
        // Bump zoom parameter to get a larger image (Google supports this)
        url = url.replace(/&zoom=\d+/, '&zoom=1')
        return {
          url,
          title: v.title ?? 'Untitled',
          authors: v.authors ?? [],
        }
      })
      .filter((r): r is CoverResult => r !== null)
      .slice(0, 8)

    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ results: [] })
  }
}
