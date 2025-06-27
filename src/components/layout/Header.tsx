'use client';

import { Badge } from '@/components/ui/badge';
import { Database } from 'lucide-react';

export function Header() {
  // This would come from actual data later
  const indexedPagesCount = 1247;
  const isConnected = true;

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-medium text-gray-900">
            Internal Link Suggestions
          </h2>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Database className="w-4 h-4" />
            <span>{indexedPagesCount.toLocaleString()} pages indexed</span>
          </div>
          
          <Badge 
            variant={isConnected ? "default" : "destructive"}
            className="text-xs"
          >
            {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
        </div>
      </div>
    </header>
  );
}