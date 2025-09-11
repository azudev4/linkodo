import { createServiceRoleClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { newPassword, accessToken } = await request.json()
    
    if (!newPassword) {
      return NextResponse.json(
        { error: 'New password is required' },
        { status: 400 }
      )
    }

    const supabase = createServiceRoleClient()
    
    // If access token provided (from reset email), use it
    if (accessToken) {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })
      
      if (error) {
        console.error('Password update error:', error)
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }
    } else {
      // Otherwise, user must be authenticated
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return NextResponse.json(
          { error: 'User not authenticated' },
          { status: 401 }
        )
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        console.error('Password update error:', error)
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Password updated successfully' 
    })
  } catch (error) {
    console.error('Update password API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}