'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentHousehold } from '@/lib/queries'
import { lookupBookByIsbn } from '@/lib/bookLookup'

export type BulkScanResult =
  | { status: 'added'; book_id: string; isbn: string; title: string; authors: string[]; cover_url: string | null }
  | { status: 'duplicate'; book_id: string; isbn: string; title: string; authors: string[]; cover_url: string | null }
  | { status: 'not_found'; isbn: string }
  | { status: 'error'; isbn: string; message: string }

export async function bulkScanBook(isbn: string): Promise<BulkScanResult> {
  const clean = isbn.replace(/[-\s]/g, '')
  if (!/^\d{10}(\d{3})?$/.test(clean)) {
    return { status: 'error', isbn: clean, message: 'Invalid ISBN' }
  }

  const household = await getCurrentHousehold()
  if (!household) {
    return { status: 'error', isbn: clean, message: 'No household' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { status: 'error', isbn: clean, message: 'Not signed in' }
  }

  // Check for duplicate first
  const { data: existing } = await supabase
    .from('books')
    .select('id, title, authors, cover_url')
    .eq('household_id', household.id)
    .eq('isbn', clean)
    .maybeSingle()

  if (existing) {
    return {
      status: 'duplicate',
      book_id: existing.id,
      isbn: clean,
      title: existing.title,
      authors: existing.authors ?? [],
      cover_url: existing.cover_url,
    }
  }

  // Lookup metadata
  const meta = await lookupBookByIsbn(clean)
  if (!meta) {
    return { status: 'not_found', isbn: clean }
  }

  // Save with suggested shelves auto-applied
  const { data: inserted, error } = await supabase
    .from('books')
    .insert({
      household_id: household.id,
      isbn: clean,
      title: meta.title || 'Untitled',
      authors: meta.authors,
      categories: meta.categories,
      shelves: meta.suggested_shelves,
      cover_url: meta.cover_url,
      published_year: meta.published_year,
      publisher: meta.publisher,
      page_count: meta.page_count,
      description: meta.description,
      added_by: user.id,
    })
    .select('id, title, authors, cover_url')
    .single()

  if (error || !inserted) {
    return { status: 'error', isbn: clean, message: error?.message ?? 'Insert failed' }
  }

  return {
    status: 'added',
    book_id: inserted.id,
    isbn: clean,
    title: inserted.title,
    authors: inserted.authors ?? [],
    cover_url: inserted.cover_url,
  }
}

export async function undoBulkAdd(bookId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('books').delete().eq('id', bookId)
  if (error) return { error: error.message }
  return {}
}
