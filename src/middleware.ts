import { type NextRequest } from 'next/server'
import { updateUserSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  console.log('ROOT MIDDLEWARE CALLED:', request.nextUrl.pathname)
  return await updateUserSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}