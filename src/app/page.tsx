import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireHousehold } from '@/lib/queries'
import { AppBar } from '@/components/AppBar'
import { BottomNav } from '@/components/BottomNav'
import LibraryView, { type BookRow } from './LibraryView'

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ shelf?: string }>
}) {
  const household = await requireHousehold()
  const params = await searchParams
  const activeShelf = params.shelf?.trim() || null

  const supabase = await createClient()

  const { count: memberCount } = await supabase
    .from('household_members')
    .select('*', { count: 'exact', head: true })
    .eq('household_id', household.id)

  const { data: allBooks } = await supabase
    .from('books')
    .select('id, title, authors, cover_url, shelves')
    .eq('household_id', household.id)
    .order('created_at', { ascending: false })

  const books: BookRow[] = (allBooks as BookRow[] | null) ?? []
  const totalCount = books.length

  const shelfSet = new Set<string>()
  for (const b of books) {
    for (const s of b.shelves ?? []) shelfSet.add(s)
  }
  const allShelves = Array.from(shelfSet).sort((a, b) => a.localeCompare(b))

  return (
    <>
      <AppBar
        title={household.name}
        subtitle={`${memberCount ?? 0} ${memberCount === 1 ? 'member' : 'members'} · ${totalCount} ${totalCount === 1 ? 'book' : 'books'}`}
        actions={
          <Link
            href="/add"
            className="rounded-md bg-terracotta hover:bg-terracotta-strong text-white text-sm font-medium px-3.5 py-2 min-h-[44px] inline-flex items-center transition-colors"
          >
            Add
          </Link>
        }
      />

      <main className="max-w-5xl mx-auto px-4 py-6 pb-24">
        <LibraryView
          books={books}
          allShelves={allShelves}
          activeShelf={activeShelf}
        />
      </main>

      <BottomNav />
    </>
  )
}
