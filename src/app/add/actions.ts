'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentHousehold } from '@/lib/queries'

export type SaveBookInput = {
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

export async function saveBook(input: SaveBookInput): Promise<{ error?: string }> {
  const household = await getCurrentHousehold()
  if (!household) redirect('/onboarding')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const title = input.title?.trim()
  if (!title) return { error: 'Title is required' }

  const { error } = await supabase.from('books').insert({
    household_id: household.id,
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
    added_by: user.id,
  })

  if (error) return { error: error.message }

  revalidatePath('/')
  redirect('/')
}

export type DuplicateBook = {
  id: string
  title: string
  authors: string[]
}

export async function checkDuplicate(isbn: string): Promise<DuplicateBook | null> {
  const clean = isbn.replace(/[-\s]/g, '')
  if (!clean) return null

  const household = await getCurrentHousehold()
  if (!household) return null

  const supabase = await createClient()
  const { data } = await supabase
    .from('books')
    .select('id, title, authors')
    .eq('household_id', household.id)
    .eq('isbn', clean)
    .maybeSingle()

  return (data as DuplicateBook | null) ?? null
}
