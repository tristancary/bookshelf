'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentHousehold } from '@/lib/queries'

export async function createReader(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim()
  if (!name) redirect('/readers?error=' + encodeURIComponent('Name required'))

  const household = await getCurrentHousehold()
  if (!household) redirect('/onboarding')

  const supabase = await createClient()
  const { error } = await supabase
    .from('readers')
    .insert({ household_id: household.id, name })

  if (error) {
    if (error.code === '23505') {
      redirect(
        '/readers?error=' +
          encodeURIComponent('A reader with that name already exists')
      )
    }
    redirect('/readers?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/readers')
  redirect('/readers')
}

export async function renameReader(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  const name = String(formData.get('name') ?? '').trim()
  if (!id || !name) redirect('/readers')

  const supabase = await createClient()
  const { error } = await supabase.from('readers').update({ name }).eq('id', id)
  if (error) {
    redirect('/readers?error=' + encodeURIComponent(error.message))
  }
  revalidatePath('/readers')
  revalidatePath(`/readers/${id}`)
  redirect('/readers')
}

export async function deleteReader(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  if (!id) redirect('/readers')

  const supabase = await createClient()
  const { error } = await supabase.from('readers').delete().eq('id', id)
  if (error) {
    redirect('/readers?error=' + encodeURIComponent(error.message))
  }
  revalidatePath('/readers')
  revalidatePath('/')
  redirect('/readers')
}
