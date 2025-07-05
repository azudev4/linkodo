// src/components/layout/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Search, Database } from 'lucide-react';

const navigation = [
  {
    name: 'Analyze',
    href: '/',
    icon: Search,
    description: 'Analyze content for internal link suggestions'
  },
  {
    name: 'Indexing',
    href: '/indexing',
    icon: Database,
    description: 'Manage data sync and AI embeddings'
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Search className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900">LinkSuggest</h1>
        </div>
      </div>
      
      <nav className="px-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group',
                isActive
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              )}
              title={item.description}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
      
      {/* Quick Stats Footer */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="text-xs text-gray-500 space-y-1">
          <div className="font-medium">Quick Access:</div>
          <div>• Sync OnCrawl data</div>
          <div>• Generate embeddings</div>
          <div>• View database stats</div>
        </div>
      </div>
    </div>
  );
}