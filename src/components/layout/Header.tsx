// src/components/layout/Header.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { 
  LogOut,
  ChevronDown
} from 'lucide-react';

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const profileRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isProfileOpen &&
          profileRef.current &&
          !profileRef.current.contains(event.target as Node) &&
          !profileButtonRef.current?.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileOpen]);

  return (
    <header className={`bg-white/95 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-30 ${className}`}>
      <div className="px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left section - Page title */}
          <div className="flex items-center">
            <h1 className="text-lg font-medium text-gray-900">
            </h1>
          </div>

          {/* Right section - Actions */}
          <div className="flex items-center space-x-2">
            {/* Profile dropdown */}
            <div className="relative">
              <Button
                ref={profileButtonRef}
                variant="ghost"
                size="sm"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 p-2 hover:bg-gray-100/60 transition-colors"
              >
                <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.username ? user.username.substring(0, 2).toUpperCase() : 'AD'}
                  </span>
                </div>
                <ChevronDown className="w-3 h-3 text-gray-500" />
              </Button>

              {/* Profile dropdown menu */}
              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div 
                    ref={profileRef}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200/80 py-2 z-20"
                  >
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user?.username || 'Admin'}</p>
                      <p className="text-xs text-gray-500">{user?.role || 'admin'}</p>
                    </div>
                    
                    <div className="py-1">
                      <button 
                        onClick={logout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Sign out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}