import { login } from './actions'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>
}) {
  const params = await searchParams
  const sent = params.sent === '1'
  const error = params.error
  const isDev = process.env.NODE_ENV === 'development'

  return (
    <main className="min-h-screen flex items-center justify-center p-8 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <div className="max-w-sm w-full space-y-6">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight">Bookshelf</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Sign in with your email
          </p>
        </header>

        {sent ? (
          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm">
            Check your email for a sign-in link. It may take a minute.
          </div>
        ) : (
          <form action={login} className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium">Email</span>
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                className="mt-1 w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </label>
            <button
              type="submit"
              className="w-full rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium py-2 transition-colors"
            >
              Send magic link
            </button>
            {error ? (
              <p className="text-sm text-red-500">{decodeURIComponent(error)}</p>
            ) : null}
          </form>
        )}

        {isDev ? (
          <form
            action="/auth/dev-login"
            method="post"
            className="pt-4 border-t border-dashed border-neutral-300 dark:border-neutral-800 space-y-2"
          >
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
              Dev login (localhost only, no email)
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                name="email"
                required
                defaultValue="tristancary@gmail.com"
                className="flex-1 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="submit"
                className="rounded-md border border-amber-500/50 text-amber-600 dark:text-amber-500 hover:bg-amber-500/10 text-sm font-medium px-3 py-2"
              >
                Dev sign in
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </main>
  )
}
