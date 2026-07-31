import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type Household = {
  id: string
  name: string
  created_at: string
  created_by: string
}

export async function getCurrentHousehold(): Promise<Household | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: memberships } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .limit(1)

  if (!memberships || memberships.length === 0) {
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

export async function requireHousehold(): Promise<Household> {
  const household = await getCurrentHousehold()
  if (!household) redirect('/onboarding')
  return household
}

export async function getHouseholdShelves(householdId: string): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('books')
    .select('shelves')
    .eq('household_id', householdId)

  if (!data) return []
  const all = data.flatMap((b) => (b.shelves as string[] | null) ?? [])
  return Array.from(new Set(all)).sort((a, b) => a.localeCompare(b))
}
