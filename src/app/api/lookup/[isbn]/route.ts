import { NextResponse } from 'next/server'
import { lookupBookByIsbn, normalizeIsbn } from '@/lib/bookLookup'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ isbn: string }> }
) {
  const { isbn: rawIsbn } = await params
  const isbn = normalizeIsbn(rawIsbn)

  if (!/^\d{10}(\d{3})?$/.test(isbn)) {
    return NextResponse.json({ error: 'Invalid ISBN format' }, { status: 400 })
  }

  const result = await lookupBookByIsbn(isbn)
  if (!result) {
    return NextResponse.json({ error: 'Book not found', isbn }, { status: 404 })
  }

  return NextResponse.json(result)
}
