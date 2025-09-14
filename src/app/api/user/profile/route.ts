import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/withAuth'

export const GET = withAuth(async (request, { user, serviceSupabase }) => {
  try {
    // Get user profile from profiles table
    const { data: profile, error: profileError } = await serviceSupabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      profile: profile
    })
  } catch (error) {
    console.error('Profile API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})