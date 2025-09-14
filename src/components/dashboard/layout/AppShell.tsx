'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProfile } from '@/lib/stores/useProfileStore';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const { profile, isLoading, hasAccess, error } = useProfile();

  console.log('🔍 AppShell State:', { 
    isLoading, 
    profile: profile ? 'exists' : 'null', 
    error,
    hasAccess: profile ? hasAccess(['early_access', 'admin']) : 'no profile'
  });

  // Handle redirect in useEffect to avoid render issues
  useEffect(() => {
    if (!isLoading && profile !== null) {
      console.log('🔍 AppShell Debug:', {
        profile,
        hasAccessResult: hasAccess(['early_access', 'admin']),
        role: profile?.role
      });
      
      if (!hasAccess(['early_access', 'admin'])) {
        console.log('❌ Access denied, redirecting...');
        router.push('/access-denied');
      } else {
        console.log('✅ Access granted!');
      }
    }
  }, [isLoading, profile, hasAccess, router]);

  // Still loading profile data or profile is null
  if (isLoading || profile === null) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // User doesn't have required roles - show loading while redirecting
  if (!hasAccess(['early_access', 'admin'])) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-6">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}