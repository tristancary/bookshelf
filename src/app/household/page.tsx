import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireHousehold } from '@/lib/queries'
import {
  inviteMember,
  revokeInvite,
  renameHousehold,
  leaveHousehold,
} from './actions'

type Member = {
  user_id: string
  email: string
  role: string
  joined_at: string
}

type Invite = {
  id: string
  email: string
  created_at: string
}

export default async function HouseholdPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string; renamed?: string }>
}) {
  const household = await requireHousehold()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const params = await searchParams
  const error = params.error
  const sent = params.sent
  const renamed = params.renamed === '1'

  const { data: membersData } = await supabase.rpc('get_household_members', {
    hid: household.id,
  })
  const members: Member[] = (membersData as Member[] | null) ?? []

  const { data: invitesData } = await supabase
    .from('household_invites')
    .select('id, email, created_at')
    .eq('household_id', household.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  const invites: Invite[] = (invitesData as Invite[] | null) ?? []

  const currentMember = members.find((m) => m.user_id === user?.id)
  const isOwner = currentMember?.role === 'owner'

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <div className="max-w-lg mx-auto p-6 space-y-8">
        <header>
          <Link
            href="/"
            className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
          >
            ← Back to library
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">
            Household
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            {household.name}
          </p>
        </header>

        {sent ? (
          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm">
            Invite sent to {decodeURIComponent(sent)}. They&apos;ll get a magic link email.
          </div>
        ) : null}

        {renamed ? (
          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm">
            Household renamed.
          </div>
        ) : null}

        {error ? (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-400">
            {decodeURIComponent(error)}
          </div>
        ) : null}

        <section className="space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Members ({members.length})
          </h2>
          <ul className="space-y-2">
            {members.map((m) => (
              <li
                key={m.user_id}
                className="flex items-center gap-3 p-3 rounded-md border border-neutral-200 dark:border-neutral-800"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{m.email}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {m.role} · joined{' '}
                    {new Date(m.joined_at).toLocaleDateString()}
                  </p>
                </div>
                {m.user_id === user?.id ? (
                  <span className="text-xs rounded-full border border-neutral-300 dark:border-neutral-700 px-2 py-0.5 text-neutral-500 dark:text-neutral-400">
                    You
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Invite someone
          </h2>
          <form action={inviteMember} className="flex gap-2">
            <input
              type="email"
              name="email"
              required
              placeholder="them@example.com"
              className="flex-1 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              className="rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2"
            >
              Send invite
            </button>
          </form>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            They&apos;ll get a magic link. When they sign in with it, they&apos;ll automatically join this library.
          </p>
        </section>

        {invites.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Pending invites ({invites.length})
            </h2>
            <ul className="space-y-2">
              {invites.map((inv) => (
                <li
                  key={inv.id}
                  className="flex items-center gap-3 p-3 rounded-md border border-neutral-200 dark:border-neutral-800"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{inv.email}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      sent {new Date(inv.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <form action={revokeInvite}>
                    <input type="hidden" name="invite_id" value={inv.id} />
                    <button
                      type="submit"
                      className="rounded-md border border-neutral-300 dark:border-neutral-700 text-xs px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-900"
                    >
                      Revoke
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {isOwner ? (
          <section className="space-y-3">
            <h2 className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Household details
            </h2>
            <form action={renameHousehold} className="flex gap-2">
              <input
                type="text"
                name="name"
                required
                defaultValue={household.name}
                className="flex-1 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                className="rounded-md border border-neutral-300 dark:border-neutral-700 text-sm px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-900"
              >
                Rename
              </button>
            </form>
          </section>
        ) : null}

        <section className="space-y-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
          <h2 className="text-xs font-medium uppercase tracking-wide text-red-500">
            Danger zone
          </h2>
          <form action={leaveHousehold}>
            <button
              type="submit"
              className="rounded-md border border-red-500/50 text-red-600 dark:text-red-500 hover:bg-red-500/10 text-sm font-medium px-4 py-2"
            >
              Leave household
            </button>
          </form>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            You&apos;ll need to create or join a new household afterward.
          </p>
        </section>
      </div>
    </main>
  )
}
