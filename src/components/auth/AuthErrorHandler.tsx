'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthErrorHandler() {
  const router = useRouter()

  useEffect(() => {
    // Check for auth errors in URL hash
    const hash = window.location.hash
    if (hash.includes('error=')) {
      const urlParams = new URLSearchParams(hash.substring(1)) // Remove the # symbol
      const error = urlParams.get('error')
      const errorCode = urlParams.get('error_code')
      const errorDescription = urlParams.get('error_description')
      
      console.log('Auth error detected in hash:', { error, errorCode, errorDescription })
      
      // Clear the hash from URL
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
      
      // Redirect to error page with proper error message
      const errorMessage = errorDescription || error || 'Authentication failed'
      router.push(`/error?error=${encodeURIComponent(errorMessage)}`)
    }
    
    // Also check for success parameters (code)
    if (hash.includes('access_token=') || hash.includes('code=')) {
      console.log('Auth success detected in hash, redirecting to callback')
      // For successful auth, redirect to callback to handle properly
      router.push('/api/auth/callback' + hash.replace('#', '?'))
    }
  }, [router])

  return null // This component doesn't render anything
}