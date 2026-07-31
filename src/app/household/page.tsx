import { createClient } from '@/lib/supabase/server'
import { requireHousehold } from '@/lib/queries'
import { AppBar } from '@/components/AppBar'
import { BottomNav } from '@/components/BottomNav'
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
  const { data: { user } } = await supabase.auth.getUser()

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
    <>
      <AppBar
        title="Household"
        subtitle={household.name}
        actions={
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="rounded-md border border-parchment/30 text-parchment text-xs px-3 py-2 min-h-[36px] hover:bg-indigo-soft/30 transition-colors"
            >
              Sign out
            </button>
          </form>
        }
      />

      <main className="max-w-lg mx-auto px-4 py-6 pb-24 space-y-8">
        {sent ? (
          <Banner tone="success">
            Invite sent to {decodeURIComponent(sent)}. They&apos;ll get a magic link email.
          </Banner>
        ) : null}
        {renamed ? <Banner tone="success">Household renamed.</Banner> : null}
        {error ? (
          <Banner tone="danger">{decodeURIComponent(error)}</Banner>
        ) : null}

        <Section title={`Members (${members.length})`}>
          <ul className="space-y-2">
            {members.map((m) => (
              <li
                key={m.user_id}
                className="flex items-center gap-3 p-3 rounded-lg border border-line bg-white"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{m.email}</p>
                  <p className="text-xs text-ink-muted mt-0.5">
                    {m.role} · joined {new Date(m.joined_at).toLocaleDateString()}
                  </p>
                </div>
                {m.user_id === user?.id ? (
                  <span className="text-xs rounded-full border border-line px-2.5 py-0.5 text-ink-muted">
                    You
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Invite someone">
          <form action={inviteMember} className="flex gap-2">
            <input
              type="email"
              name="email"
              required
              placeholder="them@example.com"
              className="flex-1 rounded-md border border-line bg-white px-3 py-2.5 text-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-indigo focus:border-indigo"
            />
            <button
              type="submit"
              className="rounded-md bg-terracotta hover:bg-terracotta-strong text-white text-sm font-medium px-4 py-2.5 min-h-[44px]"
            >
              Send
            </button>
          </form>
          <p className="text-xs text-ink-muted mt-2">
            They&apos;ll get a magic link. When they sign in with it, they&apos;ll automatically join this library.
          </p>
        </Section>

        {invites.length > 0 ? (
          <Section title={`Pending invites (${invites.length})`}>
            <ul className="space-y-2">
              {invites.map((inv) => (
                <li
                  key={inv.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-line bg-white"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{inv.email}</p>
                    <p className="text-xs text-ink-muted mt-0.5">
                      sent {new Date(inv.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <form action={revokeInvite}>
                    <input type="hidden" name="invite_id" value={inv.id} />
                    <button
                      type="submit"
                      className="rounded-md border border-line bg-white text-xs px-3 py-2 min-h-[36px] hover:bg-parchment-soft"
                    >
                      Revoke
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        {isOwner ? (
          <Section title="Household details">
            <form action={renameHousehold} className="flex gap-2">
              <input
                type="text"
                name="name"
                required
                defaultValue={household.name}
                className="flex-1 rounded-md border border-line bg-white px-3 py-2.5 text-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-indigo focus:border-indigo"
              />
              <button
                type="submit"
                className="rounded-md border border-line bg-white text-sm font-medium px-4 py-2.5 min-h-[44px] hover:bg-parchment-soft"
              >
                Rename
              </button>
            </form>
          </Section>
        ) : null}

        <section className="pt-4 border-t border-line space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-danger">
            Danger zone
          </h2>
          <form action={leaveHousehold}>
            <button
              type="submit"
              className="rounded-md border border-danger/40 bg-white text-danger hover:bg-danger/10 text-sm font-medium px-5 py-2.5 min-h-[44px]"
            >
              Leave household
            </button>
          </form>
          <p className="text-xs text-ink-muted">
            You&apos;ll need to create or join a new household afterward.
          </p>
        </section>
      </main>

      <BottomNav />
    </>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
        {title}
      </h2>
      {children}
    </section>
  )
}

function Banner({
  tone,
  children,
}: {
  tone: 'success' | 'danger'
  children: React.ReactNode
}) {
  const cls =
    tone === 'success'
      ? 'border-success/30 bg-success/10 text-ink'
      : 'border-danger/30 bg-danger/10 text-danger'
  return (
    <div className={`rounded-md border p-4 text-sm ${cls}`}>{children}</div>
  )
}
