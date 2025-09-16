'use client';

import { useProfile } from '@/lib/stores/useProfileStore';
import { Button } from '@/components/ui/button';
import { Bell, Settings, LogOut, User } from 'lucide-react';
import Link from 'next/link';

export function AdminHeader() {
  const { profile } = useProfile();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Breadcrumbs or page title could go here */}
        <div className="flex items-center space-x-4">
          <div className="hidden md:block">
            <nav className="flex items-center space-x-2 text-sm text-gray-500">
              <Link href="/admin" className="hover:text-gray-700 transition-colors">
                Admin
              </Link>
              <span>/</span>
              <span className="text-gray-900 font-medium">Dashboard</span>
            </nav>
          </div>
        </div>

        {/* Right side - User actions */}
        <div className="flex items-center space-x-3">
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="p-2">
            <Bell className="w-4 h-4 text-gray-600" />
          </Button>

          {/* Settings */}
          <Button variant="ghost" size="sm" className="p-2">
            <Settings className="w-4 h-4 text-gray-600" />
          </Button>

          {/* User Menu */}
          <div className="flex items-center space-x-3 pl-3 border-l border-gray-200">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-900">
                {profile?.email || 'Admin User'}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {profile?.role || 'Administrator'}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              {/* Avatar */}
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
                <User className="w-4 h-4 text-white" />
              </div>

              {/* Logout */}
              <Button variant="ghost" size="sm" className="p-2 text-gray-600 hover:text-red-600">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}