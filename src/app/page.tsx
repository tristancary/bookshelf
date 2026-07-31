import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireHousehold } from '@/lib/queries'
import { AppBar } from '@/components/AppBar'
import { BottomNav } from '@/components/BottomNav'

export default async function Home() {
  const household = await requireHousehold()
  const supabase = await createClient()

  const { count: memberCount } = await supabase
    .from('household_members')
    .select('*', { count: 'exact', head: true })
    .eq('household_id', household.id)

  const { data: books } = await supabase
    .from('books')
    .select('id, title, authors, cover_url')
    .eq('household_id', household.id)
    .order('created_at', { ascending: false })

  const bookCount = books?.length ?? 0

  return (
    <>
      <AppBar
        title={household.name}
        subtitle={`${memberCount ?? 0} ${memberCount === 1 ? 'member' : 'members'} · ${bookCount} ${bookCount === 1 ? 'book' : 'books'}`}
        actions={
          <Link
            href="/add"
            className="rounded-md bg-terracotta hover:bg-terracotta-strong text-white text-sm font-medium px-3.5 py-2 min-h-[44px] inline-flex items-center transition-colors"
          >
            Add
          </Link>
        }
      />

      <main className="max-w-5xl mx-auto px-4 py-6 pb-24 space-y-6">
        {bookCount === 0 ? (
          <section className="rounded-xl border border-dashed border-line bg-parchment-soft p-10 text-center space-y-4">
            <p className="text-ink-soft">Your library is empty.</p>
            <Link
              href="/add"
              className="inline-block rounded-md bg-terracotta hover:bg-terracotta-strong text-white text-sm font-medium px-5 py-2.5 min-h-[44px]"
            >
              Add your first book
            </Link>
          </section>
        ) : (
          <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-6">
            {books?.map((book) => (
              <Link
                key={book.id}
                href={`/book/${book.id}`}
                className="group block"
              >
                <div className="aspect-[2/3] bg-parchment-strong rounded-md overflow-hidden shadow-sm transition-all group-hover:shadow-md group-hover:-translate-y-0.5">
                  {book.cover_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={book.cover_url}
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-ink-muted p-2 text-center">
                      No cover
                    </div>
                  )}
                </div>
                <div className="mt-2">
                  <p className="text-sm font-medium leading-tight line-clamp-2 group-hover:text-indigo transition-colors">
                    {book.title}
                  </p>
                  <p className="text-xs text-ink-muted line-clamp-1 mt-0.5">
                    {book.authors?.join(', ') ?? ''}
                  </p>
                </div>
              </Link>
            ))}
          </section>
        )}
      </main>

      <BottomNav />
    </>
  )
}
