'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function createHousehold(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim() || 'Our Library'

  const supabase = await createClient()

  const { error } = await supabase.rpc('create_household', {
    household_name: name,
  })

  if (error) {
    redirect('/onboarding?error=' + encodeURIComponent(error.message))
  }

  redirect('/')
}
