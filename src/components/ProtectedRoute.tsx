'use client'

import { useProfile } from '@/lib/stores/useProfileStore'

interface ProtectedRouteProps {
  requiredRoles: string[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ProtectedRoute({ requiredRoles, children, fallback }: ProtectedRouteProps) {
  const { hasAccess, isLoading, profile } = useProfile()
  
  // Still loading profile data
  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }
  
  // User doesn't have required roles (includes case where profile doesn't exist or role is 'default')
  if (!profile || !hasAccess(requiredRoles)) {
    if (fallback) return <>{fallback}</>
    
    return (
      <div className="flex min-h-screen w-full items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="border shadow-xl rounded-lg p-8">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">🚫</span>
              </div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                Oops! Early Access Required
              </h1>
              <p className="text-gray-600 mb-6">
                Looks like nobody granted you early access yet. Don&apos;t worry, we&apos;ll get you sorted!
              </p>
              
              <div className="space-y-3">
                <button 
                  onClick={() => window.open('mailto:support@unveilseo.com?subject=Early Access Request', '_blank')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Request Early Access
                </button>
                
                <button 
                  onClick={() => window.location.href = '/login'}
                  className="w-full border border-gray-300 hover:border-gray-400 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Sign In with Different Account
                </button>
                
                <button 
                  onClick={() => window.location.href = '/'}
                  className="w-full text-gray-500 hover:text-gray-700 font-medium py-2 px-4 transition-colors"
                >
                  Back to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  // User has access, render children
  return <>{children}</>
}