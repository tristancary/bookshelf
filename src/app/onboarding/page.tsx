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
    <main className="min-h-screen flex items-center justify-center p-6 bg-parchment">
      <div className="max-w-sm w-full space-y-8">
        <div className="text-center space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/icon-192.png"
            alt=""
            className="w-20 h-20 mx-auto rounded-2xl shadow-sm"
          />
          <div>
            <h1 className="text-2xl font-semibold text-indigo tracking-tight">
              Name your library
            </h1>
            <p className="text-sm text-ink-muted mt-1">
              You can change this later.
            </p>
          </div>
        </div>

        <form action={createHousehold} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-ink-soft">
              Library name
            </span>
            <input
              type="text"
              name="name"
              required
              defaultValue="Our Library"
              className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-indigo focus:border-indigo"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-md bg-terracotta hover:bg-terracotta-strong text-white text-sm font-medium py-3 min-h-[48px] transition-colors"
          >
            Create library
          </button>
          {error ? (
            <p className="text-sm text-danger text-center">
              {decodeURIComponent(error)}
            </p>
          ) : null}
        </form>

        <p className="text-xs text-ink-muted text-center">
          You&apos;ll be able to invite family after your library is created.
        </p>
      </div>
    </main>
  )
}
