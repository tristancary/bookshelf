import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireHousehold } from '@/lib/queries'

export default async function Home() {
  const household = await requireHousehold()
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

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
    <main className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <header className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {household.name}
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              {memberCount ?? 0} {memberCount === 1 ? 'member' : 'members'}
              {' · '}
              {bookCount} {bookCount === 1 ? 'book' : 'books'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/add"
              className="rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 transition-colors"
            >
              Add book
            </Link>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-xs hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </header>

        {bookCount === 0 ? (
          <section className="rounded-lg border border-dashed border-neutral-300 dark:border-neutral-800 p-10 text-center space-y-3">
            <p className="text-neutral-500 dark:text-neutral-400">
              Your library is empty.
            </p>
            <Link
              href="/add"
              className="inline-block rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2"
            >
              Add your first book
            </Link>
          </section>
        ) : (
          <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {books?.map((book) => (
              <Link
                key={book.id}
                href={`/book/${book.id}`}
                className="space-y-2 group"
              >
                <div className="aspect-[2/3] bg-neutral-100 dark:bg-neutral-900 rounded-md overflow-hidden transition-transform group-hover:scale-[1.02] group-hover:shadow-md">
                  {book.cover_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={book.cover_url}
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400 p-2 text-center">
                      No cover
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium line-clamp-2 leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-500 transition-colors">
                    {book.title}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1 mt-0.5">
                    {book.authors?.join(', ') ?? ''}
                  </p>
                </div>
              </Link>
            ))}
          </section>
        )}

        <p className="text-xs text-neutral-500 dark:text-neutral-400 pt-4 border-t border-neutral-200 dark:border-neutral-800">
          Signed in as {user?.email}
        </p>
      </div>
    </main>
  )
}
