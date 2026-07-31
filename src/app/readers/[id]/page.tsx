import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireHousehold } from '@/lib/queries'
import { AppBar } from '@/components/AppBar'
import { BottomNav } from '@/components/BottomNav'

type LogStatus = 'want_to_read' | 'reading' | 'finished' | 'dnf'

type LogWithBook = {
  id: string
  status: LogStatus
  started_at: string | null
  finished_at: string | null
  rating: number | null
  notes: string | null
  book: {
    id: string
    title: string
    authors: string[]
    cover_url: string | null
  } | null
}

const STATUS_LABELS: Record<LogStatus, string> = {
  want_to_read: 'Wants to read',
  reading: 'Reading',
  finished: 'Finished',
  dnf: 'Did not finish',
}

export default async function ReaderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ status?: string; year?: string }>
}) {
  const household = await requireHousehold()
  const { id } = await params
  const search = await searchParams
  const activeStatus = (search.status as LogStatus | undefined) ?? null
  const activeYear = search.year ? parseInt(search.year, 10) : null

  const supabase = await createClient()

  const { data: reader } = await supabase
    .from('readers')
    .select('id, name, household_id')
    .eq('id', id)
    .maybeSingle()

  if (!reader || reader.household_id !== household.id) notFound()

  const { data: logRaw } = await supabase
    .from('reading_log')
    .select(
      'id, status, started_at, finished_at, rating, notes, book:books(id, title, authors, cover_url)'
    )
    .eq('reader_id', id)
    .order('finished_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  const log = (logRaw as unknown as LogWithBook[]) ?? []

  const counts = {
    finished: log.filter((l) => l.status === 'finished').length,
    reading: log.filter((l) => l.status === 'reading').length,
    want_to_read: log.filter((l) => l.status === 'want_to_read').length,
    dnf: log.filter((l) => l.status === 'dnf').length,
  }

  const years = Array.from(
    new Set(
      log
        .filter((l) => l.status === 'finished' && l.finished_at)
        .map((l) => new Date(l.finished_at!).getFullYear())
    )
  ).sort((a, b) => b - a)

  const filtered = log.filter((l) => {
    if (activeStatus && l.status !== activeStatus) return false
    if (activeYear) {
      if (l.status !== 'finished' || !l.finished_at) return false
      if (new Date(l.finished_at).getFullYear() !== activeYear) return false
    }
    return true
  })

  return (
    <>
      <AppBar title={reader.name} back={{ href: '/readers' }} />
      <main className="max-w-lg mx-auto px-4 py-6 pb-24 space-y-5">
        <div className="grid grid-cols-4 gap-2 text-center">
          <StatCard label="Finished" value={counts.finished} tone="strong" />
          <StatCard label="Reading" value={counts.reading} />
          <StatCard label="Wants" value={counts.want_to_read} />
          <StatCard label="DNF" value={counts.dnf} />
        </div>

        <nav
          className="flex gap-1.5 overflow-x-auto -mx-4 px-4 pb-1"
          aria-label="Filter"
        >
          <FilterChip
            href={`/readers/${id}`}
            active={!activeStatus && !activeYear}
            label="All"
          />
          <FilterChip
            href={`/readers/${id}?status=finished`}
            active={activeStatus === 'finished' && !activeYear}
            label="Finished"
          />
          <FilterChip
            href={`/readers/${id}?status=reading`}
            active={activeStatus === 'reading'}
            label="Reading"
          />
          <FilterChip
            href={`/readers/${id}?status=want_to_read`}
            active={activeStatus === 'want_to_read'}
            label="Wants to read"
          />
          {years.map((y) => (
            <FilterChip
              key={y}
              href={`/readers/${id}?status=finished&year=${y}`}
              active={activeYear === y}
              label={`${y}`}
            />
          ))}
        </nav>

        {filtered.length === 0 ? (
          <p className="text-sm text-ink-muted text-center py-8">
            No entries match.
          </p>
        ) : (
          <ul className="space-y-3">
            {filtered.map((entry) => {
              if (!entry.book) return null
              return (
                <li key={entry.id}>
                  <Link
                    href={`/book/${entry.book.id}`}
                    className="flex gap-3 rounded-lg border border-line bg-white p-3 hover:border-indigo hover:bg-parchment-soft transition-colors"
                  >
                    <div className="w-14 flex-shrink-0 aspect-[2/3] bg-parchment-strong rounded overflow-hidden">
                      {entry.book.cover_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={entry.book.cover_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight line-clamp-2">
                        {entry.book.title}
                      </p>
                      <p className="text-xs text-ink-muted mt-0.5 line-clamp-1">
                        {entry.book.authors.join(', ')}
                      </p>
                      <p className="text-xs text-ink-soft mt-1">
                        {STATUS_LABELS[entry.status]}
                        {entry.finished_at
                          ? ` · ${new Date(entry.finished_at).toLocaleDateString()}`
                          : entry.started_at
                            ? ` · started ${new Date(entry.started_at).toLocaleDateString()}`
                            : ''}
                        {entry.rating
                          ? ` · ${'★'.repeat(entry.rating)}${'☆'.repeat(5 - entry.rating)}`
                          : ''}
                      </p>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </main>
      <BottomNav />
    </>
  )
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone?: 'strong'
}) {
  const cls =
    tone === 'strong'
      ? 'bg-indigo text-parchment border-indigo'
      : 'bg-white text-ink border-line'
  return (
    <div className={`rounded-lg border p-2 ${cls}`}>
      <p className="text-lg font-semibold leading-none">{value}</p>
      <p className="text-[10px] mt-1 opacity-80 uppercase tracking-wide">
        {label}
      </p>
    </div>
  )
}

function FilterChip({
  href,
  active,
  label,
}: {
  href: string
  active: boolean
  label: string
}) {
  return (
    <Link
      href={href}
      className={`shrink-0 text-xs font-medium rounded-full px-3.5 py-1.5 border transition-colors min-h-[32px] inline-flex items-center ${
        active
          ? 'bg-indigo text-parchment border-indigo'
          : 'bg-white text-ink-soft border-line hover:border-indigo'
      }`}
    >
      {label}
    </Link>
  )
}
