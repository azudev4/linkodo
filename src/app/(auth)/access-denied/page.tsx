import type { Metadata } from 'next'
import { AccessDeniedForm } from '@/components/auth/AccessDeniedForm'

export const metadata: Metadata = {
  title: 'Access Denied',
  description: 'You do not have permission to access this page',
  robots: {
    index: false,
    follow: false,
  },
}

export default function AccessDeniedPage() {
  return <AccessDeniedForm />
}