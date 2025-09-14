import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)

  console.log('Confirm route called with URL:', request.url)
  console.log('All search params:', Object.fromEntries(searchParams.entries()))

  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')
  const next = '/dashboard'

  console.log('Extracted values:', {
    code: code ? 'present' : 'missing',
    error,
    error_description,
    next
  })

  // Check if Supabase returned an error
  if (error) {
    console.log('Supabase auth error:', error, error_description)
    return NextResponse.redirect(`${origin}/error?error=${error_description || error}`)
  }

  if (code) {
    console.log('Attempting to exchange code for session...')
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    console.log('Exchange result:', {
      success: !error,
      error: error?.message,
      user: data?.user ? 'present' : 'missing'
    })

    if (!error && data?.user) {
      console.log('Session created successfully')

      // Update profile to mark as email verified
      await supabase
        .from('profiles')
        .update({ email_verified: true })
        .eq('id', data.user.id)

      return NextResponse.redirect(`${origin}${next}`)
    } else {
      console.log('Exchange failed:', error?.message)
      return NextResponse.redirect(`${origin}/error?error=${error?.message || 'Confirmation failed'}`)
    }
  }

  // Return the user to an error page with instructions
  console.log('No code parameter found')
  return NextResponse.redirect(`${origin}/error?error=No confirmation code found`)
}