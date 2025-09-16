'use client';

import React from 'react';
import { motion, useInView } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Users, Activity, Database, TrendingUp } from 'lucide-react';

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

const StatCard = ({ title, value, icon: Icon, trend, delay = 0 }: {
  title: string;
  value: string;
  icon: React.ElementType;
  trend?: string;
  delay?: number;
}) => (
  <AnimationContainer delay={delay}>
    <div className="bg-white rounded-2xl p-6 shadow-[0_0_40px_rgb(0,0,0,0.08)] hover:shadow-[0_0_80px_rgb(0,0,0,0.12)] transition-all duration-500 border border-blue-100 hover:border-blue-200">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
            {trend}
          </span>
        )}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
      <p className="text-gray-600 font-medium">{title}</p>
    </div>
  </AnimationContainer>
);

export function AdminOverviewShell() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <AnimationContainer>
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-6">
            Admin Dashboard
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
            System{" "}
            <span className="text-transparent bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text">
              Overview
            </span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Monitor system performance, user activity, and platform statistics.
          </p>
        </div>
      </AnimationContainer>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value="0"
          icon={Users}
          trend="+0%"
          delay={0.1}
        />
        <StatCard
          title="Active Sessions"
          value="0"
          icon={Activity}
          trend="+0%"
          delay={0.15}
        />
        <StatCard
          title="Total Crawls"
          value="0"
          icon={Database}
          trend="+0%"
          delay={0.2}
        />
        <StatCard
          title="Growth Rate"
          value="0%"
          icon={TrendingUp}
          trend="+0%"
          delay={0.25}
        />
      </div>

      {/* Profiles Table */}
      <AnimationContainer delay={0.3}>
        <div className="bg-white rounded-2xl shadow-[0_0_40px_rgb(0,0,0,0.08)] border border-blue-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900">Recent Profiles</h2>
            <p className="text-gray-600 mt-1">Latest user registrations and profile updates</p>
          </div>

          <div className="p-6">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No profiles yet</h3>
              <p className="text-gray-500">Profiles will appear here once users start registering.</p>
            </div>
          </div>
        </div>
      </AnimationContainer>
    </div>
  );
}