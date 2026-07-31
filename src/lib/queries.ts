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
 * or null if they don't have one yet.
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

  if (!memberships || memberships.length === 0) return null

  const { data: household } = await supabase
    .from('households')
    .select('*')
    .eq('id', memberships[0].household_id)
    .maybeSingle()

  return household
}

/**
 * Returns the current household, redirecting to /onboarding if none.
 * Use in pages that require a household to exist.
 */
export async function requireHousehold(): Promise<Household> {
  const household = await getCurrentHousehold()
  if (!household) redirect('/onboarding')
  return household
}
