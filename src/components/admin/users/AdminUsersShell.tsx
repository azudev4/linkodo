'use client';

import React from 'react';
import { motion, useInView } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Users, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminUsersTable } from './AdminUsersTable';

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

export function AdminUsersShell() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <AnimationContainer>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-4">
              User Management
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
              Platform{" "}
              <span className="text-transparent bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text">
                Users
              </span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Manage user accounts, permissions, and access levels across the platform.
            </p>
          </div>

        </div>
      </AnimationContainer>

      {/* Users Table */}
      <AdminUsersTable />
    </div>
  );
}