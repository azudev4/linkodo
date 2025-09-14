'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShieldX, Home, LogIn, Mail, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useProfile } from '@/lib/stores/useProfileStore'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function AccessDeniedForm() {
  const { refresh, hasAccess } = useProfile()
  const router = useRouter()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refresh()
      // Check if access granted after refresh
      if (hasAccess(['early_access', 'admin'])) {
        router.push('/dashboard')
        return
      }
    } catch (error) {
      console.error('Failed to refresh profile:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="text-center pb-0 pt-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center mb-4">
            <ShieldX className="w-8 h-8 text-red-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
            Access Restricted
          </CardTitle>
          <p className="text-gray-600 text-sm leading-relaxed mb-2">
            This area is currently available to early access users only.
            Get early access by reaching out to our team.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4 pb-8 pt-4">

          <div className="space-y-3">
            <Button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Checking Access...' : 'Check Access Again'}
            </Button>

            <Button 
              asChild 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <a 
                href="mailto:support@linkodo.com?subject=Early Access Request"
                className="flex items-center justify-center gap-2"
              >
                <Mail className="w-4 h-4" />
                Request Early Access
              </a>
            </Button>
            
            <Button asChild variant="outline" className="w-full">
              <Link href="/login" className="flex items-center justify-center gap-2">
                <LogIn className="w-4 h-4" />
                Try Different Account
              </Link>
            </Button>
            
            <Button asChild variant="ghost" className="w-full text-gray-600">
              <Link href="/" className="flex items-center justify-center gap-2">
                <Home className="w-4 h-4" />
                Back to Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}