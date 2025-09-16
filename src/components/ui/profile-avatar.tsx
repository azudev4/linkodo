'use client';

import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileAvatarProps {
  avatar_url?: string | null;
  full_name?: string | null;
  role?: 'user' | 'early_access' | 'admin';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
}

export function ProfileAvatar({
  avatar_url,
  full_name,
  role = 'user',
  size = 'md',
  onClick,
  className
}: ProfileAvatarProps) {
  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-8 h-8',
    lg: 'w-9 h-9'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const getRoleStyles = (role: string) => {
    switch (role) {
      case 'admin':
        return {
          border: 'border border-red-500/60',
          gradient: 'from-red-50 to-red-100'
        };
      case 'early_access':
        return {
          border: 'border border-blue-500/60',
          gradient: 'from-blue-50 to-blue-100'
        };
      default:
        return {
          border: 'border border-gray-200',
          gradient: 'from-gray-50 to-gray-100'
        };
    }
  };

  const roleStyles = getRoleStyles(role);
  const initials = full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '';

  return (
    <div
      className={cn(
        'relative cursor-pointer transition-opacity hover:opacity-80',
        className
      )}
      onClick={onClick}
    >
      {/* Main Avatar */}
      <div
        className={cn(
          'rounded-full overflow-hidden',
          sizeClasses[size],
          roleStyles.border
        )}
      >
        {avatar_url ? (
          <img
            src={avatar_url}
            alt={full_name || 'Profile'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={cn(
            'w-full h-full flex items-center justify-center bg-gradient-to-br text-gray-600 font-medium',
            roleStyles.gradient
          )}>
            {initials ? (
              <span className={cn(
                'font-semibold',
                size === 'sm' ? 'text-xs' : size === 'md' ? 'text-xs' : 'text-sm'
              )}>
                {initials}
              </span>
            ) : (
              <User className={iconSizes[size]} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}