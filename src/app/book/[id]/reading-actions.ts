'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type LogStatus = 'want_to_read' | 'reading' | 'finished' | 'dnf'

export type SaveLogInput = {
  book_id: string
  reader_id: string
  status: LogStatus
  started_at?: string | null
  finished_at?: string | null
  rating?: number | null
  notes?: string | null
}

export async function upsertReadingLog(
  input: SaveLogInput
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const payload = {
    book_id: input.book_id,
    reader_id: input.reader_id,
    status: input.status,
    started_at: input.started_at || null,
    finished_at: input.finished_at || null,
    rating: input.rating ?? null,
    notes: input.notes?.trim() || null,
  }

  const { error } = await supabase
    .from('reading_log')
    .upsert(payload, { onConflict: 'book_id,reader_id' })

  if (error) return { error: error.message }

  revalidatePath(`/book/${input.book_id}`)
  revalidatePath('/readers')
  revalidatePath(`/readers/${input.reader_id}`)
  return {}
}

export async function deleteReadingLog(
  id: string,
  bookId: string,
  readerId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('reading_log').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(`/book/${bookId}`)
  revalidatePath('/readers')
  revalidatePath(`/readers/${readerId}`)
  return {}
}
