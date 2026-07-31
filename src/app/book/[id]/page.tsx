import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireHousehold, getHouseholdShelves } from '@/lib/queries'
import { AppBar } from '@/components/AppBar'
import { BottomNav } from '@/components/BottomNav'
import BookDetail, { type Book, type Reader, type LogEntry } from './BookDetail'

export default async function BookPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const household = await requireHousehold()
  const { id } = await params
  const supabase = await createClient()

  const [{ data: book }, existingShelves, { data: readers }, { data: log }] =
    await Promise.all([
      supabase
        .from('books')
        .select(
          'id, isbn, title, authors, categories, shelves, cover_url, published_year, publisher, page_count, description, notes, created_at'
        )
        .eq('id', id)
        .maybeSingle(),
      getHouseholdShelves(household.id),
      supabase
        .from('readers')
        .select('id, name')
        .eq('household_id', household.id)
        .order('name'),
      supabase
        .from('reading_log')
        .select('id, reader_id, status, started_at, finished_at, rating, notes')
        .eq('book_id', id),
    ])

  if (!book) notFound()

  return (
    <>
      <AppBar title="Book" back={{ href: '/' }} />
      <main className="max-w-lg mx-auto px-4 py-6 pb-24">
        <BookDetail
          book={book as Book}
          existingShelves={existingShelves}
          readers={(readers as Reader[] | null) ?? []}
          log={(log as LogEntry[] | null) ?? []}
        />
      </main>
      <BottomNav />
    </>
  )
}
