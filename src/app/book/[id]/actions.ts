'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type UpdateBookInput = {
  id: string
  isbn?: string | null
  title: string
  authors: string[]
  categories: string[]
  shelves: string[]
  cover_url?: string | null
  published_year?: number | null
  publisher?: string | null
  page_count?: number | null
  description?: string | null
  notes?: string | null
}

export async function updateBook(input: UpdateBookInput): Promise<{ error?: string }> {
  const title = input.title?.trim()
  if (!title) return { error: 'Title is required' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('books')
    .update({
      isbn: input.isbn?.trim() || null,
      title,
      authors: input.authors.filter(Boolean),
      categories: input.categories.filter(Boolean),
      shelves: input.shelves.filter(Boolean),
      cover_url: input.cover_url?.trim() || null,
      published_year: input.published_year ?? null,
      publisher: input.publisher?.trim() || null,
      page_count: input.page_count ?? null,
      description: input.description?.trim() || null,
      notes: input.notes?.trim() || null,
    })
    .eq('id', input.id)

  if (error) return { error: error.message }

  revalidatePath('/')
  revalidatePath(`/book/${input.id}`)
  return {}
}

export async function deleteBook(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('books').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/')
  redirect('/')
}
