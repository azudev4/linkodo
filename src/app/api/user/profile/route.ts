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

export const PATCH = withAuth(async (request, { user, serviceSupabase }) => {
  try {
    const body = await request.json()
    const { full_name, avatar_url } = body

    // Validate input
    if (full_name !== undefined && typeof full_name !== 'string') {
      return NextResponse.json(
        { error: 'Invalid full_name format' },
        { status: 400 }
      )
    }

    if (avatar_url !== undefined && typeof avatar_url !== 'string') {
      return NextResponse.json(
        { error: 'Invalid avatar_url format' },
        { status: 400 }
      )
    }

    // Build update object with only provided fields
    const updateData: { [key: string]: unknown } = {
      updated_at: new Date().toISOString()
    }

    if (full_name !== undefined) {
      updateData.full_name = full_name
    }

    if (avatar_url !== undefined) {
      updateData.avatar_url = avatar_url
    }

    // Update user profile
    const { data: profile, error: updateError } = await serviceSupabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Profile update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      profile: profile,
      message: 'Profile updated successfully'
    })
  } catch (error) {
    console.error('Profile update API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})