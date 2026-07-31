import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type Household = {
  id: string
  name: string
  created_at: string
  created_by: string
}

/**
 * Returns the current user's household (first one they belong to),
 * or null if they don't have one yet. If the user has no membership,
 * we try to auto-accept any pending invites first (covers the case
 * where an existing user was invited after signup).
 */
export async function getCurrentHousehold(): Promise<Household | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: memberships } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .limit(1)

  if (!memberships || memberships.length === 0) {
    // Try to auto-accept any pending invites for this user's email
    await supabase.rpc('accept_pending_invites')

    const { data: memberships2 } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('user_id', user.id)
      .limit(1)

    if (!memberships2 || memberships2.length === 0) return null

    const { data: household } = await supabase
      .from('households')
      .select('*')
      .eq('id', memberships2[0].household_id)
      .maybeSingle()

    return household
  }

  const { data: household } = await supabase
    .from('households')
    .select('*')
    .eq('id', memberships[0].household_id)
    .maybeSingle()

  return household
}

/**
 * Returns the current household, redirecting to /onboarding if none.
 */
export async function requireHousehold(): Promise<Household> {
  const household = await getCurrentHousehold()
  if (!household) redirect('/onboarding')
  return household
}
