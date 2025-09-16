'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { BarChart3, Users, Database, X, Menu } from 'lucide-react';

const navigation = [
  {
    name: 'Overview',
    href: '/admin',
    icon: BarChart3,
    description: 'System overview and statistics'
  },
  {
    name: 'Users',
    href: '/admin/users',
    icon: Users,
    description: 'Manage platform users and permissions'
  },
  {
    name: 'Crawls',
    href: '/admin/crawls',
    icon: Database,
    description: 'Monitor website crawling operations'
  },
];

interface AdminSidebarProps {
  className?: string;
}

export function AdminSidebar({ className }: AdminSidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 left-4 z-40 p-2 bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        aria-label="Toggle sidebar"
      >
        <Menu className="w-5 h-5 text-gray-600" />
      </button>

      {/* Mobile backdrop */}
      <div
        className={cn(
          "md:hidden fixed inset-0 bg-black transition-opacity duration-300 ease-in-out z-30",
          isOpen ? "opacity-40 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <div
        className={cn(
          // Base styles
          "bg-white border-r border-gray-200 flex flex-col",
          // Desktop styles
          "md:w-64 md:min-h-screen md:sticky md:top-0",
          // Mobile styles
          "md:translate-x-0 fixed inset-y-0 left-0 z-40 w-72 transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
          className
        )}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Admin</h1>
                <p className="text-xs text-gray-500">Unveil SEO</p>
              </div>
            </div>

            {/* Close button for mobile */}
            <button
              onClick={closeSidebar}
              className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={closeSidebar}
                className={cn(
                  'flex items-center space-x-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative',
                  isActive
                    ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 shadow-sm border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
                )}
                title={item.description}
              >
                {/* Background animation */}
                <div className={cn(
                  'absolute -inset-x-1 inset-y-0 rounded-xl bg-gradient-to-r from-blue-500 via-blue-600 to-blue-600 opacity-0 transition-opacity duration-300',
                  !isActive && 'group-hover:opacity-5'
                )} />

                {/* Icon */}
                <div className="relative z-10">
                  <Icon className={cn(
                    'w-5 h-5 transition-transform duration-200',
                    'group-hover:scale-110',
                    isActive ? 'text-blue-600' : ''
                  )} />
                </div>

                {/* Label */}
                <span className="relative z-10 transition-all duration-200 group-hover:translate-x-0.5">
                  {item.name}
                </span>

                {/* Active indicator */}
                {isActive && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer with admin info */}
        <div className="p-4 border-t border-gray-100">
          <div className="text-xs text-gray-500 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-medium">Admin Panel</span>
              <span className="text-gray-400">v1.0.0</span>
            </div>
            <div className="text-gray-400">
              Platform management
            </div>
          </div>
        </div>
      </div>
    </>
  );
}