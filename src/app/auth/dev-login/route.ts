import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 })
  }

  const formData = await request.formData()
  const email = String(formData.get('email') ?? '').trim()
  const { origin } = new URL(request.url)

  if (!email) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('Email required')}`,
      { status: 303 }
    )
  }

  // Generate a magic link, but extract the token instead of following the link.
  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })

  if (error || !data?.properties?.hashed_token) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(
        error?.message ?? 'Dev login failed'
      )}`,
      { status: 303 }
    )
  }

  // Verify the token using the SSR server client so cookies get set on the response.
  const supabase = await createClient()
  const { error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: data.properties.hashed_token,
    type: 'magiclink',
  })

  if (verifyError) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(verifyError.message)}`,
      { status: 303 }
    )
  }

  return NextResponse.redirect(`${origin}/`, { status: 303 })
}
