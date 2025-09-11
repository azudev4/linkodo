import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShieldX } from 'lucide-react'
import Link from 'next/link'

export default function AccessDeniedPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <Card className="border shadow-xl">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <ShieldX className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-semibold text-gray-900">
              Access Denied
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              You don't have permission to access this page
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="text-sm text-gray-500 leading-relaxed">
              Dashboard access is currently limited to early access users and administrators. 
              Please contact support if you believe this is an error.
            </div>

            <div className="pt-4 space-y-3">
              <Link href="/">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Back to Home
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  Sign In with Different Account
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}