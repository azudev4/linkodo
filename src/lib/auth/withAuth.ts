import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

export interface AuthenticatedUser {
  id: string
  email?: string
  [key: string]: any
}

export interface AuthContext {
  user: AuthenticatedUser
  supabase: ReturnType<typeof createClient>
  serviceSupabase: ReturnType<typeof createServiceRoleClient>
}

type AuthenticatedHandler = (
  request: NextRequest,
  context: AuthContext
) => Promise<NextResponse> | NextResponse

export function withAuth(handler: AuthenticatedHandler) {
  return async (request: NextRequest) => {
    try {
      // Use SSR client to get authenticated user (same as middleware)
      const supabase = await createClient()
      const { data } = await supabase.auth.getClaims()
      const user = data?.claims
      
      if (!user) {
        return NextResponse.json(
          { error: 'Not authenticated' },
          { status: 401 }
        )
      }

      const serviceSupabase = createServiceRoleClient()

      const context: AuthContext = {
        user: {
          id: user.sub,
          email: user.email,
          ...user
        },
        supabase: await createClient(),
        serviceSupabase
      }

      return await handler(request, context)
    } catch (error) {
      console.error('Auth middleware error:', error)
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      )
    }
  }
}