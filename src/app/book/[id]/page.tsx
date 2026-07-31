import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireHousehold, getHouseholdShelves } from '@/lib/queries'
import { AppBar } from '@/components/AppBar'
import { BottomNav } from '@/components/BottomNav'
import BookDetail, { type Book } from './BookDetail'

export default async function BookPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const household = await requireHousehold()
  const { id } = await params
  const supabase = await createClient()

  const [{ data: book }, existingShelves] = await Promise.all([
    supabase
      .from('books')
      .select(
        'id, isbn, title, authors, categories, shelves, cover_url, published_year, publisher, page_count, description, notes, created_at'
      )
      .eq('id', id)
      .maybeSingle(),
    getHouseholdShelves(household.id),
  ])

  if (!book) notFound()

  return (
    <>
      <AppBar title="Book" back={{ href: '/' }} />
      <main className="max-w-lg mx-auto px-4 py-6 pb-24">
        <BookDetail book={book as Book} existingShelves={existingShelves} />
      </main>
      <BottomNav />
    </>
  )
}
