'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { lookupBookByIsbn } from '@/lib/bookLookup'

export async function refreshBookMetadata(
  id: string
): Promise<{ error?: string; updatedFields?: string[] }> {
  const supabase = await createClient()

  const { data: book, error: fetchError } = await supabase
    .from('books')
    .select('id, isbn, description, cover_url, categories, page_count, publisher, published_year')
    .eq('id', id)
    .maybeSingle()

  if (fetchError) return { error: fetchError.message }
  if (!book) return { error: 'Book not found' }
  if (!book.isbn) return { error: 'No ISBN on this book to refresh from' }

  const meta = await lookupBookByIsbn(book.isbn)
  if (!meta) return { error: 'Lookup failed or book not found in providers' }

  const patch: Record<string, unknown> = {}
  const updatedFields: string[] = []

  if (!book.description && meta.description) {
    patch.description = meta.description
    updatedFields.push('description')
  }
  if (!book.cover_url && meta.cover_url) {
    patch.cover_url = meta.cover_url
    updatedFields.push('cover')
  }
  if ((!book.categories || book.categories.length === 0) && meta.categories?.length) {
    patch.categories = meta.categories
    updatedFields.push('categories')
  }
  if (!book.page_count && meta.page_count) {
    patch.page_count = meta.page_count
    updatedFields.push('pages')
  }
  if (!book.publisher && meta.publisher) {
    patch.publisher = meta.publisher
    updatedFields.push('publisher')
  }
  if (!book.published_year && meta.published_year) {
    patch.published_year = meta.published_year
    updatedFields.push('year')
  }

  if (Object.keys(patch).length === 0) {
    return { updatedFields: [] }
  }

  const { error: updateError } = await supabase
    .from('books')
    .update(patch)
    .eq('id', id)

  if (updateError) return { error: updateError.message }

  revalidatePath(`/book/${id}`)
  revalidatePath('/')
  return { updatedFields }
}
