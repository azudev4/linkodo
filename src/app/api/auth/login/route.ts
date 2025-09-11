import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Use service role for authentication
    const serviceSupabase = createServiceRoleClient()
    
    const { data, error } = await serviceSupabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Login error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    if (!data.session) {
      return NextResponse.json(
        { error: 'No session created' },
        { status: 400 }
      )
    }

    // Get user profile
    const { data: profile, error: profileError } = await serviceSupabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
    }

    // Now use SSR client to properly set session cookies
    const supabase = await createClient()
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token
    })

    if (sessionError) {
      console.error('Session setting error:', sessionError)
      return NextResponse.json(
        { error: 'Failed to set session' },
        { status: 400 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      user: data.user,
      profile: profile 
    })
  } catch (error) {
    console.error('Login API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}