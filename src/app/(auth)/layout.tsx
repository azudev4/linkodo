import { AuthNavbar } from '@/components/auth/AuthNavbar'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <AuthNavbar />
      {children}
    </div>
  )
}