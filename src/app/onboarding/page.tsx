import { redirect } from 'next/navigation'
import { getCurrentHousehold } from '@/lib/queries'
import { createHousehold } from './actions'

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const household = await getCurrentHousehold()
  if (household) redirect('/')

  const params = await searchParams
  const error = params.error

  return (
    <main className="min-h-screen flex items-center justify-center p-8 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <div className="max-w-sm w-full space-y-6">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight">Bookshelf</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Name your library
          </p>
        </header>

        <form action={createHousehold} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium">Library name</span>
            <input
              type="text"
              name="name"
              required
              defaultValue="Our Library"
              className="mt-1 w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <span className="mt-1 block text-xs text-neutral-500 dark:text-neutral-400">
              You can change this later.
            </span>
          </label>
          <button
            type="submit"
            className="w-full rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium py-2 transition-colors"
          >
            Create library
          </button>
          {error ? (
            <p className="text-sm text-red-500">{decodeURIComponent(error)}</p>
          ) : null}
        </form>

        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          You&apos;ll be able to invite others (like your partner) once your library is created.
        </p>
      </div>
    </main>
  )
}
