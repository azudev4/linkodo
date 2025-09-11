import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Mail } from 'lucide-react'
import Link from 'next/link'

export default function Page() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <Card className="border shadow-xl">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-semibold text-gray-900">
              Welcome to Unveil SEO!
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Your account has been created successfully
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="flex items-center justify-center gap-2 text-blue-600 bg-blue-50 p-4 rounded-lg">
              <Mail className="w-5 h-5" />
              <p className="text-sm font-medium">
                Check your email to verify your account
              </p>
            </div>
            
            <div className="text-sm text-gray-500 leading-relaxed">
              We&apos;ve sent a verification email to your inbox. Please click the link in the email to activate your account and start using Unveil SEO.
            </div>

            <div className="pt-4">
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  Back to Sign In
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
