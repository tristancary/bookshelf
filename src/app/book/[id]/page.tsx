import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireHousehold } from '@/lib/queries'
import BookDetail, { type Book } from './BookDetail'

export default async function BookPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireHousehold()
  const { id } = await params
  const supabase = await createClient()

  const { data: book } = await supabase
    .from('books')
    .select(
      'id, isbn, title, authors, categories, cover_url, published_year, publisher, page_count, description, notes, created_at'
    )
    .eq('id', id)
    .maybeSingle()

  if (!book) notFound()

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <div className="max-w-lg mx-auto p-6 space-y-6">
        <header>
          <Link
            href="/"
            className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
          >
            ← Back to library
          </Link>
        </header>
        <BookDetail book={book as Book} />
      </div>
    </main>
  )
}
