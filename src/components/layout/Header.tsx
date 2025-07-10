// src/components/layout/Header.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  Bell,
  Settings,
  User,
  LogOut,
  ChevronDown,
  Circle
} from 'lucide-react';

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const pathname = usePathname();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [hasNotifications, setHasNotifications] = useState(true);
  
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // For notifications
      if (isNotificationOpen &&
          notificationRef.current &&
          !notificationRef.current.contains(event.target as Node) &&
          !notificationButtonRef.current?.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
      
      // For profile
      if (isProfileOpen &&
          profileRef.current &&
          !profileRef.current.contains(event.target as Node) &&
          !profileButtonRef.current?.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isNotificationOpen, isProfileOpen]);



  // Mock notifications
  const notifications = [
    {
      id: 1,
      title: 'New suggestions generated',
      message: '15 new link opportunities found',
      time: '2 min ago',
      unread: true
    },
    {
      id: 2,
      title: 'Indexing complete',
      message: 'Successfully indexed 1,247 pages',
      time: '1 hour ago',
      unread: false
    }
  ];

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
            {/* Notifications */}
            <div className="relative">
              <Button
                ref={notificationButtonRef}
                variant="ghost"
                size="sm"
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="relative p-2 hover:bg-gray-100/60 transition-colors"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {hasNotifications && (
                  <Circle className="absolute -top-0.5 -right-0.5 w-2 h-2 fill-current text-red-500" />
                )}
              </Button>

              {/* Notification dropdown */}
              <AnimatePresence>
                {isNotificationOpen && (
                  <motion.div 
                    ref={notificationRef}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200/80 py-2 z-20"
                  >
                    <div className="px-4 py-3 border-b border-gray-100">
                      <h3 className="font-medium text-gray-900">Notifications</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`px-4 py-3 hover:bg-gray-50 transition-colors ${
                            notification.unread ? 'bg-blue-50/30' : ''
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                {notification.message}
                              </p>
                            </div>
                            {notification.unread && (
                              <Circle className="w-2 h-2 fill-current text-blue-500 mt-1 ml-2" />
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-2">
                            {notification.time}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="px-4 py-2 border-t border-gray-100">
                      <button className="text-sm text-blue-600 hover:text-blue-700 transition-colors">
                        View all notifications
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

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
                  <span className="text-white text-sm font-medium">JD</span>
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
                      <p className="text-sm font-medium text-gray-900">John Doe</p>
                      <p className="text-xs text-gray-500">john@example.com</p>
                    </div>
                    
                    <div className="py-1">
                      <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <User className="w-4 h-4 mr-3" />
                        Profile
                      </button>
                      <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <Settings className="w-4 h-4 mr-3" />
                        Settings
                      </button>
                    </div>
                    
                    <div className="border-t border-gray-100 pt-1">
                      <button className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
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