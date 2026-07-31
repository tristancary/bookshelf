import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireHousehold } from '@/lib/queries'
import { AppBar } from '@/components/AppBar'
import { BottomNav } from '@/components/BottomNav'
import { createReader, renameReader, deleteReader } from './actions'

type ReaderRow = {
  id: string
  name: string
  finished_count: number
  reading_count: number
  want_count: number
}

export default async function ReadersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const household = await requireHousehold()
  const params = await searchParams
  const error = params.error

  const supabase = await createClient()

  const { data: readers } = await supabase
    .from('readers')
    .select('id, name')
    .eq('household_id', household.id)
    .order('name')

  const rows: ReaderRow[] = []
  for (const r of readers ?? []) {
    const [{ count: finished }, { count: reading }, { count: want }] =
      await Promise.all([
        supabase
          .from('reading_log')
          .select('*', { count: 'exact', head: true })
          .eq('reader_id', r.id)
          .eq('status', 'finished'),
        supabase
          .from('reading_log')
          .select('*', { count: 'exact', head: true })
          .eq('reader_id', r.id)
          .eq('status', 'reading'),
        supabase
          .from('reading_log')
          .select('*', { count: 'exact', head: true })
          .eq('reader_id', r.id)
          .eq('status', 'want_to_read'),
      ])
    rows.push({
      id: r.id,
      name: r.name,
      finished_count: finished ?? 0,
      reading_count: reading ?? 0,
      want_count: want ?? 0,
    })
  }

  return (
    <>
      <AppBar title="Readers" back={{ href: '/' }} />
      <main className="max-w-lg mx-auto px-4 py-6 pb-24 space-y-6">
        {error ? (
          <div className="rounded-md border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
            {decodeURIComponent(error)}
          </div>
        ) : null}

        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Add a reader
          </h2>
          <form action={createReader} className="flex gap-2">
            <input
              type="text"
              name="name"
              required
              placeholder="e.g. Quinton"
              className="flex-1 rounded-md border border-line bg-white px-3 py-2.5 text-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-indigo focus:border-indigo"
            />
            <button
              type="submit"
              className="rounded-md bg-terracotta hover:bg-terracotta-strong text-white text-sm font-medium px-4 py-2.5 min-h-[44px]"
            >
              Add
            </button>
          </form>
          <p className="text-xs text-ink-muted">
            Readers don&apos;t need email accounts. Add anyone whose reading you want to track.
          </p>
        </section>

        {rows.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Readers ({rows.length})
            </h2>
            <ul className="space-y-2">
              {rows.map((r) => (
                <li
                  key={r.id}
                  className="rounded-lg border border-line bg-white p-3"
                >
                  <Link
                    href={`/readers/${r.id}`}
                    className="block hover:bg-parchment-soft -m-3 p-3 rounded-lg transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-indigo">
                        {r.name}
                      </p>
                      <span className="text-xs text-ink-muted">View →</span>
                    </div>
                    <p className="text-xs text-ink-muted mt-1">
                      {r.finished_count} finished
                      {r.reading_count > 0
                        ? ` · ${r.reading_count} reading`
                        : ''}
                      {r.want_count > 0
                        ? ` · ${r.want_count} on wishlist`
                        : ''}
                    </p>
                  </Link>
                  <details className="mt-2 border-t border-line pt-2">
                    <summary className="text-xs text-ink-muted cursor-pointer hover:text-ink">
                      Rename or remove
                    </summary>
                    <div className="mt-2 space-y-2">
                      <form action={renameReader} className="flex gap-2">
                        <input type="hidden" name="id" value={r.id} />
                        <input
                          type="text"
                          name="name"
                          required
                          defaultValue={r.name}
                          className="flex-1 rounded-md border border-line bg-white px-3 py-2 text-sm min-h-[40px] focus:outline-none focus:ring-2 focus:ring-indigo"
                        />
                        <button
                          type="submit"
                          className="rounded-md border border-line bg-white text-xs px-3 py-2 min-h-[40px] hover:bg-parchment-soft"
                        >
                          Rename
                        </button>
                      </form>
                      <form action={deleteReader}>
                        <input type="hidden" name="id" value={r.id} />
                        <button
                          type="submit"
                          className="w-full rounded-md border border-danger/40 bg-white text-danger hover:bg-danger/10 text-xs px-3 py-2 min-h-[40px]"
                        >
                          Remove reader (also deletes their log entries)
                        </button>
                      </form>
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
      <BottomNav />
    </>
  )
}
