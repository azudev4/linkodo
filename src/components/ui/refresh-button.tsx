'use client';

import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface RefreshButtonProps {
  onClick: () => void | Promise<void>;
  className?: string;
  title?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function RefreshButton({
  onClick,
  className,
  title = "Refresh",
  disabled = false,
  size = 'md'
}: RefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const sizeClasses = {
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const handleClick = async () => {
    if (disabled || isRefreshing) return;

    setIsRefreshing(true);

    try {
      await onClick();

      // Complete the rotation animation
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500); // Time for one complete rotation
    } catch (error) {
      console.error('Refresh error:', error);
      setIsRefreshing(false);
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled || isRefreshing}
      className={cn(
        // Base styles
        "text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 border border-gray-200 hover:border-blue-200",
        // Size
        sizeClasses[size],
        // Disabled state
        disabled && "opacity-50 cursor-not-allowed hover:text-gray-400 hover:bg-transparent hover:border-gray-200",
        // Custom className
        className
      )}
      title={isRefreshing ? "Refreshing..." : title}
      whileHover={!disabled && !isRefreshing ? { scale: 1.05 } : {}}
      whileTap={!disabled && !isRefreshing ? { scale: 0.95 } : {}}
    >
      <motion.div
        animate={isRefreshing ? { rotate: 360 } : { rotate: 0 }}
        transition={{
          duration: isRefreshing ? 0.5 : 0.2,
          ease: isRefreshing ? "easeInOut" : "easeOut"
        }}
      >
        <RefreshCw className={cn(iconSizes[size])} />
      </motion.div>
    </motion.button>
  );
}