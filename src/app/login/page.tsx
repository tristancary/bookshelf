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
              Cary&apos;s Bookshelf
            </h1>
            <p className="text-sm text-ink-muted mt-1">
              Sign in with your email
            </p>
          </div>
        </div>

        {sent ? (
          <div className="rounded-md border border-success/30 bg-success/10 p-4 text-sm text-center">
            Check your email for a sign-in link.
          </div>
        ) : (
          <form action={login} className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-ink-soft">Email</span>
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-indigo focus:border-indigo"
              />
            </label>
            <button
              type="submit"
              className="w-full rounded-md bg-terracotta hover:bg-terracotta-strong text-white text-sm font-medium py-3 min-h-[48px] transition-colors"
            >
              Send magic link
            </button>
            {error ? (
              <p className="text-sm text-danger text-center">
                {decodeURIComponent(error)}
              </p>
            ) : null}
          </form>
        )}

        {isDev ? (
          <form
            action="/auth/dev-login"
            method="post"
            className="pt-4 border-t border-dashed border-line space-y-2"
          >
            <p className="text-xs text-ink-muted font-medium">
              Dev login (localhost only, no email)
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                name="email"
                required
                defaultValue="tristancary@gmail.com"
                className="flex-1 rounded-md border border-line bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta"
              />
              <button
                type="submit"
                className="rounded-md border border-terracotta/50 text-terracotta hover:bg-terracotta/10 text-sm font-medium px-3 py-2.5"
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
