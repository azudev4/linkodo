'use client';

import { useState } from 'react';
import { ProfileModal } from '../profile/ProfileModal';
import { ProfileAvatar } from '@/components/ui/profile-avatar';
import { useProfile } from '@/lib/stores/useProfileStore';

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const { profile } = useProfile();

  return (
    <>
      <header className={`bg-white/95 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-30 ${className}`}>
        <div className="px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-lg font-medium text-gray-900">
                Unveil SEO
              </h1>
            </div>
            <div className="flex items-center">
              <ProfileAvatar
                avatar_url={profile?.avatar_url}
                full_name={profile?.full_name}
                role={profile?.role}
                size="lg"
                onClick={() => setIsProfileModalOpen(true)}
                className="mr-1"
              />
            </div>
          </div>
        </div>
      </header>

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </>
  );
}