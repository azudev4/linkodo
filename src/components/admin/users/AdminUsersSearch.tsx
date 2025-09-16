'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Filter } from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import { cn } from '@/lib/utils';
import { RefreshButton } from '@/components/ui/refresh-button';
import { SearchInput } from '@/components/ui/SearchInput';

interface AdminUsersSearchProps {
  onSearchChange: (search: string, role: string) => void;
  className?: string;
  delay?: number;
}

interface AnimationContainerProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

const AnimationContainer = ({ children, className, delay = 0.1 }: AnimationContainerProps) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      className={cn("w-full h-full", className)}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 30, scale: 0.95 }}
      transition={{
        delay: delay,
        duration: 0.6,
        type: "spring",
        stiffness: 80,
        damping: 12,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
    >
      {children}
    </motion.div>
  );
};

export function AdminUsersSearch({ onSearchChange, className, delay = 0 }: AdminUsersSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');

  // Manual search trigger
  const handleSearch = useCallback((search: string) => {
    setSearchTerm(search);
    onSearchChange(search, selectedRole);
  }, [selectedRole, onSearchChange]);

  // Handle role change immediately (dropdowns are cheap)
  const handleRoleChange = (role: string) => {
    setSelectedRole(role);
    onSearchChange(searchTerm, role);
  };

  // Handle clear search
  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
    onSearchChange('', selectedRole);
  }, [selectedRole, onSearchChange]);

  // Handle refresh - reset everything and reload
  const handleRefresh = useCallback(() => {
    setSearchTerm('');
    setSelectedRole('all');
    onSearchChange('', 'all');
  }, [onSearchChange]);

  // Initialize with empty search on mount
  useEffect(() => {
    onSearchChange('', 'all');
  }, [onSearchChange]);

  return (
    <AnimationContainer delay={delay} className={className}>
      <div className="bg-white rounded-2xl p-6 shadow-[0_0_40px_rgb(0,0,0,0.08)] border border-blue-100">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <SearchInput
              placeholder="Search users by name, email, or company..."
              value={searchTerm}
              onSearch={handleSearch}
              onClear={handleClearSearch}
              size="lg"
              className="w-full"
            />
          </div>

          {/* Role Filter & Refresh */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={selectedRole}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="early_access">Early Access</option>
              <option value="user">User</option>
              <option value="default">User (Legacy)</option>
            </select>

            {/* Refresh Button */}
            <RefreshButton
              onClick={handleRefresh}
              title="Refresh and reset filters"
              size="md"
            />
          </div>
        </div>
      </div>
    </AnimationContainer>
  );
}