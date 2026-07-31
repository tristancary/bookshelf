'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getCurrentHousehold } from '@/lib/queries'

export async function inviteMember(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()

  if (!email) {
    redirect('/household?error=' + encodeURIComponent('Email required'))
  }

  const household = await getCurrentHousehold()
  if (!household) redirect('/onboarding')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  if (email === user.email?.toLowerCase()) {
    redirect(
      '/household?error=' + encodeURIComponent("You can't invite yourself")
    )
  }

  const { error: insertError } = await supabase
    .from('household_invites')
    .insert({
      household_id: household.id,
      email,
      invited_by: user.id,
    })

  if (insertError) {
    if (insertError.code === '23505') {
      redirect(
        '/household?error=' +
          encodeURIComponent('That email already has a pending invite')
      )
    }
    redirect('/household?error=' + encodeURIComponent(insertError.message))
  }

  // Trigger the magic link email. Creates the user record if new.
  const hdrs = await headers()
  const origin = hdrs.get('origin') ?? 'http://localhost:3000'

  const { error: otpError } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })

  if (otpError) {
    redirect(
      '/household?error=' +
        encodeURIComponent(`Invite created but email failed: ${otpError.message}`)
    )
  }

  revalidatePath('/household')
  redirect('/household?sent=' + encodeURIComponent(email))
}

export async function revokeInvite(formData: FormData) {
  const inviteId = String(formData.get('invite_id') ?? '')
  if (!inviteId) redirect('/household')

  const supabase = await createClient()
  const { error } = await supabase
    .from('household_invites')
    .update({ status: 'revoked' })
    .eq('id', inviteId)

  if (error) {
    redirect('/household?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/household')
  redirect('/household')
}

export async function renameHousehold(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim()
  if (!name) {
    redirect('/household?error=' + encodeURIComponent('Name required'))
  }

  const household = await getCurrentHousehold()
  if (!household) redirect('/onboarding')

  const supabase = await createClient()
  const { error } = await supabase
    .from('households')
    .update({ name })
    .eq('id', household.id)

  if (error) {
    redirect('/household?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/')
  revalidatePath('/household')
  redirect('/household?renamed=1')
}

export async function leaveHousehold() {
  const household = await getCurrentHousehold()
  if (!household) redirect('/')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('household_members')
    .delete()
    .eq('household_id', household.id)
    .eq('user_id', user.id)

  if (error) {
    redirect('/household?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/')
  redirect('/onboarding')
}
